package middleware

import (
	"net/http"
	"one-api/common/logger"
	"one-api/common/utils"

	"github.com/gin-gonic/gin"
)

func abortWithMessage(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, gin.H{
		"error": gin.H{
			"message": utils.MessageWithRequestId(message, c.GetString(logger.RequestIdKey)),
			"type":    "one_hub_error",
		},
	})
	c.Abort()
	logger.LogError(c.Request.Context(), message)
}

func midjourneyAbortWithMessage(c *gin.Context, code int, description string) {
	c.JSON(http.StatusBadRequest, gin.H{
		"description": description,
		"type":        "one_hub_error",
		"code":        code,
	})

	c.Abort()
	logger.LogError(c.Request.Context(), description)
}
