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

func OIDCAuth(c *gin.Context) {
	if !config.OIDCAuthEnabled {
		c.JSON(http.StatusOK, gin.H{
			"message": "管理员未开启通过OIDC登录",
			"success": false,
		})
		return
	}
	session := sessions.Default(c)
	state := c.Query("state")
	if state == "" || session.Get("oauth_state") == nil || state != session.Get("oauth_state").(string) {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "state is empty or not same",
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
	// 从请求中获取授权码
	code := c.Query("code")
	// 使用授权码换取ID Token
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

	// 获取用户信息
	claims := make(map[string]interface{})
	if err := idToken.Claims(&claims); err != nil {
		c.String(http.StatusBadRequest, "Failed to parse claims: %v", err)
		return
	}
	// 从claims中获取用户名称
	userName := claims[config.OIDCUsernameClaims]
	if userName == nil {
		c.JSON(http.StatusOK, gin.H{
			"message": "用户没有OIDC登录权限",
			"success": false,
		})
		return
	}
	user := model.User{
		Username: userName.(string),
	}
	err = user.FillUserByUsername()
	if err != nil {
		logger.SysError("查询用户错误：" + err.Error())
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 用户不存在
			logger.SysError("用户不存在：" + err.Error())
			if config.RegisterEnabled {
				user.Username = userName.(string)
				email := claims["email"]
				if email != nil {
					user.Email = email.(string)
				}
				display_name := claims["displayName"]
				if display_name != nil {
					user.DisplayName = display_name.(string)
				}
				user.Role = config.RoleCommonUser
				user.Status = config.UserStatusEnabled

				if err := user.Insert(0); err != nil {
					c.JSON(http.StatusOK, gin.H{
						"success": false,
						"message": err.Error(),
					})
					return
				}
			} else {
				c.JSON(http.StatusOK, gin.H{
					"success": false,
					"message": "管理员关闭了新用户注册",
				})
				return
			}
		} else if err != nil {
			logger.SysError("其他错误：" + err.Error())
			c.JSON(http.StatusOK, gin.H{
				"message": err.Error(),
				"success": false,
			})
			return
		}
	}

	if user.Status != config.UserStatusEnabled {
		c.JSON(http.StatusOK, gin.H{
			"message": "用户已被封禁或不存在",
			"success": false,
		})
		return
	}
	setupLogin(&user, c)
}
