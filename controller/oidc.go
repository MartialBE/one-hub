package controller

import (
	"context"
	"errors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
	"one-api/common/config"
	"one-api/common/logger"
	"one-api/common/oidc"
	"one-api/common/utils"
	"one-api/model"
)

func OIDCEndpoint(c *gin.Context) {
	if !config.OIDCAuthEnabled {
		c.JSON(http.StatusOK, gin.H{
			"message": "管理员未开启通过OIDC登录",
			"success": false,
		})
		return
	}
	oidcConfig, err := oidc.GetOIDCConfigInstance()
	if err != nil {
		logger.SysError("获取 OIDC 配置失败, err: " + err.Error())
		c.JSON(http.StatusOK, gin.H{
			"message": "获取 OIDC 配置失败",
			"success": false,
		})
		return
	}

	session := sessions.Default(c)
	state := utils.GetRandomString(12)
	session.Set("oauth_state", state)
	loginURL := oidcConfig.LoginURL(state)
	err = session.Save()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    loginURL,
	})
}

// OIDCAuth 通过OIDC登录
// 首先通过OIDC ID进行登录、如果登录失败尝试使用USERNAME 进行登录（遵循用户禁用条件），如果OIDC ID和USERNAME都不存在则注册新用户（遵循是否开启注册功能条件）
func OIDCAuth(c *gin.Context) {
	if !config.OIDCAuthEnabled {
		c.JSON(http.StatusOK, gin.H{
			"message": "管理员未开启通过OIDC登录",
			"success": false,
		})
		return
	}

	// 验证state参数
	session := sessions.Default(c)
	state := c.Query("state")
	if state == "" || session.Get("oauth_state") == nil || state != session.Get("oauth_state").(string) {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "state is empty or not same",
		})
		return
	}

	// 获取OIDC配置
	oidcConfig, err := oidc.GetOIDCConfigInstance()
	if err != nil {
		logger.SysError("获取 OIDC 配置失败, err: " + err.Error())
		c.JSON(http.StatusOK, gin.H{
			"message": "获取 OIDC 配置失败",
			"success": false,
		})
		return
	}

	// 处理授权码并获取token
	code := c.Query("code")
	ctx := context.Background()
	token, err := oidcConfig.OAuth2Config.Exchange(ctx, code)
	if err != nil {
		c.String(http.StatusBadRequest, "Failed to exchange token: %v", err)
		return
	}

	// 验证ID Token
	idToken, err := oidcConfig.Verifier.Verify(ctx, token.Extra("id_token").(string))
	if err != nil {
		c.String(http.StatusBadRequest, "Failed to verify ID token: %v", err)
		return
	}

	// 检测OIDC用户ID
	if idToken.Subject == "" {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "ID Token 中没有 Subject",
		})
		return
	}

	// 解析用户信息
	claims := make(map[string]interface{})
	if err := idToken.Claims(&claims); err != nil {
		c.String(http.StatusBadRequest, "Failed to parse claims: %v", err)
		return
	}

	// 获取用户名
	userName, ok := claims[config.OIDCUsernameClaims]
	if !ok || userName == nil {
		c.JSON(http.StatusOK, gin.H{
			"message": "用户没有OIDC登录权限",
			"success": false,
		})
		return
	}

	// 初始化用户对象
	user := model.User{
		Username: userName.(string),
		OidcId:   idToken.Subject,
	}

	// 尝试通过OIDCid查询用户
	if err = user.FillUserByOidcId(); err == nil {
		if user.Status == config.UserStatusEnabled {
			setupLogin(&user, c)
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"message": "用户已被封禁或不存在",
			"success": false,
		})
		return
	}

	// OIDCid查询失败，则尝试通过username查询
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.SysError("查询用户错误: " + err.Error())
		c.JSON(http.StatusOK, gin.H{
			"message": err.Error(),
			"success": false,
		})
		return
	}

	if err = user.FillUserByUsername(); err == nil {
		if user.Status == config.UserStatusEnabled {
			// 如果通过用户名查询用户成功、则补全用户OIDC ID并且登录
			user.OidcId = idToken.Subject
			ok := user.Update(false)
			if ok != nil {
				c.JSON(http.StatusOK, gin.H{
					"message": ok.Error(),
					"success": false,
				})
				return
			}
			setupLogin(&user, c)
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"message": "用户已被封禁或不存在",
			"success": false,
		})
		return
	}

	// 用户不存在，尝试注册
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.SysError("查询用户错误: " + err.Error())
		c.JSON(http.StatusOK, gin.H{
			"message": err.Error(),
			"success": false,
		})
		return
	}

	// 注册新用户
	if !config.RegisterEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "管理员关闭了新用户注册",
		})
		return
	}

	// 检测邀请码
	var inviterId int
	affCode := c.Query("aff")
	if affCode != "" {
		inviterId, _ = model.GetUserIdByAffCode(affCode)
	}
	if inviterId > 0 {
		user.InviterId = inviterId
	}
	// 填充用户信息并创建账户
	user.Username = userName.(string)
	if email, ok := claims["email"]; ok && email != nil {
		user.Email = email.(string)
	}
	if displayName, ok := claims["displayName"]; ok && displayName != nil {
		user.DisplayName = displayName.(string)
	}
	if avatarUrl, ok := claims["avatar"]; ok && avatarUrl != nil {
		user.AvatarUrl = avatarUrl.(string)
	}
	user.OidcId = idToken.Subject
	user.Role = config.RoleCommonUser
	user.Status = config.UserStatusEnabled

	if err := user.Insert(0); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	setupLogin(&user, c)
}
