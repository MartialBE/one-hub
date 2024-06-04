package middleware

import (
	"one-api/common/logger"
	"one-api/common/utils"

	"github.com/gin-gonic/gin"
)

func abortWithMessage(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, gin.H{
		"error": gin.H{
			"message": utils.MessageWithRequestId(message, c.GetString(logger.RequestIdKey)),
			"type":    "czloapi_error",
		},
	})
	c.Abort()
	logger.LogError(c.Request.Context(), message)
}
