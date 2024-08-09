package model

import (
	"fmt"
	"one-api/common"
	"time"
)

type Statistics struct {
	Date             time.Time `gorm:"primary_key;type:date" json:"date"`
	UserId           int       `json:"user_id" gorm:"primary_key"`
	ChannelId        int       `json:"channel_id" gorm:"primary_key"`
	ModelName        string    `json:"model_name" gorm:"primary_key;type:varchar(255)"`
	RequestCount     int       `json:"request_count"`
	Quota            int       `json:"quota"`
	PromptTokens     int       `json:"prompt_tokens"`
	CompletionTokens int       `json:"completion_tokens"`
	RequestTime      int       `json:"request_time"`
}

func GetUserModelStatisticsByPeriod(userId int, startTime, endTime string) (LogStatistic []*LogStatisticGroupModel, err error) {
	dateStr := "date"
	if common.UsingPostgreSQL {
		dateStr = "TO_CHAR(date, 'YYYY-MM-DD') as date"
	} else if common.UsingSQLite {
		dateStr = "strftime('%Y-%m-%d', date) as date"
	}

	err = DB.Raw(`
		SELECT `+dateStr+`,
		model_name, 
		sum(request_count) as request_count,
		sum(quota) as quota,
		sum(prompt_tokens) as prompt_tokens,
		sum(completion_tokens) as completion_tokens,
		sum(request_time) as request_time
		FROM statistics
		WHERE user_id= ?
		AND date BETWEEN ? AND ?
		GROUP BY date, model_name
		ORDER BY date, model_name
	`, userId, startTime, endTime).Scan(&LogStatistic).Error
	return
}

func GetChannelExpensesStatisticsByPeriod(startTime, endTime string) (LogStatistics []*LogStatisticGroupChannel, err error) {
	dateStr := "date"
	if common.UsingPostgreSQL {
		dateStr = "TO_CHAR(date, 'YYYY-MM-DD') as date"
	} else if common.UsingSQLite {
		dateStr = "strftime('%Y-%m-%d', date) as date"
	}
	err = DB.Raw(`
		SELECT `+dateStr+`,
		sum(request_count) as request_count,
		sum(quota) as quota,
		sum(prompt_tokens) as prompt_tokens,
		sum(completion_tokens) as completion_tokens,
		sum(request_time) as request_time,
		MAX(channels.name) AS channel
		FROM statistics
		JOIN channels ON statistics.channel_id = channels.id
		WHERE date BETWEEN ? AND ?
		GROUP BY date, channel_id
		ORDER BY date, channel_id
	`, startTime, endTime).Scan(&LogStatistics).Error

	return LogStatistics, err
}

type StatisticsUpdateType int

const (
	StatisticsUpdateTypeToDay     StatisticsUpdateType = 1
	StatisticsUpdateTypeYesterday StatisticsUpdateType = 2
	StatisticsUpdateTypeALL       StatisticsUpdateType = 3
)

func UpdateStatistics(updateType StatisticsUpdateType) error {
	sql := `
	%s statistics (date, user_id, channel_id, model_name, request_count, quota, prompt_tokens, completion_tokens, request_time)
	SELECT 
		%s as date,
		user_id,
		channel_id,
		model_name, 
		count(1) as request_count,
		sum(quota) as quota,
		sum(prompt_tokens) as prompt_tokens,
		sum(completion_tokens) as completion_tokens,
		sum(request_time) as request_time
	FROM logs
	WHERE
		type = 2
		%s
	GROUP BY date, channel_id, user_id, model_name
	ORDER BY date, model_name
	%s
	`

	sqlPrefix := ""
	sqlWhere := ""
	sqlDate := ""
	sqlSuffix := ""
	if common.UsingSQLite {
		sqlPrefix = "INSERT OR REPLACE INTO"
		sqlDate = "strftime('%Y-%m-%d', datetime(created_at, 'unixepoch', '+8 hours'))"
		sqlSuffix = ""
	} else if common.UsingPostgreSQL {
		sqlPrefix = "INSERT INTO"
		sqlDate = "DATE_TRUNC('day', TO_TIMESTAMP(created_at))::DATE"
		sqlSuffix = `ON CONFLICT (date, user_id, channel_id, model_name) DO UPDATE SET
		request_count = EXCLUDED.request_count,
		quota = EXCLUDED.quota,
		prompt_tokens = EXCLUDED.prompt_tokens,
		completion_tokens = EXCLUDED.completion_tokens,
		request_time = EXCLUDED.request_time`
	} else {
		sqlPrefix = "INSERT INTO"
		sqlDate = "DATE_FORMAT(FROM_UNIXTIME(created_at), '%Y-%m-%d')"
		sqlSuffix = `ON DUPLICATE KEY UPDATE
		request_count = VALUES(request_count),
		quota = VALUES(quota),
		prompt_tokens = VALUES(prompt_tokens),
		completion_tokens = VALUES(completion_tokens),
		request_time = VALUES(request_time)`
	}
	now := time.Now()
	todayTimestamp := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).Unix()

	switch updateType {
	case StatisticsUpdateTypeToDay:
		sqlWhere = fmt.Sprintf("AND created_at >= %d", todayTimestamp)
	case StatisticsUpdateTypeYesterday:
		yesterdayTimestamp := todayTimestamp - 86400
		sqlWhere = fmt.Sprintf("AND created_at >= %d AND created_at < %d", yesterdayTimestamp, todayTimestamp)
	}

	err := DB.Exec(fmt.Sprintf(sql, sqlPrefix, sqlDate, sqlWhere, sqlSuffix)).Error
	return err
}
