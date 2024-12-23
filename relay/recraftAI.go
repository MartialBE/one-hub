package relay

import (
	"errors"
	"fmt"
	"net/http"
	"one-api/common"
	"one-api/common/config"
	"one-api/common/logger"
	"one-api/metrics"
	"one-api/providers/recraftAI"
	"one-api/relay/relay_util"
	"one-api/types"
	"strings"

	"github.com/gin-gonic/gin"
)

func RelayRecraftAI(c *gin.Context) {
	model := Path2RecraftAIModel(c.Request.URL.Path)

	usage := &types.Usage{
		PromptTokens: 1,
	}

	recraftProvider, err := getRecraftProvider(c, model)
	if err != nil {
		common.AbortWithMessage(c, http.StatusServiceUnavailable, err.Error())
		return
	}

	recraftProvider.SetUsage(usage)

	quota := relay_util.NewQuota(c, model, 1)
	if err := quota.PreQuotaConsumption(); err != nil {
		common.AbortWithMessage(c, http.StatusServiceUnavailable, err.Error())
		return
	}

	requestURL := strings.Replace(c.Request.URL.Path, "/recraftAI", "", 1)
	response, apiErr := recraftProvider.CreateRelay(requestURL)
	if apiErr == nil {
		quota.Consume(c, usage, false)

		metrics.RecordProvider(c, 200)
		errWithCode := responseMultipart(c, response)
		logger.LogError(c.Request.Context(), fmt.Sprintf("relay error happen %v, won't retry in this case", errWithCode))
		return
	}

	channel := recraftProvider.GetChannel()
	go processChannelRelayError(c.Request.Context(), channel.Id, channel.Name, apiErr, channel.Type)

	retryTimes := config.RetryTimes
	if !shouldRetry(c, apiErr, channel.Type) {
		logger.LogError(c.Request.Context(), fmt.Sprintf("relay error happen, status code is %d, won't retry in this case", apiErr.StatusCode))
		retryTimes = 0
	}

	for i := retryTimes; i > 0; i-- {
		shouldCooldowns(c, channel, apiErr)
		if recraftProvider, err = getRecraftProvider(c, model); err != nil {
			continue
		}

		channel = recraftProvider.GetChannel()
		logger.LogError(c.Request.Context(), fmt.Sprintf("using channel #%d(%s) to retry (remain times %d)", channel.Id, channel.Name, i))

		response, apiErr := recraftProvider.CreateRelay(requestURL)
		if apiErr == nil {
			quota.Consume(c, usage, false)

			metrics.RecordProvider(c, 200)
			errWithCode := responseMultipart(c, response)
			logger.LogError(c.Request.Context(), fmt.Sprintf("relay error happen %v, won't retry in this case", errWithCode))
			return
		}

		go processChannelRelayError(c.Request.Context(), channel.Id, channel.Name, apiErr, channel.Type)
		if !shouldRetry(c, apiErr, channel.Type) {
			break
		}
	}

	quota.Undo(c)
	relayResponseWithErr(c, apiErr)
}

func Path2RecraftAIModel(path string) string {
	parts := strings.Split(path, "/")
	lastPart := parts[len(parts)-1]

	return "recraft_" + lastPart
}

func getRecraftProvider(c *gin.Context, model string) (*recraftAI.RecraftProvider, error) {
	provider, _, fail := GetProvider(c, model)
	if fail != nil {
		// common.AbortWithMessage(c, http.StatusServiceUnavailable, fail.Error())
		return nil, fail
	}

	recraftProvider, ok := provider.(*recraftAI.RecraftProvider)
	if !ok {
		return nil, errors.New("provider not found")
	}

	return recraftProvider, nil
}
