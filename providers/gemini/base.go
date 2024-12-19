package gemini

import (
	"encoding/json"
	"fmt"
	"net/http"
	"one-api/common/logger"
	"one-api/common/requester"
	"one-api/model"
	"one-api/providers/base"
	"one-api/providers/openai"
	"one-api/types"
	"strings"
)

type GeminiProviderFactory struct{}

// 创建 GeminiProvider
func (f GeminiProviderFactory) Create(channel *model.Channel) base.ProviderInterface {
	useOpenaiAPI := false
	useCodeExecution := false

	if channel.Plugin != nil {
		plugin := channel.Plugin.Data()
		if pWeb, ok := plugin["code_execution"]; ok {
			if enable, ok := pWeb["enable"].(bool); ok && enable {
				useCodeExecution = true
			}
		}

		if pWeb, ok := plugin["use_openai_api"]; ok {
			if enable, ok := pWeb["enable"].(bool); ok && enable {
				useOpenaiAPI = true
			}
		}
	}

	version := "v1beta"
	if channel.Other != "" {
		version = channel.Other
	}

	return &GeminiProvider{
		OpenAIProvider: openai.OpenAIProvider{
			BaseProvider: base.BaseProvider{
				Config:    getConfig(version),
				Channel:   channel,
				Requester: requester.NewHTTPRequester(*channel.Proxy, RequestErrorHandle),
			},
			SupportStreamOptions: true,
		},
		UseOpenaiAPI:     useOpenaiAPI,
		UseCodeExecution: useCodeExecution,
	}
}

type GeminiProvider struct {
	openai.OpenAIProvider
	UseOpenaiAPI     bool
	UseCodeExecution bool
}

func getConfig(version string) base.ProviderConfig {
	return base.ProviderConfig{
		BaseURL:         "https://generativelanguage.googleapis.com",
		ChatCompletions: fmt.Sprintf("/%s/chat/completions", version),
		ModelList:       "/models",
	}
}

// 请求错误处理
func RequestErrorHandle(resp *http.Response) *types.OpenAIError {
	geminiError := &GeminiErrorResponse{}
	err := json.NewDecoder(resp.Body).Decode(geminiError)
	if err != nil {
		return nil
	}

	return errorHandle(geminiError)
}

// 错误处理
func errorHandle(geminiError *GeminiErrorResponse) *types.OpenAIError {
	if geminiError.ErrorInfo == nil || geminiError.ErrorInfo.Message == "" {
		return nil
	}

	cleaningError(geminiError.ErrorInfo)

	return &types.OpenAIError{
		Message: geminiError.ErrorInfo.Message,
		Type:    "gemini_error",
		Param:   geminiError.ErrorInfo.Status,
		Code:    geminiError.ErrorInfo.Code,
	}
}

func cleaningError(errorInfo *GeminiError) {
	if errorInfo.Status == "PERMISSIONDENIED" || strings.Contains(errorInfo.Message, "Publisher Model") || strings.Contains(errorInfo.Message, "apikey") || strings.Contains(errorInfo.Message, "Permission denied") {
		logger.SysError(fmt.Sprintf("Gemini Error: %s", errorInfo.Message))
		errorInfo.Message = "上游错误，请联系管理员."
	}
}

func (p *GeminiProvider) GetFullRequestURL(requestURL string, modelName string) string {
	baseURL := strings.TrimSuffix(p.GetBaseURL(), "/")
	version := "v1beta"
	if p.Channel.Other != "" {
		version = p.Channel.Other
	}

	return fmt.Sprintf("%s/%s/models/%s:%s", baseURL, version, modelName, requestURL)

}

// 获取请求头
func (p *GeminiProvider) GetRequestHeaders() (headers map[string]string) {
	headers = make(map[string]string)
	p.CommonRequestHeaders(headers)
	headers["x-goog-api-key"] = p.Channel.Key

	return headers
}
