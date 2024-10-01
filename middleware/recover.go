package middleware

import (
	"fmt"
	"net/http"
	"one-api/common/logger"
	"one-api/metrics"
	"runtime/debug"

	"github.com/gin-gonic/gin"
)

func RelayPanicRecover() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				errorResponse := gin.H{
					"error": gin.H{
						"message": fmt.Sprintf("Panic detected, error: %v. Please submit a issue here: https://github.com/MartialBE/one-hub", err),
						"type":    "one_hub_panic",
					},
				}
				handlePanic(c, err, errorResponse)
				metrics.RecordPanic("openai")
			}
		}()

		c.Next()
	}
}

func RelayCluadePanicRecover() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				errorResponse := gin.H{
					"type": "one_hub_panic",
					"error": gin.H{
						"type":    "one_hub_panic",
						"message": fmt.Sprintf("Panic detected, error: %v. Please submit a issue here: https://github.com/MartialBE/one-hub.", err),
					},
				}
				handlePanic(c, err, errorResponse)
				metrics.RecordPanic("claude")
			}
		}()
		c.Next()
	}
}

func RelayGeminiPanicRecover() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				errorResponse := gin.H{
					"error": gin.H{
						"code":    500,
						"status":  "one_hub_panic",
						"message": fmt.Sprintf("Panic detected, error: %v. Please submit a issue here: https://github.com/MartialBE/one-hub.", err),
					},
				}
				handlePanic(c, err, errorResponse)
				metrics.RecordPanic("gemini")
			}
		}()
		c.Next()
	}
}

func RelayMJPanicRecover() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				errorResponse := gin.H{
					"error": gin.H{
						"description": fmt.Sprintf("Panic detected, error: %v. Please submit a issue here: https://github.com/MartialBE/one-hub.", err),
						"type":        "one_hub_panic",
						"code":        500,
					},
				}
				handlePanic(c, err, errorResponse)
				metrics.RecordPanic("MJ")
			}
		}()

		c.Next()
	}
}

func RelaySunoPanicRecover() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				errorResponse := gin.H{
					"code":    "one_hub_panic",
					"message": fmt.Sprintf("Panic detected, error: %v. Please submit a issue here: https://github.com/MartialBE/one-hub.", err),
				}
				handlePanic(c, err, errorResponse)
				metrics.RecordPanic("suno")
			}
		}()
		c.Next()
	}
}

func handlePanic(c *gin.Context, err interface{}, errorResponse gin.H) {
	logger.SysError(fmt.Sprintf("panic detected: %v", err))
	logger.SysError(fmt.Sprintf("stacktrace from panic: %s", string(debug.Stack())))
	c.JSON(http.StatusInternalServerError, errorResponse)
	c.Abort()
}
