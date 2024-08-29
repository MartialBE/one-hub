package jina

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

type JinaProviderFactory struct{}

// 创建 JinaProvider
func (f JinaProviderFactory) Create(channel *model.Channel) base.ProviderInterface {
	return &JinaProvider{
		OpenAIProvider: openai.OpenAIProvider{
			BaseProvider: base.BaseProvider{
				Config:    getConfig(),
				Channel:   channel,
				Requester: requester.NewHTTPRequester(*channel.Proxy, requestErrorHandle),
			},
		},
	}
}

type JinaProvider struct {
	openai.OpenAIProvider
}

func getConfig() base.ProviderConfig {
	return base.ProviderConfig{
		BaseURL: "https://api.jina.ai",
		// Embeddings: "/v1/embeddings",
		Rerank: "/v1/rerank",
	}
}

// 请求错误处理
func requestErrorHandle(resp *http.Response) *types.OpenAIError {
	jinaError := &types.RerankError{}
	err := json.NewDecoder(resp.Body).Decode(jinaError)
	if err != nil {
		return nil
	}

	return errorHandle(jinaError)
}

// 错误处理
func errorHandle(jinaError *types.RerankError) *types.OpenAIError {
	if jinaError.Detail == "" {
		return nil
	}
	return &types.OpenAIError{
		Message: jinaError.Detail,
		Type:    "jina_error",
		Code:    500,
	}
}

// 获取请求头
func (p *JinaProvider) GetRequestHeaders() (headers map[string]string) {
	headers = make(map[string]string)
	p.CommonRequestHeaders(headers)
	headers["Authorization"] = fmt.Sprintf("Bearer %s", p.Channel.Key)

	return headers
}

// 获取完整请求 URL
func (p *JinaProvider) GetFullRequestURL(requestURL string) string {
	baseURL := strings.TrimSuffix(p.GetBaseURL(), "/")

	return fmt.Sprintf("%s%s", baseURL, requestURL)
}
