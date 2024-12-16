package siliconflow

import (
	"encoding/json"
	"fmt"
	"net/http"
	"one-api/common/requester"
	"one-api/model"
	"one-api/providers/base"
	"one-api/providers/openai"
	"one-api/types"
	"strings"
)

type SiliconflowProviderFactory struct{}

// 创建 SiliconflowProvider
func (f SiliconflowProviderFactory) Create(channel *model.Channel) base.ProviderInterface {
	return &SiliconflowProvider{
		OpenAIProvider: openai.OpenAIProvider{
			BaseProvider: base.BaseProvider{
				Config:    getConfig(),
				Channel:   channel,
				Requester: requester.NewHTTPRequester(*channel.Proxy, requestErrorHandle),
			},
		},
	}
}

type SiliconflowProvider struct {
	openai.OpenAIProvider
}

func getConfig() base.ProviderConfig {
	return base.ProviderConfig{
		BaseURL:             "https://api.siliconflow.com",
		ImagesGenerations:   "/v1/%s/text-to-image",
		ChatCompletions:     "/v1/chat/completions",
		Embeddings:          "/v1/embeddings",
		AudioTranscriptions: "/v1/audio/transcriptions",
		Rerank:              "/v1/rerank",
		ModelList:           "/v1/models",
	}
}

// 请求错误处理
func requestErrorHandle(resp *http.Response) *types.OpenAIError {
	siliconflowError := &SiliError{}
	err := json.NewDecoder(resp.Body).Decode(siliconflowError)
	if err != nil {
		return nil
	}

	return errorHandle(siliconflowError)
}

// 错误处理
func errorHandle(siliconflowError *SiliError) *types.OpenAIError {
	if siliconflowError.Code == 0 {
		return nil
	}
	return &types.OpenAIError{
		Message: siliconflowError.Message,
		Type:    "siliconflow_error",
		Code:    siliconflowError.Code,
	}
}

// 获取请求头
func (p *SiliconflowProvider) GetRequestHeaders() (headers map[string]string) {
	headers = make(map[string]string)
	p.CommonRequestHeaders(headers)
	headers["Authorization"] = fmt.Sprintf("Bearer %s", p.Channel.Key)

	return headers
}

// 获取完整请求 URL
func (p *SiliconflowProvider) GetFullRequestURL(requestURL string, modelName string) string {
	baseURL := strings.TrimSuffix(p.GetBaseURL(), "/")

	if requestURL == p.Config.ImagesGenerations {

		requestURL = fmt.Sprintf(requestURL, modelName)
	}

	return fmt.Sprintf("%s%s", baseURL, requestURL)
}
