package model

import (
	"errors"
	"fmt"
	"one-api/common"
	"one-api/common/logger"
	"strings"
	"time"
)

type StatisticsMonth struct {
	Date             time.Time `gorm:"primary_key;type:datetime" json:"date"`
	UserId           int       `json:"user_id" gorm:"primary_key"`
	ModelName        string    `json:"model_name" gorm:"primary_key;type:varchar(255)"`
	RequestCount     int       `json:"request_count"`
	Quota            int       `json:"quota"`
	PromptTokens     int       `json:"prompt_tokens"`
	CompletionTokens int       `json:"completion_tokens"`
	RequestTime      int       `json:"request_time"`
}

// StatisticsMonthNoModel 表示按月份统计的模型数据结构，用于存储请求数量、配额和令牌等信息。
type StatisticsMonthNoModel struct {
	Date             string `gorm:"column:date" json:"date"`                           //账单时间
	RequestCount     int    `gorm:"column:request_count" json:"request_count"`         //请求总数
	Quota            int    `gorm:"column:quota" json:"quota"`                         //消费金额
	PromptTokens     int    `gorm:"column:prompt_tokens" json:"prompt_tokens"`         //输入TOKEN
	CompletionTokens int    `gorm:"column:completion_tokens" json:"completion_tokens"` //输出TOKEN
	RequestTime      int    `gorm:"column:request_time" json:"request_time"`           //请求时长
}

type StatisticsMonthModel struct {
	Date             string `gorm:"column:date" json:"date"`                           //账单时间
	ModelName        string `json:"model_name" gorm:"column:model_name"`               //模型名称
	RequestCount     int    `gorm:"column:request_count" json:"request_count"`         //请求总数
	Quota            int    `gorm:"column:quota" json:"quota"`                         //消费金额
	PromptTokens     int    `gorm:"column:prompt_tokens" json:"prompt_tokens"`         //输入TOKEN
	CompletionTokens int    `gorm:"column:completion_tokens" json:"completion_tokens"` //输出TOKEN
	RequestTime      int    `gorm:"column:request_time" json:"request_time"`           //请求时长
}

type StatisticsMonthSearchParams struct {
	UserId int       `json:"-"`
	Date   time.Time `json:"date"`
	PaginationParams
}
type StatisticsMonthDetailSearchParams struct {
	UserId int    `json:"user_id"`
	Date   string `json:"date"`
}
type StatisticsMonthGeneratedHistory struct {
	ID        int64     `gorm:"primary_key;AUTO_INCREMENT" json:"id"`
	Date      time.Time `gorm:"primary_key;type:date" json:"date"`
	Count     int       `json:"count"`
	CreatedAt int64     `json:"created_time" gorm:"bigint"`
}

// generateInsertStatisticsMonthSQL 根据不同数据库，生成不同的账单生成基础sql
func generateInsertStatisticsMonthSQL(date time.Time) string {
	// 构建通用的SQL模板
	sqlTemplate := `
	INSERT INTO statistics_months (
		date,
		user_id,
		model_name,
		request_count,
		quota,
		prompt_tokens,
		completion_tokens,
		request_time
	)
	SELECT
		%s AS date,
		user_id,
		model_name,
		SUM(request_count) AS request_count,
		SUM(quota) AS quota,
		SUM(prompt_tokens) AS prompt_tokens,
		SUM(completion_tokens) AS completion_tokens,
		SUM(request_time) AS request_time
	FROM
		statistics
	WHERE
		date >= %s
		AND date <= %s
	GROUP BY
		user_id,
		model_name
	%s;
	`

	var (
		dateExpr       string
		startDateExpr  string
		endDateExpr    string
		conflictClause string
	)

	// Get year and month from the date
	year := date.Year()
	month := date.Month()

	// First day of the month
	firstDay := time.Date(year, month, 1, 0, 0, 0, 0, time.Local)
	// Last day of the month
	if month == 12 {
		year = year + 1
		month = 1
	} else {
		month = month + 1
	}
	lastDay := time.Date(year, month, 0, 0, 0, 0, 0, time.Local)

	firstDayStr := firstDay.Format("2006-01-02")
	lastDayStr := lastDay.Format("2006-01-02")

	if common.UsingSQLite {
		dateExpr = fmt.Sprintf("'%s'", firstDayStr)
		startDateExpr = fmt.Sprintf("'%s'", firstDayStr)
		endDateExpr = fmt.Sprintf("'%s'", lastDayStr)
		conflictClause = `ON CONFLICT(date, user_id, model_name) DO UPDATE SET
		request_count = excluded.request_count,
		quota = excluded.quota,
		prompt_tokens = excluded.prompt_tokens,
		completion_tokens = excluded.completion_tokens,
		request_time = excluded.request_time`
	} else if common.UsingPostgreSQL {
		dateExpr = fmt.Sprintf("'%s'::date", firstDayStr)
		startDateExpr = fmt.Sprintf("'%s'::date", firstDayStr)
		endDateExpr = fmt.Sprintf("'%s'::date", lastDayStr)
		conflictClause = `ON CONFLICT (date, user_id, model_name) DO UPDATE SET
		request_count = excluded.request_count,
		quota = excluded.quota,
		prompt_tokens = excluded.prompt_tokens,
		completion_tokens = excluded.completion_tokens,
		request_time = excluded.request_time`
	} else {
		// MySQL
		dateExpr = fmt.Sprintf("'%s'", firstDayStr)
		startDateExpr = fmt.Sprintf("'%s'", firstDayStr)
		endDateExpr = fmt.Sprintf("'%s'", lastDayStr)
		conflictClause = `ON DUPLICATE KEY UPDATE
		request_count = VALUES(request_count),
		quota = VALUES(quota),
		prompt_tokens = VALUES(prompt_tokens),
		completion_tokens = VALUES(completion_tokens),
		request_time = VALUES(request_time)`
	}

	return fmt.Sprintf(sqlTemplate, dateExpr, startDateExpr, endDateExpr, conflictClause)
}

// IsStatisticsMonthGenerated 传入日期，判断是否已生成账单数据
func IsStatisticsMonthGenerated(date time.Time) bool {
	var count int64
	DB.Model(&StatisticsMonthGeneratedHistory{}).Where("date = ?", date).Count(&count)
	return count > 0
}

// InsertStatisticsMonth 生成当前时间上个月的账单
func InsertStatisticsMonth() error {
	// 获取上个月的日期
	lastMonth := time.Now().AddDate(0, -1, 0)
	date := time.Date(lastMonth.Year(), lastMonth.Month(), 1, 0, 0, 0, 0, time.Local)
	if IsStatisticsMonthGenerated(date) {
		logger.SysLog("Statistics month data already generated")
		return nil
	}
	return InsertStatisticsMonthForDate(date)
}

// InsertStatisticsMonthForDate 生成指定月份的月度账单
func InsertStatisticsMonthForDate(date time.Time) error {
	logger.SysLog(fmt.Sprintf("Insert statistics month for date %s", date.Format("2006-01-02")))
	tx := DB.Begin()
	// 执行SQL
	sql := generateInsertStatisticsMonthSQL(date)
	result := tx.Exec(sql)
	if result.Error != nil {
		tx.Rollback()
		return result.Error
	}

	// 记录生成历史
	history := StatisticsMonthGeneratedHistory{
		Date:      date,
		Count:     int(result.RowsAffected),
		CreatedAt: time.Now().Unix(),
	}
	err := tx.Create(&history).Error
	if err != nil {
		tx.Rollback()
		return err
	}
	tx.Commit()
	logger.SysLog(fmt.Sprintf("Insert statistics month for date %s success", date.Format("2006-01-02")))
	return nil
}

// GetUserInvoices 查询用户所有账单数据
func GetUserInvoices(params *StatisticsMonthSearchParams) (*DataResult[StatisticsMonthNoModel], error) {
	var statistics []*StatisticsMonthNoModel
	var count int64
	dateStr := "date"
	if common.UsingPostgreSQL {
		dateStr = "TO_CHAR(date, 'YYYY-MM-DD') as date"
	} else if common.UsingSQLite {
		dateStr = "strftime('%Y-%m-%d', date) as date"
	}

	// First, get the total count without pagination
	countSQL := "SELECT COUNT(DISTINCT date) FROM statistics_months WHERE user_id = ?"

	err := DB.Raw(countSQL, params.UserId).Scan(&count).Error
	if err != nil {
		logger.SysLog(fmt.Sprintf("Failed to get total count of user invoices for user %d: %v", params.UserId, err))
		return &DataResult[StatisticsMonthNoModel]{}, err
	}

	// Set default pagination values
	if params.Size == 0 {
		params.Size = 10
	}
	if params.Page == 0 {
		params.Page = 1
	}
	offset := (params.Page - 1) * params.Size

	// Use GORM's query builder for safer SQL construction
	query := DB.Table("statistics_months").
		Select(dateStr+", sum(request_count) as request_count, sum(quota) as quota, sum(prompt_tokens) as prompt_tokens, sum(completion_tokens) as completion_tokens, sum(request_time) as request_time").
		Where("user_id = ?", params.UserId).
		Group("date, user_id")

	// Define allowed fields for ordering to prevent SQL injection
	allowedOrderFields := map[string]bool{
		"date":              true,
		"request_count":     true,
		"quota":             true,
		"prompt_tokens":     true,
		"completion_tokens": true,
		"request_time":      true,
	}

	// Apply ordering with validation
	orderField := "date" // Default order field
	orderDir := "DESC"   // Default order direction

	field := strings.TrimSpace(params.Order)
	if len(field) > 0 {
		isDesc := strings.HasPrefix(field, "-")
		if isDesc {
			field = strings.TrimPrefix(field, "-")
			orderDir = "DESC"
		} else {
			orderDir = "ASC"
		}

		// Check if the field is in the allowed list
		if allowedOrderFields[field] {
			orderField = field
		}
	}

	if orderDir == "DESC" {
		query = query.Order(fmt.Sprintf("%s DESC", orderField))
	} else {
		query = query.Order(fmt.Sprintf("%s ASC", orderField))
	}

	// Apply pagination
	query = query.Limit(params.Size).Offset(offset)

	// Execute the query
	err = query.Scan(&statistics).Error
	if err != nil {
		logger.SysLog(fmt.Sprintf("Failed to get user invoices for user %d", params.UserId))
		return &DataResult[StatisticsMonthNoModel]{}, err
	}

	return &DataResult[StatisticsMonthNoModel]{
		Data:       &statistics,
		Page:       params.Page,
		Size:       params.Size,
		TotalCount: count,
	}, nil
}

// GetUserInvoiceDetail 查询指定月份账单详情
func GetUserInvoiceDetail(params *StatisticsMonthDetailSearchParams) ([]*StatisticsMonthModel, error) {
	// 参数验证
	if params.UserId <= 0 {
		return nil, errors.New("无效的用户ID")
	}

	// 验证日期格式 (例如: YYYY-MM-DD)
	if _, err := time.Parse("2006-01-02", params.Date); err != nil {
		return nil, errors.New("无效的日期格式")
	}

	dateSqlStr := "date"
	if common.UsingPostgreSQL {
		dateSqlStr = "TO_CHAR(date, 'YYYY-MM-DD') as date"
	} else if common.UsingSQLite {
		dateSqlStr = "strftime('%Y-%m-%d', date) as date"
	}

	var statistics []*StatisticsMonthModel
	query := DB.Table("statistics_months").
		Select("? , model_name ,sum(request_count) as request_count, sum(quota) as quota, sum(prompt_tokens) as prompt_tokens, sum(completion_tokens) as completion_tokens, sum(request_time) as request_time", dateSqlStr).
		Where("user_id = ? AND date = ?", params.UserId, params.Date).
		Group("date,model_name, user_id").
		Order("date DESC")

	err := query.Scan(&statistics).Error
	if err != nil {
		logger.SysLog(fmt.Sprintf("Failed to get user invoices for user %d", params.UserId))
		return nil, err
	}
	return statistics, nil
}
