package controller

import (
	"encoding/json"
	"net/http"
	"one-api/common/webauthn"
	"one-api/model"
	"strconv"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	wauth "github.com/go-webauthn/webauthn/webauthn"
)

// WebAuthn 注册开始
func WebauthnBeginRegistration(c *gin.Context) {
	webauthnInstance, err := webauthn.GetWebAuthn()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "获取Webauthn配置失败",
			"success": false,
		})
		return
	}

	userId := c.GetInt("id")

	user, err := model.GetUserById(userId, false)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "用户不存在",
			"success": false,
		})
		return
	}
	options, session, err := webauthnInstance.BeginRegistration(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "无法开始注册",
			"success": false,
		})
		return
	}

	// 读取可选别名，并将session与别名存储到用户会话中
	type BeginRegReq struct {
		Alias string `json:"alias"`
	}
	var req BeginRegReq
	_ = c.ShouldBindJSON(&req) // 忽略错误，别名为可选

	sess := sessions.Default(c)
	sessionData, err := json.Marshal(session)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "会话数据序列化失败",
			"success": false,
		})
		return
	}
	sess.Set("webauthn_registration_session", string(sessionData))
	if req.Alias != "" {
		sess.Set("webauthn_alias", req.Alias)
	}
	sess.Save()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    options,
	})
}

// WebAuthn 注册完成
func WebauthnFinishRegistration(c *gin.Context) {
	webauthnInstance, err := webauthn.GetWebAuthn()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "获取Webauthn配置失败",
			"success": false,
		})
		return
	}

	userId := c.GetInt("id")

	user, err := model.GetUserById(userId, false)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "用户不存在",
			"success": false,
		})
		return
	}

	// 从会话中获取session
	sess := sessions.Default(c)
	sessionDataStr := sess.Get("webauthn_registration_session")
	if sessionDataStr == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "会话已过期",
			"success": false,
		})
		return
	}

	var sessionData wauth.SessionData
	err = json.Unmarshal([]byte(sessionDataStr.(string)), &sessionData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "会话数据反序列化失败",
			"success": false,
		})
		return
	}

	credential, err := webauthnInstance.FinishRegistration(user, sessionData, c.Request)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "注册验证失败: " + err.Error(),
			"success": false,
		})
		return
	}

	// 保存凭据到数据库
	alias := ""
	if v := sess.Get("webauthn_alias"); v != nil {
		if s, ok := v.(string); ok {
			alias = s
		}
	}
	err = model.SaveWebAuthnCredential(userId, credential, alias)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "保存凭据失败",
			"success": false,
		})
		return
	}

	// 清除会话
	sess.Delete("webauthn_registration_session")
	sess.Delete("webauthn_alias")
	sess.Save()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "WebAuthn注册成功",
	})
}

// WebAuthn 登录开始
func WebauthnBeginLogin(c *gin.Context) {
	webauthnInstance, err := webauthn.GetWebAuthn()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "获取Webauthn配置失败",
			"success": false,
		})
		return
	}

	// 从请求中获取用户名
	type LoginRequest struct {
		Username string `json:"username" binding:"required"`
	}

	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "请求参数错误",
			"success": false,
		})
		return
	}

	var user = model.User{
		Username: req.Username,
	}
	// 根据用户名获取用户
	err = user.FillUserByUsername()
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "登陆失败",
			"success": false,
		})
		return
	}

	options, session, err := webauthnInstance.BeginLogin(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "无法开始登录: " + err.Error(),
			"success": false,
		})
		return
	}

	// 将session存储到用户会话中
	sess := sessions.Default(c)
	sessionData, err := json.Marshal(session)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "会话数据序列化失败",
			"success": false,
		})
		return
	}
	sess.Set("webauthn_login_session", string(sessionData))
	sess.Set("webauthn_user_id", strconv.Itoa(user.Id))
	sess.Save()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    options,
	})
}

// WebAuthn 登录完成
func WebauthnFinishLogin(c *gin.Context) {
	webauthnInstance, err := webauthn.GetWebAuthn()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "获取Webauthn配置失败",
			"success": false,
		})
		return
	}

	// 从会话中获取用户ID和session
	sess := sessions.Default(c)
	sessionDataStr := sess.Get("webauthn_login_session")
	userIdStr := sess.Get("webauthn_user_id")

	if sessionDataStr == nil || userIdStr == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "会话已过期",
			"success": false,
		})
		return
	}

	userId, err := strconv.Atoi(userIdStr.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "登陆失败",
			"success": false,
		})
		return
	}

	user, err := model.GetUserById(userId, false)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "登陆失败",
			"success": false,
		})
		return
	}

	var sessionData wauth.SessionData
	err = json.Unmarshal([]byte(sessionDataStr.(string)), &sessionData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "会话数据反序列化失败",
			"success": false,
		})
		return
	}

	_, err = webauthnInstance.FinishLogin(user, sessionData, c.Request)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "登录验证失败: " + err.Error(),
			"success": false,
		})
		return
	}

	// 检查用户状态
	if user.Status != 1 {
		c.JSON(http.StatusForbidden, gin.H{
			"message": "登陆失败",
			"success": false,
		})
		return
	}

	// 清除会话
	sess.Delete("webauthn_login_session")
	sess.Delete("webauthn_user_id")
	sess.Save()

	// 设置用户登录状态
	setupLogin(user, c)
}

// 获取用户的WebAuthn凭据列表
func GetUserWebAuthnCredentials(c *gin.Context) {
	userId := c.GetInt("id")

	var credentials []model.WebAuthnCredential
	model.DB.Where("user_id = ?", userId).Find(&credentials)

	// 只返回必要的信息，不包含私钥
	var result []gin.H
	for _, cred := range credentials {
		result = append(result, gin.H{
			"id":            cred.Id,
			"credential_id": cred.CredentialId,
			"alias":         cred.Alias,
			"created_time":  cred.CreatedTime,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    result,
	})
}

// 删除WebAuthn凭据
func DeleteWebAuthnCredential(c *gin.Context) {
	userId := c.GetInt("id")

	credentialId := c.Param("id")
	if credentialId == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "凭据ID不能为空",
			"success": false,
		})
		return
	}

	result := model.DB.Where("user_id = ? AND id = ?", userId, credentialId).Delete(&model.WebAuthnCredential{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "删除凭据失败",
			"success": false,
		})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "凭据不存在",
			"success": false,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "凭据删除成功",
	})
}
