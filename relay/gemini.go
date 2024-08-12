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
	"one-api/model"
	"one-api/providers/gemini"
	"one-api/relay/relay_util"
	"one-api/types"
	"strings"

	"github.com/gin-gonic/gin"
)

var AllowGeminiChannelType = []int{config.ChannelTypeGemini}

func RelaycGeminiOnly(c *gin.Context) {
	modelAction := c.Param("model")
	if modelAction == "" {
		common.AbortWithErr(c, http.StatusBadRequest, gemini.ErrorToGeminiErr(errors.New("model is required")))
		return
	}

	modelList := strings.Split(modelAction, ":")
	if len(modelList) != 2 {
		common.AbortWithErr(c, http.StatusBadRequest, gemini.ErrorToGeminiErr(errors.New("model error")))
		return
	}

	isStream := false
	if modelList[1] == "streamGenerateContent" {
		isStream = true
	}

	request := &gemini.GeminiChatRequest{}

	if err := common.UnmarshalBodyReusable(c, request); err != nil {
		common.AbortWithErr(c, http.StatusBadRequest, gemini.ErrorToGeminiErr(err))
		return
	}

	request.Model = modelList[0]
	request.Stream = isStream

	c.Set("allow_channel_type", AllowGeminiChannelType)

	cacheProps := relay_util.NewChatCacheProps(c, true)
	cacheProps.SetHash(request)

	cache := cacheProps.GetCache()

	if cache != nil {
		// 说明有缓存， 直接返回缓存内容
		cacheProcessing(c, cache, request.Stream)
		return
	}

	chatProvider, modelName, fail := GetGeminiChatInterface(c, request.Model)
	if fail != nil {
		common.AbortWithErr(c, http.StatusServiceUnavailable, fail)
		return
	}

	originalModel := request.Model
	request.Model = modelName

	channel := chatProvider.GetChannel()
	originaPreCostType := channel.PreCost

	promptTokens, tonkeErr := CountGeminiTokenMessages(request, originaPreCostType)
	if tonkeErr != nil {
		common.AbortWithErr(c, http.StatusBadRequest, gemini.ErrorToGeminiErr(tonkeErr))
		return
	}

	errWithCode, done := RelayGeminiHandler(c, promptTokens, chatProvider, cacheProps, request, originalModel)

	if errWithCode == nil {
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
		model.ChannelGroup.Cooldowns(channel.Id)
		chatProvider, modelName, fail := GetGeminiChatInterface(c, originalModel)
		if fail != nil {
			continue
		}
		request.Model = modelName
		channel = chatProvider.GetChannel()
		logger.LogError(c.Request.Context(), fmt.Sprintf("using channel #%d(%s) to retry (remain times %d)", channel.Id, channel.Name, i))

		if originaPreCostType != channel.PreCost {
			originaPreCostType = channel.PreCost
			promptTokens, tonkeErr = CountGeminiTokenMessages(request, originaPreCostType)
			if tonkeErr != nil {
				common.AbortWithErr(c, http.StatusBadRequest, gemini.ErrorToGeminiErr(tonkeErr))
				return
			}
		}

		errWithCode, done = RelayGeminiHandler(c, promptTokens, chatProvider, cacheProps, request, originalModel)
		if errWithCode == nil {
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
		common.AbortWithErr(c, errWithCode.StatusCode, &errWithCode.GeminiErrorResponse)
	}
}

func RelayGeminiHandler(c *gin.Context, promptTokens int, chatProvider gemini.GeminiChatInterface, cache *relay_util.ChatCacheProps, request *gemini.GeminiChatRequest, originalModel string) (errWithCode *gemini.GeminiErrorWithStatusCode, done bool) {

	usage := &types.Usage{
		PromptTokens: promptTokens,
	}
	chatProvider.SetUsage(usage)

	var quota *relay_util.Quota
	quota, err := relay_util.NewQuota(c, request.Model, promptTokens)
	if err != nil {
		return gemini.OpenaiErrToGeminiErr(err), true
	}

	errWithCode, done = SendGemini(c, chatProvider, cache, request)

	if errWithCode != nil {
		quota.Undo(c)
		return
	}

	quota.Consume(c, usage)
	if usage.CompletionTokens > 0 {
		go cache.StoreCache(c.GetInt("channel_id"), usage.PromptTokens, usage.CompletionTokens, originalModel)
	}

	return
}

func SendGemini(c *gin.Context, chatProvider gemini.GeminiChatInterface, cache *relay_util.ChatCacheProps, request *gemini.GeminiChatRequest) (errWithCode *gemini.GeminiErrorWithStatusCode, done bool) {
	if request.Stream {
		var response requester.StreamReaderInterface[string]
		response, errWithCode = chatProvider.CreateGeminiChatStream(request)
		if errWithCode != nil {
			return
		}

		doneStr := func() string {
			return ""
		}
		responseGeneralStreamClient(c, response, cache, doneStr)
	} else {
		var response *gemini.GeminiChatResponse
		response, errWithCode = chatProvider.CreateGeminiChat(request)
		if errWithCode != nil {
			return
		}

		openErr := responseJsonClient(c, response)
		if openErr == nil && len(response.Candidates) > 0 {
			cache.SetResponse(response)
		}

		if openErr != nil {
			errWithCode = gemini.OpenaiErrToGeminiErr(openErr)
		}
	}

	if errWithCode != nil {
		done = true
	}

	return
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

func GetGeminiChatInterface(c *gin.Context, modelName string) (gemini.GeminiChatInterface, string, *gemini.GeminiErrorResponse) {
	fmt.Println(modelName)
	provider, modelName, fail := GetProvider(c, modelName)
	if fail != nil {
		return nil, "", gemini.ErrorToGeminiErr(fail)
	}

	chatProvider, ok := provider.(gemini.GeminiChatInterface)
	if !ok {
		return nil, "", gemini.ErrorToGeminiErr(errors.New("channel not implemented"))
	}

	return chatProvider, modelName, nil
}
