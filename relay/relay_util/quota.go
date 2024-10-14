package relay_util

import (
	"context"
	"errors"
	"fmt"
	"math"
	"net/http"
	"one-api/common"
	"one-api/common/config"
	"one-api/common/logger"
	"one-api/model"
	"one-api/types"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type Quota struct {
	modelName        string
	promptTokens     int
	price            model.Price
	groupRatio       float64
	inputRatio       float64
	outputRatio      float64
	preConsumedQuota int
	cacheQuota       int
	userId           int
	channelId        int
	tokenId          int
	HandelStatus     bool
}

func NewQuota(c *gin.Context, modelName string, promptTokens int) *Quota {
	quota := &Quota{
		modelName:    modelName,
		promptTokens: promptTokens,
		userId:       c.GetInt("id"),
		channelId:    c.GetInt("channel_id"),
		tokenId:      c.GetInt("token_id"),
		HandelStatus: false,
	}

	quota.price = *PricingInstance.GetPrice(quota.modelName)
	quota.groupRatio = common.GetGroupRatio(c.GetString("group"))
	quota.inputRatio = quota.price.GetInput() * quota.groupRatio
	quota.outputRatio = quota.price.GetOutput() * quota.groupRatio

	return quota
}

func (q *Quota) PreQuotaConsumption() *types.OpenAIErrorWithStatusCode {
	if q.price.Type == model.TimesPriceType {
		q.preConsumedQuota = int(1000 * q.inputRatio)
	} else if q.price.Input != 0 || q.price.Output != 0 {
		q.preConsumedQuota = int(float64(q.promptTokens)*q.inputRatio) + config.PreConsumedQuota
	}

	if q.preConsumedQuota == 0 {
		return nil
	}

	userQuota, err := model.CacheGetUserQuota(q.userId)
	if err != nil {
		return common.ErrorWrapper(err, "get_user_quota_failed", http.StatusInternalServerError)
	}

	if userQuota < q.preConsumedQuota {
		return common.ErrorWrapper(errors.New("user quota is not enough"), "insufficient_user_quota", http.StatusPaymentRequired)
	}

	err = model.CacheDecreaseUserQuota(q.userId, q.preConsumedQuota)
	if err != nil {
		return common.ErrorWrapper(err, "decrease_user_quota_failed", http.StatusInternalServerError)
	}

	if userQuota > 100*q.preConsumedQuota {
		// in this case, we do not pre-consume quota
		// because the user has enough quota
		q.preConsumedQuota = 0
		// common.LogInfo(c.Request.Context(), fmt.Sprintf("user %d has enough quota %d, trusted and no need to pre-consume", userId, userQuota))
	}

	if q.preConsumedQuota > 0 {
		err := model.PreConsumeTokenQuota(q.tokenId, q.preConsumedQuota)
		if err != nil {
			return common.ErrorWrapper(err, "pre_consume_token_quota_failed", http.StatusForbidden)
		}
		q.HandelStatus = true
	}

	return nil
}

// 更新用户实时配额
func (q *Quota) UpdateUserRealtimeQuota(usage *types.UsageEvent, nowUsage *types.UsageEvent) error {
	usage.Merge(nowUsage)

	// 不开启Redis，则不更新实时配额
	if !config.RedisEnabled {
		return nil
	}

	promptTokens, completionTokens := q.getComputeTokensByUsageEvent(nowUsage)
	increaseQuota := q.GetTotalQuota(promptTokens, completionTokens)

	cacheQuota, err := model.CacheIncreaseUserRealtimeQuota(q.userId, increaseQuota)
	if err != nil {
		return errors.New("error update user realtime quota cache: " + err.Error())
	}

	q.cacheQuota += increaseQuota
	userQuota, err := model.CacheGetUserQuota(q.userId)
	if err != nil {
		return errors.New("error get user quota cache: " + err.Error())
	}

	if cacheQuota >= int64(userQuota) {
		return errors.New("user quota is not enough")
	}

	return nil
}

func (q *Quota) completedQuotaConsumption(usage *types.Usage, tokenName string, isStream bool, ctx context.Context) error {
	defer func() {
		if q.cacheQuota > 0 {
			model.CacheDecreaseUserRealtimeQuota(q.userId, q.cacheQuota)
		}
	}()

	quota := q.GetTotalQuotaByUsage(usage)
	if quota == 0 {
		return fmt.Errorf("user_id: %d, channel_id: %d, token_id: %d, quota is 0", q.userId, q.channelId, q.tokenId)
	}

	quotaDelta := quota - q.preConsumedQuota
	err := model.PostConsumeTokenQuota(q.tokenId, quotaDelta)
	if err != nil {
		return errors.New("error consuming token remain quota: " + err.Error())
	}
	err = model.CacheUpdateUserQuota(q.userId)
	if err != nil {
		return errors.New("error consuming token remain quota: " + err.Error())
	}

	model.RecordConsumeLog(
		ctx,
		q.userId,
		q.channelId,
		usage.PromptTokens,
		usage.CompletionTokens,
		q.modelName,
		tokenName,
		quota,
		q.getLogContent(),
		getRequestTime(ctx),
		isStream,
		q.GetLogMeta(usage),
	)
	model.UpdateUserUsedQuotaAndRequestCount(q.userId, quota)
	model.UpdateChannelUsedQuota(q.channelId, quota)

	return nil
}

func (q *Quota) Undo(c *gin.Context) {
	tokenId := c.GetInt("token_id")
	if q.HandelStatus {
		go func(ctx context.Context) {
			// return pre-consumed quota
			err := model.PostConsumeTokenQuota(tokenId, -q.preConsumedQuota)
			if err != nil {
				logger.LogError(ctx, "error return pre-consumed quota: "+err.Error())
			}
		}(c.Request.Context())
	}
}

func (q *Quota) Consume(c *gin.Context, usage *types.Usage, isStream bool) {
	tokenName := c.GetString("token_name")
	// 如果没有报错，则消费配额
	go func(ctx context.Context) {
		err := q.completedQuotaConsumption(usage, tokenName, isStream, ctx)
		if err != nil {
			logger.LogError(ctx, err.Error())
		}
	}(c.Request.Context())
}

func (q *Quota) GetInputRatio() float64 {
	return q.inputRatio
}

func (q *Quota) GetLogMeta(usage *types.Usage) map[string]any {
	meta := map[string]any{
		"price_type":   q.price.Type,
		"group_ratio":  q.groupRatio,
		"input_ratio":  q.inputRatio,
		"output_ratio": q.outputRatio,
	}

	if usage != nil {
		sysTokens := usage.SysTokensDetails
		if sysTokens.CachedTokens != 0 {
			meta["cached_tokens"] = sysTokens.CachedTokens
		}
		if sysTokens.InputAudioTokens != 0 {
			meta["input_audio_tokens"] = sysTokens.InputAudioTokens
		}
		if sysTokens.InputTextTokens != 0 {
			meta["input_text_tokens"] = sysTokens.InputTextTokens
		}
		if sysTokens.OutputAudioTokens != 0 {
			meta["output_audio_tokens"] = sysTokens.OutputAudioTokens
		}
		if sysTokens.OutputTextTokens != 0 {
			meta["output_text_tokens"] = sysTokens.OutputTextTokens
		}
	}

	return meta
}

func getRequestTime(ctx context.Context) int {
	requestTime := 0
	requestStartTimeValue := ctx.Value("requestStartTime")
	if requestStartTimeValue != nil {
		requestStartTime, ok := requestStartTimeValue.(time.Time)
		if ok {
			requestTime = int(time.Since(requestStartTime).Milliseconds())
		}
	}
	return requestTime
}

func (q *Quota) getLogContent() string {
	modelRatioStr := ""

	if q.price.Type == model.TimesPriceType {
		price := q.price.FetchInputCurrencyPrice(model.DollarRate)
		if price == "0" {
			modelRatioStr = "免费"
		} else {
			modelRatioStr = fmt.Sprintf("$%s/次", price)
		}
	} else {
		inputPrice := q.price.FetchInputCurrencyPrice(model.DollarRate)
		outputPrice := q.price.FetchOutputCurrencyPrice(model.DollarRate)

		if inputPrice == "0" && outputPrice == "0" {
			modelRatioStr = "免费"
		} else if q.price.GetInput() == q.price.GetOutput() {
			if inputPrice == "0" {
				modelRatioStr = "免费"
			} else {
				modelRatioStr = fmt.Sprintf("$%s/1k", inputPrice)
			}
		} else {
			var inputStr, outputStr string
			if inputPrice == "0" {
				inputStr = "免费"
			} else {
				inputStr = fmt.Sprintf("$%s/1k", inputPrice)
			}
			if outputPrice == "0" {
				outputStr = "免费"
			} else {
				outputStr = fmt.Sprintf("$%s/1k", outputPrice)
			}
			modelRatioStr = fmt.Sprintf("%s (输入) | %s (输出)", inputStr, outputStr)
		}
	}

	if strings.HasPrefix(q.modelName, "gpt-4o-realtime") {
		modelRatioStr += "| 音频输入 20 倍，音频输出 10 倍"
	}

	return fmt.Sprintf("模型费率 %s，分组倍率 %.2f", modelRatioStr, q.groupRatio)
}

// 通过 token 数获取消费配额
func (q *Quota) GetTotalQuota(promptTokens, completionTokens int) (quota int) {
	if q.price.Type == model.TimesPriceType {
		quota = int(1000 * q.inputRatio)
	} else {
		quota = int(math.Ceil((float64(promptTokens) * q.inputRatio) + (float64(completionTokens) * q.outputRatio)))
	}

	if q.inputRatio != 0 && quota <= 0 {
		quota = 1
	}
	totalTokens := promptTokens + completionTokens
	if totalTokens == 0 {
		// in this case, must be some error happened
		// we cannot just return, because we may have to return the pre-consumed quota
		quota = 0
	}

	return quota
}

// 获取计算的 token 数
func (q *Quota) getComputeTokensByUsage(usage *types.Usage) (promptTokens, completionTokens int) {
	promptTokens = usage.PromptTokens
	completionTokens = usage.CompletionTokens
	details := usage.SysTokensDetails

	if details.CachedTokens > 0 {
		promptTokens -= details.CachedTokens / 2
	}

	if details.InputAudioTokens > 0 {
		promptTokens += details.InputAudioTokens * 19
	}

	if details.OutputAudioTokens > 0 {
		completionTokens += details.OutputAudioTokens * 9
	}

	return
}

func (q *Quota) getComputeTokensByUsageEvent(usage *types.UsageEvent) (promptTokens, completionTokens int) {
	promptTokens = usage.InputTokens
	completionTokens = usage.OutputTokens

	if inputDetails := usage.InputTokenDetails; inputDetails != nil {
		if inputDetails.CachedTokens > 0 {
			promptTokens -= inputDetails.CachedTokens / 2
		}
		if inputDetails.AudioTokens > 0 {
			promptTokens += inputDetails.AudioTokens * 19
		}
	}

	if outputDetails := usage.OutputTokenDetails; outputDetails != nil && outputDetails.AudioTokens > 0 {
		completionTokens += outputDetails.AudioTokens * 9
	}

	return
}

// 通过 usage 获取消费配额
func (q *Quota) GetTotalQuotaByUsage(usage *types.Usage) (quota int) {
	promptTokens, completionTokens := q.getComputeTokensByUsage(usage)
	return q.GetTotalQuota(promptTokens, completionTokens)
}
