package relay

import (
	"errors"
	"math"
	"one-api/common"
	"one-api/common/config"
	"one-api/common/image"
	"one-api/common/requester"
	"one-api/providers/gemini"
	"one-api/types"
	"strings"

	"github.com/gin-gonic/gin"
)

var AllowGeminiChannelType = []int{config.ChannelTypeGemini}

type relayGeminiOnly struct {
	relayBase
	geminiRequest *gemini.GeminiChatRequest
}

func NewRelayGeminiOnly(c *gin.Context) *relayGeminiOnly {
	c.Set("allow_channel_type", AllowGeminiChannelType)
	relay := &relayGeminiOnly{}
	relay.c = c

	return relay
}

func (r *relayGeminiOnly) setRequest() error {
	modelAction := r.c.Param("model")

	if modelAction == "" {
		return errors.New("model is required")
	}

	modelList := strings.Split(modelAction, ":")
	if len(modelList) != 2 {
		return errors.New("model error")
	}

	isStream := false
	if modelList[1] == "streamGenerateContent" {
		isStream = true
	}

	r.geminiRequest = &gemini.GeminiChatRequest{}
	if err := common.UnmarshalBodyReusable(r.c, r.geminiRequest); err != nil {
		return err
	}
	r.geminiRequest.Model = modelList[0]
	r.geminiRequest.Stream = isStream
	r.setOriginalModel(r.geminiRequest.Model)

	return nil
}

func (r *relayGeminiOnly) getRequest() interface{} {
	return r.geminiRequest
}

func (r *relayGeminiOnly) IsStream() bool {
	return r.geminiRequest.Stream
}

func (r *relayGeminiOnly) getPromptTokens() (int, error) {
	channel := r.provider.GetChannel()
	return CountGeminiTokenMessages(r.geminiRequest, channel.PreCost)
}

func (r *relayGeminiOnly) send() (err *types.OpenAIErrorWithStatusCode, done bool) {
	chatProvider, ok := r.provider.(gemini.GeminiChatInterface)
	if !ok {
		return nil, false
	}

	r.geminiRequest.Model = r.modelName

	if r.geminiRequest.Stream {
		var response requester.StreamReaderInterface[string]
		response, err = chatProvider.CreateGeminiChatStream(r.geminiRequest)
		if err != nil {
			return
		}

		doneStr := func() string {
			return ""
		}
		firstResponseTime := responseGeneralStreamClient(r.c, response, doneStr)
		r.SetFirstResponseTime(firstResponseTime)
	} else {
		var response *gemini.GeminiChatResponse
		response, err = chatProvider.CreateGeminiChat(r.geminiRequest)
		if err != nil {
			return
		}

		err = responseJsonClient(r.c, response)
	}

	if err != nil {
		done = true
	}

	return
}

func (r *relayGeminiOnly) HandleError(err *types.OpenAIErrorWithStatusCode) {
	newErr := FilterOpenAIErr(r.c, err)

	geminiErr := gemini.OpenaiErrToGeminiErr(&newErr)

	r.c.JSON(newErr.StatusCode, geminiErr.GeminiErrorResponse)
}

func CountGeminiTokenMessages(request *gemini.GeminiChatRequest, preCostType int) (int, error) {
	if preCostType == config.PreContNotAll {
		return 0, nil
	}

	tokenEncoder := common.GetTokenEncoder(request.Model)

	tokenNum := 0
	tokensPerMessage := 4

	for _, message := range request.Contents {
		tokenNum += tokensPerMessage
		for _, part := range message.Parts {
			if part.Text != "" {
				tokenNum += common.GetTokenNum(tokenEncoder, part.Text)
			}

			if part.InlineData != nil {
				if preCostType == config.PreCostNotImage {
					continue
				}

				width, height, err := image.GetImageSizeFromBase64(part.InlineData.Data)
				if err != nil {
					return 0, err
				}
				tokenNum += int(math.Ceil((float64(width) * float64(height)) / 750))
			}
		}
	}

	return tokenNum, nil
}
