package ollama

import (
	"encoding/json"
	"fmt"
	"net/http"
	"one-api/common/requester"
	"one-api/model"
	"one-api/providers/base"
	"one-api/types"
)

type OllamaProviderFactory struct{}

type OllamaProvider struct {
	base.BaseProvider
}

// 创建 OllamaProvider
func (f OllamaProviderFactory) Create(channel *model.Channel) base.ProviderInterface {
	config := getOllamaConfig()

	return &OllamaProvider{
		BaseProvider: base.BaseProvider{
			Config:    config,
			Channel:   channel,
			Requester: requester.NewHTTPRequester(*channel.Proxy, RequestErrorHandle),
		},
	}
}

func getOllamaConfig() base.ProviderConfig {
	return base.ProviderConfig{
		BaseURL:         "https://ollama.com",
		ChatCompletions: "/api/chat",
		Embeddings:      "/api/embed",
		ModelList:       "/api/tags",
	}
}

// 请求错误处理
func RequestErrorHandle(resp *http.Response) *types.OpenAIError {
	errorResponse := &OllamaError{}
	err := json.NewDecoder(resp.Body).Decode(errorResponse)
	if err != nil {
		return nil
	}

	return errorHandle(errorResponse)
}

// 错误处理
func errorHandle(OllamaError *OllamaError) *types.OpenAIError {
	if OllamaError.Error == "" {
		return nil
	}
	return &types.OpenAIError{
		Message: OllamaError.Error,
		Type:    "Ollama Error",
	}
}

// 获取请求头
func (p *OllamaProvider) GetRequestHeaders() (headers map[string]string) {
	headers = make(map[string]string)
	p.CommonRequestHeaders(headers)
	headers["Authorization"] = fmt.Sprintf("Bearer %s", p.Channel.Key)

	otherHeaders := p.Channel.Plugin.Data()["headers"]

	for key, value := range otherHeaders {
		headerValue, isString := value.(string)
		if !isString || headerValue == "" {
			continue
		}

		headers[key] = headerValue
	}

	return headers
}
