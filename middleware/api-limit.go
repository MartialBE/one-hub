package middleware

import (
	"fmt"
	"net/http"
	"one-api/common/config"
	"one-api/model"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	LIMIT_KEY               = "api-limiter:%d"
	INTERNAL                = 1 * time.Minute
	RATE_LIMIT_EXCEEDED_MSG = "您的速率达到上限，请稍后再试。"
	SERVER_ERROR_MSG        = "Server error"
)

func DynamicRedisRateLimiter() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !config.RedisEnabled {
			c.Next()
			return
		}

		userID := c.GetInt("id")
		userGroup := c.GetString("group")

		// API速率限制
		limiter := model.GlobalUserGroupRatio.GetAPILimiter(userGroup)
		if limiter == nil {
			abortWithMessage(c, http.StatusForbidden, "API requests are not allowed")
			return
		}
		key := fmt.Sprintf(LIMIT_KEY, userID)

		if !limiter.Allow(key) {
			abortWithMessage(c, http.StatusTooManyRequests, RATE_LIMIT_EXCEEDED_MSG)
			return
		}

		c.Next()
	}
}
