package ali

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"one-api/common/requester"
	"one-api/model"
	"one-api/providers/base"
	"one-api/providers/openai"
	"one-api/types"
)

const (
	OpenaiBaseURL = "https://dashscope.aliyuncs.com/compatible-mode"
	AliBaseURL    = "https://dashscope.aliyuncs.com"
)

// 定义供应商工厂
type AliProviderFactory struct{}

type AliProvider struct {
	openai.OpenAIProvider

	UseOpenaiAPI bool
}

// 创建 AliProvider
// https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation
func (f AliProviderFactory) Create(channel *model.Channel) base.ProviderInterface {
	useOpenaiAPI := false

	if channel.Plugin != nil {
		plugin := channel.Plugin.Data()
		if pOpenAI, ok := plugin["use_openai_api"]; ok {
			if enable, ok := pOpenAI["enable"].(bool); ok && enable {
				useOpenaiAPI = true
			}
		}
	}

	provider := &AliProvider{
		OpenAIProvider: openai.OpenAIProvider{
			BaseProvider: base.BaseProvider{
				Config:  getConfig(useOpenaiAPI),
				Channel: channel,
				// Requester: requester.NewHTTPRequester(*channel.Proxy, requestErrorHandle),
			},
			StreamEscapeJSON:     true,
			SupportStreamOptions: true,
		},
		UseOpenaiAPI: useOpenaiAPI,
	}

	if useOpenaiAPI {
		provider.Requester = requester.NewHTTPRequester(*channel.Proxy, openai.RequestErrorHandle)
	} else {
		provider.Requester = requester.NewHTTPRequester(*channel.Proxy, requestErrorHandle)
	}

	return provider
}

func getConfig(useOpenaiAPI bool) base.ProviderConfig {
	if useOpenaiAPI {
		return base.ProviderConfig{
			BaseURL:         OpenaiBaseURL,
			ChatCompletions: "/v1/chat/completions",
			Embeddings:      "/v1/embeddings",
			ModelList:       "/v1/models",
		}
	}

	return base.ProviderConfig{
		BaseURL:         AliBaseURL,
		ChatCompletions: "/api/v1/services/aigc/text-generation/generation",
		Embeddings:      "/api/v1/services/embeddings/text-embedding/text-embedding",
		ModelList:       "/v1/models",
	}
}

// 请求错误处理
func requestErrorHandle(resp *http.Response) *types.OpenAIError {
	aliError := &AliError{}
	err := json.NewDecoder(resp.Body).Decode(aliError)
	if err != nil {
		return nil
	}

	return errorHandle(aliError)
}

// 错误处理
func errorHandle(aliError *AliError) *types.OpenAIError {
	if aliError.Code == "" {
		return nil
	}
	return &types.OpenAIError{
		Message: aliError.Message,
		Type:    aliError.Code,
		Param:   aliError.RequestId,
		Code:    aliError.Code,
	}
}

func (p *AliProvider) GetFullRequestURL(requestURL string, modelName string) string {
	baseURL := strings.TrimSuffix(p.GetBaseURL(), "/")

	if strings.HasPrefix(modelName, "qwen-vl") {
		requestURL = "/api/v1/services/aigc/multimodal-generation/generation"
	}

	return fmt.Sprintf("%s%s", baseURL, requestURL)
}

// 获取请求头
func (p *AliProvider) GetRequestHeaders() (headers map[string]string) {
	headers = make(map[string]string)
	p.CommonRequestHeaders(headers)
	headers["Authorization"] = fmt.Sprintf("Bearer %s", p.Channel.Key)
	if p.Channel.Other != "" {
		headers["X-DashScope-Plugin"] = p.Channel.Other
	}

	return headers
}
