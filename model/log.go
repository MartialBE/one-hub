package model

import (
	"context"
	"fmt"
	"one-api/common"

	"gorm.io/gorm"
)

type Log struct {
	Id               int    `json:"id;index:idx_created_at_id,priority:1"`                                                 // 日志ID，用于排序和索引
	UserId           int    `json:"user_id" gorm:"index"`                                                                  // 用户ID，用于外键关联
	CreatedAt        int64  `json:"created_at" gorm:"bigint;index:idx_created_at_id,priority:2;index:idx_created_at_type"` // 创建时间，用于排序和索引
	Type             int    `json:"type" gorm:"index:idx_created_at_type"`                                                 // 日志类型，用于索引
	Content          string `json:"content"`                                                                               // 日志内容
	Username         string `json:"username" gorm:"index:index_username_model_name,priority:2;default:''"`                 // 用户名，用于索引和默认值为空字符串
	TokenName        string `json:"token_name" gorm:"index;default:''"`                                                    // 令牌名称，用于索引和默认值为空字符串
	ModelName        string `json:"model_name" gorm:"index;index:index_username_model_name,priority:1;default:''"`         // 模型名称，用于索引和默认值为空字符串
	Quota            int    `json:"quota" gorm:"default:0"`                                                                // 配额，默认值为0
	PromptTokens     int    `json:"prompt_tokens" gorm:"default:0"`                                                        // 提示令牌，默认值为0
	CompletionTokens int    `json:"completion_tokens" gorm:"default:0"`                                                    // 完成令牌，默认值为0
	ChannelId        int    `json:"channel" gorm:"index"`                                                                  // 频道ID，用于索引
}

type LogStatistic struct {
	// 日志统计信息结构体
	Day              string `gorm:"column:day"`               // 日志日期
	ModelName        string `gorm:"column:model_name"`        // 模型名称
	RequestCount     int    `gorm:"column:request_count"`     // 请求数量
	Quota            int    `gorm:"column:quota"`             // 配额
	PromptTokens     int    `gorm:"column:prompt_tokens"`     // 提示令牌数量
	CompletionTokens int    `gorm:"column:completion_tokens"` // 完成令牌数量
}

const (
	LogTypeUnknown = iota
	LogTypeTopup
	LogTypeConsume
	LogTypeManage
	LogTypeSystem
)

func RecordLog(userId int, logType int, content string) {
	if logType == LogTypeConsume && !common.LogConsumeEnabled {
		return
	}
	log := &Log{
		UserId:    userId,
		Username:  GetUsernameById(userId),
		CreatedAt: common.GetTimestamp(),
		Type:      logType,
		Content:   content,
	}
	err := DB.Create(log).Error
	if err != nil {
		common.SysError("failed to record log: " + err.Error())
	}
}

func RecordConsumeLog(ctx context.Context, userId int, channelId int, promptTokens int, completionTokens int, modelName string, tokenName string, quota int, content string) {
	common.LogInfo(ctx, fmt.Sprintf("record consume log: userId=%d, channelId=%d, promptTokens=%d, completionTokens=%d, modelName=%s, tokenName=%s, quota=%d, content=%s", userId, channelId, promptTokens, completionTokens, modelName, tokenName, quota, content))
	if !common.LogConsumeEnabled {
		return
	}
	log := &Log{
		UserId:           userId,
		Username:         GetUsernameById(userId),
		CreatedAt:        common.GetTimestamp(),
		Type:             LogTypeConsume,
		Content:          content,
		PromptTokens:     promptTokens,
		CompletionTokens: completionTokens,
		TokenName:        tokenName,
		ModelName:        modelName,
		Quota:            quota,
		ChannelId:        channelId,
	}
	err := DB.Create(log).Error
	if err != nil {
		common.LogError(ctx, "failed to record log: "+err.Error())
	}
}

func GetAllLogs(logType int, startTimestamp int64, endTimestamp int64, modelName string, username string, tokenName string, startIdx int, num int, channel int) (logs []*Log, err error) {
	var tx *gorm.DB
	if logType == LogTypeUnknown {
		tx = DB
	} else {
		tx = DB.Where("type = ?", logType)
	}
	if modelName != "" {
		tx = tx.Where("model_name = ?", modelName)
	}
	if username != "" {
		tx = tx.Where("username = ?", username)
	}
	if tokenName != "" {
		tx = tx.Where("token_name = ?", tokenName)
	}
	if startTimestamp != 0 {
		tx = tx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp != 0 {
		tx = tx.Where("created_at <= ?", endTimestamp)
	}
	if channel != 0 {
		tx = tx.Where("channel_id = ?", channel)
	}
	err = tx.Order("id desc").Limit(num).Offset(startIdx).Find(&logs).Error
	return logs, err
}

func GetUserLogs(userId int, logType int, startTimestamp int64, endTimestamp int64, modelName string, tokenName string, startIdx int, num int) (logs []*Log, err error) {
	var tx *gorm.DB
	if logType == LogTypeUnknown {
		tx = DB.Where("user_id = ?", userId)
	} else {
		tx = DB.Where("user_id = ? and type = ?", userId, logType)
	}
	if modelName != "" {
		tx = tx.Where("model_name = ?", modelName)
	}
	if tokenName != "" {
		tx = tx.Where("token_name = ?", tokenName)
	}
	if startTimestamp != 0 {
		tx = tx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp != 0 {
		tx = tx.Where("created_at <= ?", endTimestamp)
	}
	err = tx.Order("id desc").Limit(num).Offset(startIdx).Omit("id").Find(&logs).Error
	return logs, err
}

func SearchAllLogs(keyword string) (logs []*Log, err error) {
	err = DB.Where("type = ? or content LIKE ?", keyword, keyword+"%").Order("id desc").Limit(common.MaxRecentItems).Find(&logs).Error
	return logs, err
}

func SearchUserLogs(userId int, keyword string) (logs []*Log, err error) {
	err = DB.Where("user_id = ? and type = ?", userId, keyword).Order("id desc").Limit(common.MaxRecentItems).Omit("id").Find(&logs).Error
	return logs, err
}

func SumUsedQuota(logType int, startTimestamp int64, endTimestamp int64, modelName string, username string, tokenName string, channel int) (quota int) {
	tx := DB.Table("logs").Select(assembleSumSelectStr("quota"))
	if username != "" {
		tx = tx.Where("username = ?", username)
	}
	if tokenName != "" {
		tx = tx.Where("token_name = ?", tokenName)
	}
	if startTimestamp != 0 {
		tx = tx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp != 0 {
		tx = tx.Where("created_at <= ?", endTimestamp)
	}
	if modelName != "" {
		tx = tx.Where("model_name = ?", modelName)
	}
	if channel != 0 {
		tx = tx.Where("channel_id = ?", channel)
	}
	tx.Where("type = ?", LogTypeConsume).Scan(&quota)
	return quota
}

func SumUsedToken(logType int, startTimestamp int64, endTimestamp int64, modelName string, username string, tokenName string) (token int) {
	tx := DB.Table("logs").Select(assembleSumSelectStr("prompt_tokens") + " + " + assembleSumSelectStr("completion_tokens"))
	if username != "" {
		tx = tx.Where("username = ?", username)
	}
	if tokenName != "" {
		tx = tx.Where("token_name = ?", tokenName)
	}
	if startTimestamp != 0 {
		tx = tx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp != 0 {
		tx = tx.Where("created_at <= ?", endTimestamp)
	}
	if modelName != "" {
		tx = tx.Where("model_name = ?", modelName)
	}
	tx.Where("type = ?", LogTypeConsume).Scan(&token)
	return token
}

func DeleteOldLog(targetTimestamp int64) (int64, error) {
	result := DB.Where("created_at < ?", targetTimestamp).Delete(&Log{})
	return result.RowsAffected, result.Error
}

func SearchLogsByDayAndModel(user_id, start, end int) (LogStatistics []*LogStatistic, err error) {
	err = DB.Raw(`
		SELECT TO_CHAR(date_trunc('day', to_timestamp(created_at)), 'YYYY-MM-DD') as day,
		model_name, count(1) as request_count,
		sum(quota) as quota,
		sum(prompt_tokens) as prompt_tokens,
		sum(completion_tokens) as completion_tokens
		FROM logs
		WHERE type=2
		AND user_id= ?
		AND created_at BETWEEN ? AND ?
		GROUP BY day, model_name
		ORDER BY day, model_name
	`, user_id, start, end).Scan(&LogStatistics).Error

	fmt.Println(user_id, start, end)

	return LogStatistics, err
}

func assembleSumSelectStr(selectStr string) string {
	sumSelectStr := "%s(sum(%s),0)"
	nullfunc := "ifnull"
	if common.UsingPostgreSQL {
		nullfunc = "coalesce"
	}

	sumSelectStr = fmt.Sprintf(sumSelectStr, nullfunc, selectStr)

	return sumSelectStr
}
