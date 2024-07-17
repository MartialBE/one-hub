package middleware

import (
	"one-api/common/logger"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"github.com/gin-gonic/gin"
)

func SetUpLogger(server *gin.Engine) {

	server.Use(GinzapWithConfig())

}

func GinzapWithConfig() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery
		c.Next()
		end := time.Now()
		latency := end.Sub(start)
		requestID := c.GetString(logger.RequestIdKey)

		fields := []zapcore.Field{
			zap.Int("status", c.Writer.Status()),
			zap.String("request_id", requestID),
			zap.String("method", c.Request.Method),
			zap.String("path", path),
			zap.String("query", query),
			zap.String("ip", c.ClientIP()),
			zap.String("user-agent", c.Request.UserAgent()),
			zap.Duration("latency", latency),
		}

		if len(c.Errors) > 0 {
			// Append error field if this is an erroneous request.
			for _, e := range c.Errors.Errors() {
				logger.Logger.Error(e, fields...)
			}
		} else {
			logger.Logger.Info("GIN request", fields...)

		}
	}
}
