package controller

import (
	"errors"
	"net/http"
	"one-api/common"
	"one-api/common/logger"

	"github.com/gin-gonic/gin"
)

// SystemLog handles the request to get the latest system logs from the log file
// It accepts a POST request with a 'count' parameter specifying the number of logs to return
func SystemLog(c *gin.Context) {
	// Parse the count parameter from the request body
	var requestBody struct {
		Count int `json:"count" binding:"required"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		common.APIRespondWithError(c, http.StatusBadRequest, err)
		return
	}

	// Validate the count parameter
	if requestBody.Count <= 0 {
		common.APIRespondWithError(c, http.StatusBadRequest, errors.New("count must be greater than 0"))
		return
	}

	// Get the latest logs from the log file
	logs, err := logger.GetLatestLogs(requestBody.Count)
	if err != nil {
		common.APIRespondWithError(c, http.StatusInternalServerError, err)
		return
	}

	// Return the logs
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    logs,
	})
}
