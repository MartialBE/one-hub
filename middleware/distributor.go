package middleware

import (
	"fmt"
	"net/http"
	"one-api/model"

	"github.com/gin-gonic/gin"
)

func Distribute() func(c *gin.Context) {
	return func(c *gin.Context) {
		userId := c.GetInt("id")
		userGroup, _ := model.CacheGetUserGroup(userId)
		c.Set("group", userGroup)

		tokenGroup := c.GetString("token_group")
		if tokenGroup == "" {
			tokenGroup = userGroup
			c.Set("token_group", tokenGroup)
		}

		groupRatio := model.GlobalUserGroupRatio.GetBySymbol(tokenGroup)
		if groupRatio == nil {
			abortWithMessage(c, http.StatusForbidden, fmt.Sprintf("分组 %s 不存在", tokenGroup))
			return
		}

		c.Set("group_ratio", groupRatio.Ratio)
		c.Next()
	}
}
