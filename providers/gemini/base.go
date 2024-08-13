package gemini

import (
	"encoding/json"
	"fmt"
	"net/http"
	"one-api/common/logger"
	"one-api/common/requester"
	"one-api/model"
	"one-api/providers/base"
	"one-api/types"
	"strings"
)

type GeminiProviderFactory struct{}

// 创建 GeminiProvider
func (f GeminiProviderFactory) Create(channel *model.Channel) base.ProviderInterface {
	return &GeminiProvider{
		BaseProvider: base.BaseProvider{
			Config:    getConfig(),
			Channel:   channel,
			Requester: requester.NewHTTPRequester(*channel.Proxy, RequestErrorHandle),
		},
	}
}

type GeminiProvider struct {
	base.BaseProvider
}

func getConfig() base.ProviderConfig {
	return base.ProviderConfig{
		BaseURL:         "https://generativelanguage.googleapis.com",
		ChatCompletions: "/",
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
	if strings.Contains(errorInfo.Message, "Publisher Model") || strings.Contains(errorInfo.Message, "api_key") {
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
