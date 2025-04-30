package middleware

import (
	"context"
	"github.com/gin-gonic/gin"
)

// ContextId adds the user ID from the Gin context to the request context
func ContextUserId() func(c *gin.Context) {
	return func(c *gin.Context) {
		id := c.GetInt("id")
		if id != 0 {
			ctx := context.WithValue(c.Request.Context(), "id", id)
			c.Request = c.Request.WithContext(ctx)
		}
		c.Next()
	}
}
