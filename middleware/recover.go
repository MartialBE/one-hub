package middleware

import (
	"fmt"
	"net/http"
	"one-api/common/logger"
	"runtime/debug"

	"github.com/gin-gonic/gin"
)

func RelayPanicRecover() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				logger.SysError(fmt.Sprintf("panic detected: %v", err))
				logger.SysError(fmt.Sprintf("stacktrace from panic: %s", string(debug.Stack())))
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": gin.H{
						"message": fmt.Sprintf("Panic detected, error: %v.", err),
						"type":    "oapi_panic",
					},
				})
				c.Abort()
			}
		}()
		c.Next()
	}
}
