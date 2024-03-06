package relay

import (
	"context"
	"errors"
	"fmt"
	"math"
	"net/http"
	"one-api/common"
	"one-api/model"
	"one-api/types"
	"time"

	"github.com/gin-gonic/gin"
)

type QuotaInfo struct {
	modelName         string
	promptTokens      int
	preConsumedTokens int
	modelRatio        []float64
	groupRatio        float64
	ratio             float64
	preConsumedQuota  int
	userId            int
	channelId         int
	tokenId           int
	HandelStatus      bool
}

// generateQuotaInfo 生成 QuotaInfo 结构体实例，并进行预消费配额操作
func generateQuotaInfo(c *gin.Context, modelName string, promptTokens int) (*QuotaInfo, *types.OpenAIErrorWithStatusCode) {
	// 创建 QuotaInfo 实例
	quotaInfo := &QuotaInfo{
		modelName:    modelName,
		promptTokens: promptTokens,
		userId:       c.GetInt("id"),
		channelId:    c.GetInt("channel_id"),
		tokenId:      c.GetInt("token_id"),
		HandelStatus: false,
	}
	// 初始化 QuotaInfo 实例的 group 字段
	quotaInfo.initQuotaInfo(c.GetString("group"))

	// 进行预消费配额操作
	errWithCode := quotaInfo.preQuotaConsumption()
	if errWithCode != nil {
		return nil, errWithCode
	}

	return quotaInfo, nil
}

func (q *QuotaInfo) initQuotaInfo(groupName string) {
	modelRatio := common.GetModelRatio(q.modelName)
	groupRatio := common.GetGroupRatio(groupName)
	preConsumedTokens := common.PreConsumedQuota
	ratio := modelRatio[0] * groupRatio
	preConsumedQuota := int(float64(q.promptTokens+preConsumedTokens) * ratio)

	q.preConsumedTokens = preConsumedTokens
	q.modelRatio = modelRatio
	q.groupRatio = groupRatio
	q.ratio = ratio
	q.preConsumedQuota = preConsumedQuota

}

func (q *QuotaInfo) preQuotaConsumption() *types.OpenAIErrorWithStatusCode {
	userQuota, err := model.CacheGetUserQuota(q.userId)
	if err != nil {
		return common.ErrorWrapper(err, "get_user_quota_failed", http.StatusInternalServerError)
	}

	if userQuota < q.preConsumedQuota {
		return common.ErrorWrapper(errors.New("user quota is not enough"), "insufficient_user_quota", http.StatusForbidden)
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

func (q *QuotaInfo) completedQuotaConsumption(usage *types.Usage, tokenName string, ctx context.Context) error {
	quota := 0
	completionRatio := q.modelRatio[1] * q.groupRatio
	promptTokens := usage.PromptTokens
	completionTokens := usage.CompletionTokens
	quota = int(math.Ceil(((float64(promptTokens) * q.ratio) + (float64(completionTokens) * completionRatio))))
	if q.ratio != 0 && quota <= 0 {
		quota = 1
	}
	totalTokens := promptTokens + completionTokens
	if totalTokens == 0 {
		// in this case, must be some error happened
		// we cannot just return, because we may have to return the pre-consumed quota
		quota = 0
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
	if quota != 0 {
		requestTime := 0
		requestStartTimeValue := ctx.Value("requestStartTime")
		if requestStartTimeValue != nil {
			requestStartTime, ok := requestStartTimeValue.(time.Time)
			if ok {
				requestTime = int(time.Since(requestStartTime).Milliseconds())
			}
		}

		var logContent string
		if q.modelRatio[0] == q.modelRatio[1] {
			// 如果两个值相等，则只输出一个经过乘以0.002处理的值
			logContent = fmt.Sprintf("单价: $%.4f/1k tokens", q.modelRatio[0]*0.002)
		} else {
			// 如果两个值不相等，则分别输出提示和输出的乘以0.002的结果
			logContent = fmt.Sprintf("提示: $%.4f/1k tokens, 补全: $%.4f/1k tokens", q.modelRatio[0]*0.002, q.modelRatio[1]*0.002)
		}

		model.RecordConsumeLog(ctx, q.userId, q.channelId, promptTokens, completionTokens, q.modelName, tokenName, quota, logContent, requestTime)
		model.UpdateUserUsedQuotaAndRequestCount(q.userId, quota)
		model.UpdateChannelUsedQuota(q.channelId, quota)
	}

	return nil
}

func (q *QuotaInfo) undo(c *gin.Context) {
	tokenId := c.GetInt("token_id")
	if q.HandelStatus {
		go func(ctx context.Context) {
			// return pre-consumed quota
			err := model.PostConsumeTokenQuota(tokenId, -q.preConsumedQuota)
			if err != nil {
				common.LogError(ctx, "error return pre-consumed quota: "+err.Error())
			}
		}(c.Request.Context())
	}
}

func (q *QuotaInfo) consume(c *gin.Context, usage *types.Usage) {
	tokenName := c.GetString("token_name")
	// 如果没有报错，则消费配额
	go func(ctx context.Context) {
		err := q.completedQuotaConsumption(usage, tokenName, ctx)
		if err != nil {
			common.LogError(ctx, err.Error())
		}
	}(c.Request.Context())
}
