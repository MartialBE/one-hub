package gemini

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
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
				Requester: requester.NewHTTPRequester(*channel.Proxy, RequestErrorHandle(channel.Key)),
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
func RequestErrorHandle(key string) requester.HttpErrorHandler {
	return func(resp *http.Response) *types.OpenAIError {
		bodyBytes, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil
		}
		resp.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

		geminiError := &GeminiErrorResponse{}
		if err := json.NewDecoder(resp.Body).Decode(geminiError); err == nil {
			return errorHandle(geminiError, key)
		} else {
			geminiErrors := &GeminiErrors{}
			if err := json.Unmarshal(bodyBytes, geminiErrors); err == nil {
				return errorHandle(geminiErrors.Error(), key)
			}
		}

		return nil
	}
}

// 错误处理
func errorHandle(geminiError *GeminiErrorResponse, key string) *types.OpenAIError {
	if geminiError.ErrorInfo == nil || geminiError.ErrorInfo.Message == "" {
		return nil
	}

	cleaningError(geminiError.ErrorInfo, key)

	return &types.OpenAIError{
		Message: geminiError.ErrorInfo.Message,
		Type:    "gemini_error",
		Param:   geminiError.ErrorInfo.Status,
		Code:    geminiError.ErrorInfo.Code,
	}
}

func cleaningError(errorInfo *GeminiError, key string) {
	if key == "" {
		return
	}
	message := strings.Replace(errorInfo.Message, key, "xxxxx", 1)
	errorInfo.Message = message
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
