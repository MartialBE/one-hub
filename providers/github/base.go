package github

import (
	"one-api/common/requester"
	"one-api/model"
	"one-api/providers/base"
	"one-api/providers/openai"
)

type GithubProviderFactory struct{}

// 创建 GithubProvider
func (f GithubProviderFactory) Create(channel *model.Channel) base.ProviderInterface {
	config := getGithubConfig()
	return &GithubProvider{
		OpenAIProvider: openai.OpenAIProvider{
			BaseProvider: base.BaseProvider{
				Config:    config,
				Channel:   channel,
				Requester: requester.NewHTTPRequester(*channel.Proxy, openai.RequestErrorHandle),
			},
			BalanceAction: false,
		},
	}
}

func getGithubConfig() base.ProviderConfig {
	return base.ProviderConfig{
		BaseURL:         "https://models.inference.ai.azure.com",
		ChatCompletions: "/chat/completions",
		Embeddings:      "/embeddings",
	}
}

type GithubProvider struct {
	openai.OpenAIProvider
}
