package relay

import (
	"math"
	"net/http"
	"one-api/common"
	"one-api/common/config"
	"one-api/common/image"
	"one-api/common/requester"
	"one-api/providers/claude"
	"one-api/types"

	"github.com/gin-gonic/gin"
)

var AllowChannelType = []int{config.ChannelTypeAnthropic, config.ChannelTypeVertexAI, config.ChannelTypeBedrock}

type relayClaudeOnly struct {
	relayBase
	claudeRequest *claude.ClaudeRequest
}

func NewRelayClaudeOnly(c *gin.Context) *relayClaudeOnly {
	c.Set("allow_channel_type", AllowChannelType)
	relay := &relayClaudeOnly{}
	relay.c = c

	return relay
}

func (r *relayClaudeOnly) setRequest() error {
	r.claudeRequest = &claude.ClaudeRequest{}
	if err := common.UnmarshalBodyReusable(r.c, r.claudeRequest); err != nil {
		return err
	}
	r.setOriginalModel(r.claudeRequest.Model)
	return nil
}

func (r *relayClaudeOnly) getRequest() interface{} {
	return r.claudeRequest
}

func (r *relayClaudeOnly) IsStream() bool {
	return r.claudeRequest.Stream
}

func (r *relayClaudeOnly) getPromptTokens() (int, error) {
	channel := r.provider.GetChannel()
	return CountTokenMessages(r.claudeRequest, channel.PreCost)
}

func (r *relayClaudeOnly) send() (err *types.OpenAIErrorWithStatusCode, done bool) {
	chatProvider, ok := r.provider.(claude.ClaudeChatInterface)
	if !ok {
		err = common.StringErrorWrapperLocal("channel not implemented", "channel_error", http.StatusServiceUnavailable)
		done = true
		return
	}

	r.claudeRequest.Model = r.modelName

	if r.claudeRequest.Stream {
		var response requester.StreamReaderInterface[string]
		response, err = chatProvider.CreateClaudeChatStream(r.claudeRequest)
		if err != nil {
			return
		}

		doneStr := func() string {
			return ""
		}
		firstResponseTime := responseGeneralStreamClient(r.c, response, doneStr)
		r.SetFirstResponseTime(firstResponseTime)
	} else {
		var response *claude.ClaudeResponse
		response, err = chatProvider.CreateClaudeChat(r.claudeRequest)
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

func (r *relayClaudeOnly) HandleError(err *types.OpenAIErrorWithStatusCode) {
	newErr := FilterOpenAIErr(r.c, err)

	claudeErr := claude.OpenaiErrToClaudeErr(&newErr)

	r.c.JSON(newErr.StatusCode, claudeErr.ClaudeError)
}

func CountTokenMessages(request *claude.ClaudeRequest, preCostType int) (int, error) {
	if preCostType == config.PreContNotAll {
		return 0, nil
	}

	tokenEncoder := common.GetTokenEncoder(request.Model)

	tokenNum := 0

	tokensPerMessage := 4

	for _, message := range request.Messages {
		tokenNum += tokensPerMessage
		switch v := message.Content.(type) {
		case string:
			tokenNum += common.GetTokenNum(tokenEncoder, v)
		case []any:
			for _, m := range v {
				content := m.(map[string]any)
				switch content["type"] {
				case "text":
					tokenNum += common.GetTokenNum(tokenEncoder, content["text"].(string))
				case "image":
					if preCostType == config.PreCostNotImage {
						continue
					}
					imageSource, ok := content["source"].(map[string]any)
					if !ok {
						continue
					}

					width, height, err := image.GetImageSizeFromBase64(imageSource["data"].(string))
					if err != nil {
						return 0, err
					}
					tokenNum += int(math.Ceil((float64(width) * float64(height)) / 750))
				case "tool_result", "tool_use":
					// 不算了  就只算他50吧
					tokenNum += 50
				}
			}
		}
	}

	return tokenNum, nil
}
