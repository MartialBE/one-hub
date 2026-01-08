package deepseek

import (
	"one-api/common/requester"
	"one-api/model"
	"one-api/providers/base"
	"one-api/providers/openai"
)

type DeepseekProviderFactory struct{}

// 创建 DeepseekProvider
func (f DeepseekProviderFactory) Create(channel *model.Channel) base.ProviderInterface {
	config := getDeepseekConfig()
	return &DeepseekProvider{
		OpenAIProvider: openai.OpenAIProvider{
			BaseProvider: base.BaseProvider{
				Config:    config,
				Channel:   channel,
				Requester: requester.NewHTTPRequester(*channel.Proxy, openai.RequestErrorHandle),
			},
			BalanceAction:     false,
			RequestMapHandler: deepseekRequestMapHandler,
		},
	}
}

// deepseekRequestMapHandler 为 DeepSeek 渠道的 assistant 消息添加 reasoning_content 字段
// DeepSeek API 要求 assistant 消息必须包含 reasoning_content 字段，即使为空字符串
func deepseekRequestMapHandler(requestMap map[string]interface{}) {
	messages, ok := requestMap["messages"].([]interface{})
	if !ok {
		return
	}

	for _, msg := range messages {
		msgMap, ok := msg.(map[string]interface{})
		if !ok {
			continue
		}

		role, _ := msgMap["role"].(string)
		if role == "assistant" {
			// 如果没有 reasoning_content 字段，添加空字符串
			if _, exists := msgMap["reasoning_content"]; !exists {
				msgMap["reasoning_content"] = ""
			}
		}
	}
}

func getDeepseekConfig() base.ProviderConfig {
	return base.ProviderConfig{
		BaseURL:         "https://api.deepseek.com",
		ChatCompletions: "/v1/chat/completions",
		ModelList:       "/v1/models",
	}
}

type DeepseekProvider struct {
	openai.OpenAIProvider
}
