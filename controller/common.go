package controller

import (
	"fmt"
	"net/http"
	"one-api/common"
	"one-api/common/config"
	"one-api/common/notify"
	"one-api/model"
	"one-api/types"

	"github.com/gin-gonic/gin"
)

func shouldEnableChannel(err error, openAIErr *types.OpenAIErrorWithStatusCode) bool {
	if !config.AutomaticEnableChannelEnabled {
		return false
	}
	if err != nil {
		return false
	}
	if openAIErr != nil {
		return false
	}
	return true
}

func ShouldDisableChannel(channelType int, err *types.OpenAIErrorWithStatusCode) bool {
	if !config.AutomaticDisableChannelEnabled || err == nil || err.LocalError {
		return false
	}

	// 状态码检查
	if err.StatusCode == http.StatusUnauthorized {
		return true
	}
	if err.StatusCode == http.StatusForbidden && channelType == config.ChannelTypeGemini {
		return true
	}

	// 错误代码检查
	switch err.OpenAIError.Code {
	case "invalid_api_key", "account_deactivated", "billing_not_active":
		return true
	}

	// 错误类型检查
	switch err.OpenAIError.Type {
	case "insufficient_quota", "authentication_error", "permission_error", "forbidden":
		return true
	}

	switch err.OpenAIError.Param {
	case "PERMISSIONDENIED":
		return true
	}

	return common.DisableChannelKeywordsInstance.IsContains(err.OpenAIError.Message)
}

// disable & notify
func DisableChannel(channelId int, channelName string, reason string, sendNotify bool) {
	model.UpdateChannelStatusById(channelId, config.ChannelStatusAutoDisabled)
	if !sendNotify {
		return
	}

	subject := fmt.Sprintf("通道「%s」（#%d）已被禁用", channelName, channelId)
	content := fmt.Sprintf("通道「%s」（#%d）已被禁用，原因：%s", channelName, channelId, reason)
	notify.Send(subject, content)
}

// enable & notify
func EnableChannel(channelId int, channelName string, sendNotify bool) {
	model.UpdateChannelStatusById(channelId, config.ChannelStatusEnabled)
	if !sendNotify {
		return
	}

	subject := fmt.Sprintf("通道「%s」（#%d）已被启用", channelName, channelId)
	content := fmt.Sprintf("通道「%s」（#%d）已被启用", channelName, channelId)
	notify.Send(subject, content)
}

func RelayNotFound(c *gin.Context) {
	err := types.OpenAIError{
		Message: fmt.Sprintf("Invalid URL (%s %s)", c.Request.Method, c.Request.URL.Path),
		Type:    "invalid_request_error",
		Param:   "",
		Code:    "",
	}
	c.JSON(http.StatusNotFound, gin.H{
		"error": err,
	})
}
