package openrouter

import (
	"net/http"
	"one-api/common/requester"
	"one-api/model"
	"one-api/providers/base"
	"one-api/providers/openai"
	"one-api/types"
)

// 定义供应商工厂
type OpenRouterProviderFactory struct{}

// 创建 OpenRouterProvider
// https://platform.-ai.com/docs/api
func (f OpenRouterProviderFactory) Create(channel *model.Channel) base.ProviderInterface {

	return &OpenRouterProvider{
		OpenAIProvider: openai.OpenAIProvider{
			BaseProvider: base.BaseProvider{
				Config:    getConfig(),
				Channel:   channel,
				Requester: requester.NewHTTPRequester(*channel.Proxy, RequestErrorHandle),
			},

			ReasoningHandler:     true,
			SupportStreamOptions: true,
		},
	}
}

// RequestErrorHandle 转发到OpenAI的错误处理函数
func RequestErrorHandle(resp *http.Response) *types.OpenAIError {
	return openai.RequestErrorHandle(resp)
}

func getConfig() base.ProviderConfig {
	return base.ProviderConfig{
		BaseURL:         "https://openrouter.ai/api",
		ChatCompletions: "/v1/chat/completions",
		ModelList:       "/v1/models",
	}
}

type OpenRouterProvider struct {
	openai.OpenAIProvider
}
