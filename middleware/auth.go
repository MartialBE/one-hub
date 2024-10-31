package middleware

import (
	"net/http"
	"one-api/common/config"
	"one-api/common/utils"
	"one-api/model"
	"strings"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

func authHelper(c *gin.Context, minRole int) {
	session := sessions.Default(c)
	username := session.Get("username")
	role := session.Get("role")
	id := session.Get("id")
	status := session.Get("status")
	if username == nil {
		// Check access token
		accessToken := c.Request.Header.Get("Authorization")
		if accessToken == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "无权进行此操作，未登录且未提供 access token",
			})
			c.Abort()
			return
		}
		user := model.ValidateAccessToken(accessToken)
		if user != nil && user.Username != "" {
			// Token is valid
			username = user.Username
			role = user.Role
			id = user.Id
			status = user.Status
		} else {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "无权进行此操作，access token 无效",
			})
			c.Abort()
			return
		}
	}
	if status.(int) == config.UserStatusDisabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "用户已被封禁",
		})
		c.Abort()
		return
	}
	if role.(int) < minRole {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无权进行此操作，权限不足",
		})
		c.Abort()
		return
	}
	c.Set("username", username)
	c.Set("role", role)
	c.Set("id", id)
	c.Next()
}

func UserAuth() func(c *gin.Context) {
	return func(c *gin.Context) {
		authHelper(c, config.RoleCommonUser)
	}
}

func AdminAuth() func(c *gin.Context) {
	return func(c *gin.Context) {
		authHelper(c, config.RoleAdminUser)
	}
}

func RootAuth() func(c *gin.Context) {
	return func(c *gin.Context) {
		authHelper(c, config.RoleRootUser)
	}
}

func tokenAuth(c *gin.Context, key string) {
	key = strings.TrimPrefix(key, "Bearer ")
	key = strings.TrimPrefix(key, "sk-")

	if len(key) < 48 {
		abortWithMessage(c, http.StatusUnauthorized, "无效的令牌")
		return
	}

	parts := strings.Split(key, "-")
	key = parts[0]
	token, err := model.ValidateUserToken(key)
	if err != nil {
		abortWithMessage(c, http.StatusUnauthorized, err.Error())
		return
	}
	userEnabled, err := model.CacheIsUserEnabled(token.UserId)
	if err != nil {
		abortWithMessage(c, http.StatusInternalServerError, err.Error())
		return
	}
	if !userEnabled {
		abortWithMessage(c, http.StatusForbidden, "用户已被封禁")
		return
	}
	c.Set("id", token.UserId)
	c.Set("token_id", token.Id)
	c.Set("token_name", token.Name)
	c.Set("token_group", token.Group)
	c.Set("chat_cache", token.ChatCache)
	if len(parts) > 1 {
		if model.IsAdmin(token.UserId) {
			if strings.HasPrefix(parts[1], "!") {
				channelId := utils.String2Int(parts[1][1:])
				c.Set("skip_channel_ids", []int{channelId})
			} else {
				channelId := utils.String2Int(parts[1])
				if channelId == 0 {
					abortWithMessage(c, http.StatusForbidden, "无效的渠道 Id")
					return
				}
				c.Set("specific_channel_id", channelId)
				if len(parts) == 3 && parts[2] == "ignore" {
					c.Set("specific_channel_id_ignore", true)
				}
			}
		} else {
			abortWithMessage(c, http.StatusForbidden, "普通用户不支持指定渠道")
			return
		}
	}
	c.Next()
}

func OpenaiAuth() func(c *gin.Context) {
	return func(c *gin.Context) {
		isWebSocket := c.GetHeader("Upgrade") == "websocket"
		key := c.Request.Header.Get("Authorization")

		if isWebSocket && key == "" {
			protocols := c.Request.Header["Sec-Websocket-Protocol"]
			if len(protocols) > 0 {
				protocolList := strings.Split(protocols[0], ",")
				for _, protocol := range protocolList {
					protocol = strings.TrimSpace(protocol)
					if strings.HasPrefix(protocol, "openai-insecure-api-key.") {
						key = strings.TrimPrefix(protocol, "openai-insecure-api-key.")
						break
					}
				}
			}
		}
		tokenAuth(c, key)
	}
}

func ClaudeAuth() func(c *gin.Context) {
	return func(c *gin.Context) {
		key := c.Request.Header.Get("x-api-key")
		tokenAuth(c, key)
	}
}

func GeminiAuth() func(c *gin.Context) {
	return func(c *gin.Context) {
		key := c.Request.Header.Get("x-goog-api-key")
		if key == "" {
			// 查询GET参数
			key = c.Query("key")
		}
		tokenAuth(c, key)
	}
}

func MjAuth() func(c *gin.Context) {
	return func(c *gin.Context) {
		key := c.Request.Header.Get("mj-api-secret")
		tokenAuth(c, key)
	}
}

func SpecifiedChannel() func(c *gin.Context) {
	return func(c *gin.Context) {
		channelId := c.GetInt("specific_channel_id")
		c.Set("specific_channel_id_ignore", false)

		if channelId <= 0 {
			abortWithMessage(c, http.StatusForbidden, "必须指定渠道")
			return
		}
		c.Next()
	}
}
