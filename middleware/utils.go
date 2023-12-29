package middleware

import (
	"one-api/common"

	"github.com/gin-gonic/gin"
)

func abortWithMessage(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, gin.H{
		"error": gin.H{
			"message": common.MessageWithRequestId(message, c.GetString(common.RequestIdKey)),
			"type":    "czloapi_error",
		},
	})
	c.Abort()
	common.LogError(c.Request.Context(), message)
}
