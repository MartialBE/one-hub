package controller

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"one-api/common"
	"one-api/model"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type MultiUserStatsRequest struct {
	Usernames string `form:"usernames" binding:"required"`
	StartTime string `form:"start_time" binding:"required"`
	EndTime   string `form:"end_time" binding:"required"`
}

// GetMultiUserStatistics 获取多个用户的统计数据
func GetMultiUserStatistics(c *gin.Context) {
	var req MultiUserStatsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		common.APIRespondWithError(c, http.StatusOK, fmt.Errorf("invalid parameters: %v", err))
		return
	}

	// Parse usernames from comma-separated string
	usernames := strings.Split(req.Usernames, ",")
	for i := range usernames {
		usernames[i] = strings.TrimSpace(usernames[i])
	}

	// Validate date format
	if _, err := time.Parse("2006-01-02", req.StartTime); err != nil {
		common.APIRespondWithError(c, http.StatusOK, fmt.Errorf("invalid start_time format, expected YYYY-MM-DD"))
		return
	}
	if _, err := time.Parse("2006-01-02", req.EndTime); err != nil {
		common.APIRespondWithError(c, http.StatusOK, fmt.Errorf("invalid end_time format, expected YYYY-MM-DD"))
		return
	}

	// Get statistics
	statistics, err := model.GetUserGroupedStatisticsByPeriod(usernames, req.StartTime, req.EndTime)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	// Get model usage data
	modelUsage, err := model.GetModelUsageByUser(usernames, req.StartTime, req.EndTime)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"message":     "",
		"data":        statistics,
		"model_usage": modelUsage,
	})
}

// ExportMultiUserStatisticsCSV 导出多个用户的统计数据为CSV
func ExportMultiUserStatisticsCSV(c *gin.Context) {
	var req MultiUserStatsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		common.APIRespondWithError(c, http.StatusOK, fmt.Errorf("invalid parameters: %v", err))
		return
	}

	// Parse usernames from comma-separated string
	usernames := strings.Split(req.Usernames, ",")
	for i := range usernames {
		usernames[i] = strings.TrimSpace(usernames[i])
	}

	// Validate date format
	if _, err := time.Parse("2006-01-02", req.StartTime); err != nil {
		common.APIRespondWithError(c, http.StatusOK, fmt.Errorf("invalid start_time format, expected YYYY-MM-DD"))
		return
	}
	if _, err := time.Parse("2006-01-02", req.EndTime); err != nil {
		common.APIRespondWithError(c, http.StatusOK, fmt.Errorf("invalid end_time format, expected YYYY-MM-DD"))
		return
	}

	// Get statistics
	statistics, err := model.GetUserGroupedStatisticsByPeriod(usernames, req.StartTime, req.EndTime)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	// Set headers for CSV download
	filename := fmt.Sprintf("multi_user_stats_%s_%s.csv", req.StartTime, req.EndTime)
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))

	// Create CSV writer
	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// Write CSV header
	header := []string{
		"Username",
		"Request Count",
		"Quota",
		"Prompt Tokens",
		"Completion Tokens",
		"Request Time (ms)",
	}
	if err := writer.Write(header); err != nil {
		common.APIRespondWithError(c, http.StatusOK, fmt.Errorf("failed to write CSV header: %v", err))
		return
	}

	// Write data rows
	for _, stat := range statistics {
		row := []string{
			stat.Username,
			fmt.Sprintf("%d", stat.RequestCount),
			fmt.Sprintf("%d", stat.Quota),
			fmt.Sprintf("%d", stat.PromptTokens),
			fmt.Sprintf("%d", stat.CompletionTokens),
			fmt.Sprintf("%d", stat.RequestTime),
		}
		if err := writer.Write(row); err != nil {
			common.APIRespondWithError(c, http.StatusOK, fmt.Errorf("failed to write CSV row: %v", err))
			return
		}
	}
}
