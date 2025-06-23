package relay

import (
	"errors"
	"io"
	"net/http"
	"one-api/common"
	"one-api/common/logger"
	"one-api/common/requester"
	providersBase "one-api/providers/base"
	"one-api/relay/relay_util"
	"one-api/types"
	"time"

	"github.com/bytedance/gopkg/util/gopool"
	"github.com/gin-gonic/gin"
)

type relayResponses struct {
	relayBase
	responsesRequest types.OpenAIResponsesRequest
}

func NewRelayResponses(c *gin.Context) *relayResponses {
	relay := &relayResponses{}
	relay.c = c
	return relay
}

func (r *relayResponses) setRequest() error {
	if err := common.UnmarshalBodyReusable(r.c, &r.responsesRequest); err != nil {
		return err
	}

	r.setOriginalModel(r.responsesRequest.Model)

	return nil
}

func (r *relayResponses) getRequest() interface{} {
	return &r.responsesRequest
}

func (r *relayResponses) IsStream() bool {
	return r.responsesRequest.Stream
}

func (r *relayResponses) getPromptTokens() (int, error) {
	channel := r.provider.GetChannel()
	return common.CountTokenInputMessages(r.responsesRequest.Input, r.modelName, channel.PreCost), nil
}

func (r *relayResponses) send() (err *types.OpenAIErrorWithStatusCode, done bool) {
	r.responsesRequest.Model = r.modelName
	channel := r.provider.GetChannel()
	responsesProvider, ok := r.provider.(providersBase.ResponsesInterface)
	if !ok || channel.CompatibleResponse || !r.provider.GetSupportedResponse() {
		// 做一层Chat的兼容
		chatProvider, ok := r.provider.(providersBase.ChatInterface)
		if !ok {
			err = common.StringErrorWrapperLocal("channel not implemented", "channel_error", http.StatusServiceUnavailable)
			done = true
			return
		}

		return r.compatibleSend(chatProvider)
	}

	if r.responsesRequest.Stream {
		var response requester.StreamReaderInterface[string]
		response, err = responsesProvider.CreateResponsesStream(&r.responsesRequest)
		if err != nil {
			return
		}

		doneStr := func() string {
			return ""
		}

		firstResponseTime := responseGeneralStreamClient(r.c, response, doneStr)
		r.SetFirstResponseTime(firstResponseTime)
	} else {
		var response *types.OpenAIResponsesResponses
		response, err = responsesProvider.CreateResponses(&r.responsesRequest)
		if err != nil {
			return
		}
		openErr := responseJsonClient(r.c, response)

		if openErr != nil {
			err = openErr
		}
	}

	if err != nil {
		done = true
	}

	return
}

func (r *relayResponses) compatibleSend(chatProvider providersBase.ChatInterface) (errWithCode *types.OpenAIErrorWithStatusCode, done bool) {
	chatReq, err := r.responsesRequest.ToChatCompletionRequest()
	if err != nil {
		return common.ErrorWrapperLocal(err, "invalid_claude_config", http.StatusInternalServerError), true
	}

	if r.responsesRequest.Stream {
		var response requester.StreamReaderInterface[string]
		response, errWithCode = chatProvider.CreateChatCompletionStream(chatReq)
		if errWithCode != nil {
			return
		}
		firstResponseTime := r.chatToResponseStreamClient(response)
		r.SetFirstResponseTime(firstResponseTime)
	} else {
		var response *types.ChatCompletionResponse
		response, errWithCode = chatProvider.CreateChatCompletion(chatReq)
		if errWithCode != nil {
			return
		}

		responseResp := response.ToResponses(&r.responsesRequest)
		responseJsonClient(r.c, responseResp)
	}

	if errWithCode != nil {
		done = true
	}

	return
}

// 将chat转换成兼容的responses流处理
func (r *relayResponses) chatToResponseStreamClient(stream requester.StreamReaderInterface[string]) (firstResponseTime time.Time) {
	requester.SetEventStreamHeaders(r.c)
	dataChan, errChan := stream.Recv()

	// 创建一个done channel用于通知处理完成
	done := make(chan struct{})

	defer stream.Close()
	var isFirstResponse bool

	converter := relay_util.NewOpenAIResponsesStreamConverter(r.c, &r.responsesRequest, r.provider.GetUsage())

	// 在新的goroutine中处理stream数据
	gopool.Go(func() {
		defer close(done)

		for {
			select {
			case data, ok := <-dataChan:
				if !ok {
					return
				}

				if !isFirstResponse {
					firstResponseTime = time.Now()
					isFirstResponse = true
				}

				// 尝试写入数据，如果客户端断开也继续处理
				select {
				case <-r.c.Request.Context().Done():
					// 客户端已断开，不执行任何操作，直接跳过
				default:
					// 客户端正常，发送数据
					converter.ProcessStreamData(data)
				}

			case err := <-errChan:
				if !errors.Is(err, io.EOF) {
					// 处理错误情况
					select {
					case <-r.c.Request.Context().Done():
						// 客户端已断开，不执行任何操作，直接跳过
					default:
						// 客户端正常，发送错误信息
						converter.ProcessError(err.Error())
					}

					logger.LogError(r.c.Request.Context(), "Stream err:"+err.Error())
				} else {
					// 要发送最后的完成状态
					converter.ProcessStreamData("[DONE]")
				}
				return
			}
		}
	})

	// 等待处理完成
	<-done
	return firstResponseTime
}
