package relay

import (
	"errors"
	"fmt"
	"math"
	"net/http"
	"one-api/common"
	"one-api/common/config"
	"one-api/common/image"
	"one-api/common/logger"
	"one-api/common/requester"
	"one-api/metrics"
	"one-api/providers/claude"
	"one-api/relay/relay_util"
	"one-api/types"

	"github.com/gin-gonic/gin"
)

var AllowChannelType = []int{config.ChannelTypeAnthropic, config.ChannelTypeVertexAI, config.ChannelTypeBedrock}

func RelaycClaudeOnly(c *gin.Context) {
	request := &claude.ClaudeRequest{}

	if err := common.UnmarshalBodyReusable(c, request); err != nil {
		common.AbortWithErr(c, http.StatusBadRequest, claude.ErrorToClaudeErr(err))
		return
	}
	c.Set("allow_channel_type", AllowChannelType)

	chatProvider, modelName, fail := GetClaudeChatInterface(c, request.Model)
	if fail != nil {
		common.AbortWithErr(c, http.StatusServiceUnavailable, claude.ErrorToClaudeErr(fail))
		return
	}

	originalModel := request.Model
	request.Model = modelName

	channel := chatProvider.GetChannel()
	originaPreCostType := channel.PreCost

	promptTokens, tonkeErr := CountTokenMessages(request, originaPreCostType)
	if tonkeErr != nil {
		common.AbortWithErr(c, http.StatusBadRequest, claude.ErrorToClaudeErr(tonkeErr))
		return
	}

	errWithCode, done := RelayClaudeHandler(c, promptTokens, chatProvider, request, originalModel)

	if errWithCode == nil {
		metrics.RecordProvider(c, 200)
		return
	}

	apiErr := errWithCode.ToOpenAiError()

	go processChannelRelayError(c.Request.Context(), channel.Id, channel.Name, apiErr, channel.Type)

	retryTimes := config.RetryTimes
	if done || !shouldRetry(c, apiErr, channel.Type) {
		logger.LogError(c.Request.Context(), fmt.Sprintf("relay error happen, status code is %d, won't retry in this case", apiErr.StatusCode))
		retryTimes = 0
	}

	for i := retryTimes; i > 0; i-- {
		// 冻结通道
		shouldCooldowns(c, channel, apiErr)
		chatProvider, modelName, fail := GetClaudeChatInterface(c, originalModel)
		if fail != nil {
			continue
		}
		request.Model = modelName
		channel = chatProvider.GetChannel()
		logger.LogError(c.Request.Context(), fmt.Sprintf("using channel #%d(%s) to retry (remain times %d)", channel.Id, channel.Name, i))

		if originaPreCostType != channel.PreCost {
			originaPreCostType = channel.PreCost
			promptTokens, tonkeErr = CountTokenMessages(request, originaPreCostType)
			if tonkeErr != nil {
				common.AbortWithErr(c, http.StatusBadRequest, claude.ErrorToClaudeErr(tonkeErr))
				return
			}
		}

		errWithCode, done = RelayClaudeHandler(c, promptTokens, chatProvider, request, originalModel)
		if errWithCode == nil {
			metrics.RecordProvider(c, 200)
			return
		}

		apiErr = errWithCode.ToOpenAiError()
		go processChannelRelayError(c.Request.Context(), channel.Id, channel.Name, apiErr, channel.Type)
		if done || !shouldRetry(c, apiErr, channel.Type) {
			break
		}
	}

	if errWithCode != nil {
		if apiErr.StatusCode == http.StatusTooManyRequests {
			apiErr.OpenAIError.Message = "当前分组上游负载已饱和，请稍后再试"
		}
		common.AbortWithErr(c, errWithCode.StatusCode, &errWithCode.ClaudeError)
	}
}

func RelayClaudeHandler(c *gin.Context, promptTokens int, chatProvider claude.ClaudeChatInterface, request *claude.ClaudeRequest, originalModel string) (errWithCode *claude.ClaudeErrorWithStatusCode, done bool) {

	usage := &types.Usage{
		PromptTokens: promptTokens,
	}
	chatProvider.SetUsage(usage)

	quota := relay_util.NewQuota(c, request.Model, promptTokens)
	if err := quota.PreQuotaConsumption(); err != nil {
		return claude.OpenaiErrToClaudeErr(err), true
	}

	errWithCode, done = SendClaude(c, chatProvider, request)

	if errWithCode != nil {
		quota.Undo(c)
		return
	}

	quota.Consume(c, usage, request.Stream)

	return
}

func SendClaude(c *gin.Context, chatProvider claude.ClaudeChatInterface, request *claude.ClaudeRequest) (errWithCode *claude.ClaudeErrorWithStatusCode, done bool) {
	if request.Stream {
		var response requester.StreamReaderInterface[string]
		response, errWithCode = chatProvider.CreateClaudeChatStream(request)
		if errWithCode != nil {
			return
		}

		doneStr := func() string {
			return ""
		}
		responseGeneralStreamClient(c, response, doneStr)
	} else {
		var response *claude.ClaudeResponse
		response, errWithCode = chatProvider.CreateClaudeChat(request)
		if errWithCode != nil {
			return
		}

		openErr := responseJsonClient(c, response)

		if openErr != nil {
			errWithCode = claude.OpenaiErrToClaudeErr(openErr)
		}
	}

	if errWithCode != nil {
		done = true
	}

	return
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

func GetClaudeChatInterface(c *gin.Context, modelName string) (claude.ClaudeChatInterface, string, *claude.ClaudeError) {
	provider, modelName, fail := GetProvider(c, modelName)
	if fail != nil {
		return nil, "", claude.ErrorToClaudeErr(fail)
	}

	chatProvider, ok := provider.(claude.ClaudeChatInterface)
	if !ok {
		return nil, "", claude.ErrorToClaudeErr(errors.New("channel not implemented"))
	}

	return chatProvider, modelName, nil
}
