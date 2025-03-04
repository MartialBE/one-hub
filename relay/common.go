package relay

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"one-api/common"
	"one-api/common/config"
	"one-api/common/logger"
	"one-api/common/requester"
	"one-api/common/utils"
	"one-api/controller"
	"one-api/metrics"
	"one-api/model"
	"one-api/providers"
	providersBase "one-api/providers/base"
	"one-api/types"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func Path2Relay(c *gin.Context, path string) RelayBaseInterface {
	var relay RelayBaseInterface
	if strings.HasPrefix(path, "/v1/chat/completions") {
		relay = NewRelayChat(c)
	} else if strings.HasPrefix(path, "/v1/completions") {
		relay = NewRelayCompletions(c)
	} else if strings.HasPrefix(path, "/v1/embeddings") {
		relay = NewRelayEmbeddings(c)
	} else if strings.HasPrefix(path, "/v1/moderations") {
		relay = NewRelayModerations(c)
	} else if strings.HasPrefix(path, "/v1/images/generations") || strings.HasPrefix(path, "/recraftAI/v1/images/generations") {
		relay = NewRelayImageGenerations(c)
	} else if strings.HasPrefix(path, "/v1/images/edits") {
		relay = NewRelayImageEdits(c)
	} else if strings.HasPrefix(path, "/v1/images/variations") {
		relay = NewRelayImageVariations(c)
	} else if strings.HasPrefix(path, "/v1/audio/speech") {
		relay = NewRelaySpeech(c)
	} else if strings.HasPrefix(path, "/v1/audio/transcriptions") {
		relay = NewRelayTranscriptions(c)
	} else if strings.HasPrefix(path, "/v1/audio/translations") {
		relay = NewRelayTranslations(c)
	} else if strings.HasPrefix(path, "/claude") {
		relay = NewRelayClaudeOnly(c)
	} else if strings.HasPrefix(path, "/gemini") {
		relay = NewRelayGeminiOnly(c)
	}

	return relay
}

func GetProvider(c *gin.Context, modelName string) (provider providersBase.ProviderInterface, newModelName string, fail error) {
	channel, fail := fetchChannel(c, modelName)
	if fail != nil {
		return
	}
	c.Set("channel_id", channel.Id)
	c.Set("channel_type", channel.Type)

	provider = providers.GetProvider(channel, c)
	if provider == nil {
		fail = errors.New("channel not found")
		return
	}
	provider.SetOriginalModel(modelName)
	c.Set("original_model", modelName)

	newModelName, fail = provider.ModelMappingHandler(modelName)
	if fail != nil {
		return
	}

	BillingOriginalModel := false

	if strings.HasPrefix(newModelName, "+") {
		newModelName = newModelName[1:]
		BillingOriginalModel = true
	}

	c.Set("new_model", newModelName)
	c.Set("billing_original_model", BillingOriginalModel)

	return
}

func fetchChannel(c *gin.Context, modelName string) (channel *model.Channel, fail error) {
	channelId := c.GetInt("specific_channel_id")
	ignore := c.GetBool("specific_channel_id_ignore")
	if channelId > 0 && !ignore {
		return fetchChannelById(channelId)
	}

	return fetchChannelByModel(c, modelName)
}

func fetchChannelById(channelId int) (*model.Channel, error) {
	channel, err := model.GetChannelById(channelId)
	if err != nil {
		return nil, errors.New("无效的渠道 Id")
	}
	if channel.Status != config.ChannelStatusEnabled {
		return nil, errors.New("该渠道已被禁用")
	}

	return channel, nil
}

func fetchChannelByModel(c *gin.Context, modelName string) (*model.Channel, error) {
	group := c.GetString("token_group")
	skipOnlyChat := c.GetBool("skip_only_chat")
	var filters []model.ChannelsFilterFunc
	if skipOnlyChat {
		filters = append(filters, model.FilterOnlyChat())
	}

	skipChannelIds, ok := utils.GetGinValue[[]int](c, "skip_channel_ids")
	if ok {
		filters = append(filters, model.FilterChannelId(skipChannelIds))
	}

	if types, exists := c.Get("allow_channel_type"); exists {
		if allowTypes, ok := types.([]int); ok {
			filters = append(filters, model.FilterChannelTypes(allowTypes))
		}
	}

	channel, err := model.ChannelGroup.Next(group, modelName, filters...)
	if err != nil {
		message := fmt.Sprintf("当前分组 %s 下对于模型 %s 无可用渠道", group, modelName)
		if channel != nil {
			logger.SysError(fmt.Sprintf("渠道不存在：%d", channel.Id))
			message = "数据库一致性已被破坏，请联系管理员"
		}
		return nil, errors.New(message)
	}

	return channel, nil
}

func responseJsonClient(c *gin.Context, data interface{}) *types.OpenAIErrorWithStatusCode {
	// 将data转换为 JSON
	responseBody, err := json.Marshal(data)
	if err != nil {
		return common.ErrorWrapperLocal(err, "marshal_response_body_failed", http.StatusInternalServerError)
	}

	c.Writer.Header().Set("Content-Type", "application/json")
	c.Writer.WriteHeader(http.StatusOK)
	_, err = c.Writer.Write(responseBody)
	if err != nil {
		return common.ErrorWrapperLocal(err, "write_response_body_failed", http.StatusInternalServerError)
	}

	return nil
}

type StreamEndHandler func() string

func responseStreamClient(c *gin.Context, stream requester.StreamReaderInterface[string], endHandler StreamEndHandler) (firstResponseTime time.Time, errWithOP *types.OpenAIErrorWithStatusCode) {
	requester.SetEventStreamHeaders(c)
	dataChan, errChan := stream.Recv()

	// 创建一个done channel用于通知处理完成
	done := make(chan struct{})
	var finalErr *types.OpenAIErrorWithStatusCode

	defer stream.Close()

	var isFirstResponse bool

	// 在新的goroutine中处理stream数据
	go func() {
		defer close(done)

		for {
			select {
			case data, ok := <-dataChan:
				if !ok {
					return
				}
				streamData := "data: " + data + "\n\n"

				if !isFirstResponse {
					firstResponseTime = time.Now()
					isFirstResponse = true
				}

				// 尝试写入数据，如果客户端断开也继续处理
				select {
				case <-c.Request.Context().Done():
					// 客户端已断开，不执行任何操作，直接跳过
				default:
					// 客户端正常，发送数据
					c.Writer.Write([]byte(streamData))
					c.Writer.Flush()
				}

			case err := <-errChan:
				if !errors.Is(err, io.EOF) {
					// 处理错误情况
					errMsg := "data: " + err.Error() + "\n\n"
					select {
					case <-c.Request.Context().Done():
						// 客户端已断开，不执行任何操作，直接跳过
					default:
						// 客户端正常，发送错误信息
						c.Writer.Write([]byte(errMsg))
						c.Writer.Flush()
					}

					finalErr = common.StringErrorWrapper(err.Error(), "stream_error", 900)
					logger.LogError(c.Request.Context(), "Stream err:"+err.Error())
				} else {
					// 正常结束，处理endHandler
					if finalErr == nil && endHandler != nil {
						streamData := endHandler()
						if streamData != "" {
							select {
							case <-c.Request.Context().Done():
								// 客户端已断开，不执行任何操作，直接跳过
							default:
								// 客户端正常，发送数据
								c.Writer.Write([]byte("data: " + streamData + "\n\n"))
								c.Writer.Flush()
							}
						}
					}

					// 发送结束标记
					streamData := "data: [DONE]\n\n"
					select {
					case <-c.Request.Context().Done():
						// 客户端已断开，不执行任何操作，直接跳过
					default:
						c.Writer.Write([]byte(streamData))
						c.Writer.Flush()
					}
				}
				return
			}
		}
	}()

	// 等待处理完成
	<-done
	return firstResponseTime, nil
}

func responseGeneralStreamClient(c *gin.Context, stream requester.StreamReaderInterface[string], endHandler StreamEndHandler) (firstResponseTime time.Time) {
	requester.SetEventStreamHeaders(c)
	dataChan, errChan := stream.Recv()

	// 创建一个done channel用于通知处理完成
	done := make(chan struct{})
	// var finalErr *types.OpenAIErrorWithStatusCode

	defer stream.Close()
	var isFirstResponse bool

	// 在新的goroutine中处理stream数据
	go func() {
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
				case <-c.Request.Context().Done():
					// 客户端已断开，不执行任何操作，直接跳过
				default:
					// 客户端正常，发送数据
					fmt.Fprint(c.Writer, data)
					c.Writer.Flush()
				}

			case err := <-errChan:
				if !errors.Is(err, io.EOF) {
					// 处理错误情况
					select {
					case <-c.Request.Context().Done():
						// 客户端已断开，不执行任何操作，直接跳过
					default:
						// 客户端正常，发送错误信息
						fmt.Fprint(c.Writer, err.Error())
						c.Writer.Flush()
					}

					logger.LogError(c.Request.Context(), "Stream err:"+err.Error())
				} else {
					// 正常结束，处理endHandler
					if endHandler != nil {
						streamData := endHandler()
						if streamData != "" {
							select {
							case <-c.Request.Context().Done():
								// 客户端已断开，只记录数据
							default:
								// 客户端正常，发送数据
								fmt.Fprint(c.Writer, streamData)
								c.Writer.Flush()
							}
						}
					}
				}
				return
			}
		}
	}()

	// 等待处理完成
	<-done

	return firstResponseTime
}

func responseMultipart(c *gin.Context, resp *http.Response) *types.OpenAIErrorWithStatusCode {
	defer resp.Body.Close()

	for k, v := range resp.Header {
		c.Writer.Header().Set(k, v[0])
	}

	c.Writer.WriteHeader(resp.StatusCode)

	_, err := io.Copy(c.Writer, resp.Body)
	if err != nil {
		return common.ErrorWrapper(err, "write_response_body_failed", http.StatusInternalServerError)
	}

	return nil
}

func responseCustom(c *gin.Context, response *types.AudioResponseWrapper) *types.OpenAIErrorWithStatusCode {
	for k, v := range response.Headers {
		c.Writer.Header().Set(k, v)
	}
	c.Writer.WriteHeader(http.StatusOK)

	_, err := c.Writer.Write(response.Body)
	if err != nil {
		return common.ErrorWrapper(err, "write_response_body_failed", http.StatusInternalServerError)
	}

	return nil
}

func responseCache(c *gin.Context, response string, isStream bool) {
	if isStream {
		requester.SetEventStreamHeaders(c)
		c.Stream(func(w io.Writer) bool {
			fmt.Fprint(w, response)
			return false
		})
	} else {
		c.Data(http.StatusOK, "application/json", []byte(response))
	}

}

func shouldRetry(c *gin.Context, apiErr *types.OpenAIErrorWithStatusCode, channelType int) bool {
	channelId := c.GetInt("specific_channel_id")
	ignore := c.GetBool("specific_channel_id_ignore")

	if apiErr == nil {
		return false
	}

	metrics.RecordProvider(c, apiErr.StatusCode)

	if apiErr.LocalError ||
		(channelId > 0 && !ignore) {
		return false
	}

	switch apiErr.StatusCode {
	case http.StatusTooManyRequests, http.StatusTemporaryRedirect:
		return true
	case http.StatusRequestTimeout, http.StatusGatewayTimeout, 524:
		return false
	case http.StatusBadRequest:
		return shouldRetryBadRequest(channelType, apiErr)
	}

	if apiErr.StatusCode/100 == 5 {
		return true
	}

	if apiErr.StatusCode/100 == 2 {
		return false
	}
	return true
}

func shouldRetryBadRequest(channelType int, apiErr *types.OpenAIErrorWithStatusCode) bool {
	switch channelType {
	case config.ChannelTypeAnthropic:
		return strings.Contains(apiErr.OpenAIError.Message, "Your credit balance is too low")
	case config.ChannelTypeBedrock:
		return strings.Contains(apiErr.OpenAIError.Message, "Operation not allowed")
	default:
		// gemini
		if apiErr.OpenAIError.Param == "INVALID_ARGUMENT" && strings.Contains(apiErr.OpenAIError.Message, "API key not valid") {
			return true
		}
		return false
	}
}

func processChannelRelayError(ctx context.Context, channelId int, channelName string, err *types.OpenAIErrorWithStatusCode, channelType int) {
	logger.LogError(ctx, fmt.Sprintf("relay error (channel #%d(%s)): %s", channelId, channelName, err.Message))
	if controller.ShouldDisableChannel(channelType, err) {
		controller.DisableChannel(channelId, channelName, err.Message, true)
	}
}

var (
	requestIdRegex = regexp.MustCompile(`\(request id: [^\)]+\)`)
	quotaKeywords  = []string{"余额", "额度", "quota", "无可用渠道", "令牌"}
)

func FilterOpenAIErr(c *gin.Context, err *types.OpenAIErrorWithStatusCode) (errWithStatusCode types.OpenAIErrorWithStatusCode) {
	newErr := types.OpenAIErrorWithStatusCode{}
	if err != nil {
		newErr = *err
	}

	if newErr.StatusCode == http.StatusTooManyRequests {
		newErr.OpenAIError.Message = "当前分组上游负载已饱和，请稍后再试"
	}

	// 如果message中已经包含 request id: 则不再添加
	if strings.Contains(newErr.Message, "(request id:") {
		newErr.Message = requestIdRegex.ReplaceAllString(newErr.Message, "")
	}

	requestId := c.GetString(logger.RequestIdKey)
	newErr.OpenAIError.Message = utils.MessageWithRequestId(newErr.OpenAIError.Message, requestId)

	if !newErr.LocalError && newErr.OpenAIError.Type == "one_hub_error" || strings.HasSuffix(newErr.OpenAIError.Type, "_api_error") {
		newErr.OpenAIError.Type = "system_error"
		if utils.ContainsString(newErr.Message, quotaKeywords) {
			newErr.Message = "上游负载已饱和，请稍后再试"
			newErr.StatusCode = http.StatusTooManyRequests
		}
	}

	if code, ok := newErr.OpenAIError.Code.(string); ok && code == "bad_response_status_code" && !strings.Contains(newErr.OpenAIError.Message, "bad response status code") {
		newErr.OpenAIError.Message = fmt.Sprintf("Provider API error: bad response status code %s", newErr.OpenAIError.Param)
	}

	return newErr
}

func relayResponseWithOpenAIErr(c *gin.Context, err *types.OpenAIErrorWithStatusCode) {
	c.JSON(err.StatusCode, gin.H{
		"error": err.OpenAIError,
	})
}

func relayRerankResponseWithErr(c *gin.Context, err *types.OpenAIErrorWithStatusCode) {
	// 如果message中已经包含 request id: 则不再添加
	if !strings.Contains(err.Message, "request id:") {
		requestId := c.GetString(logger.RequestIdKey)
		err.OpenAIError.Message = utils.MessageWithRequestId(err.OpenAIError.Message, requestId)
	}

	if err.OpenAIError.Type == "new_api_error" || err.OpenAIError.Type == "one_api_error" {
		err.OpenAIError.Type = "system_error"
	}

	c.JSON(err.StatusCode, gin.H{
		"detail": err.OpenAIError.Message,
	})
}
