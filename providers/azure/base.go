package azure

import (
	"one-api/common/requester"
	"one-api/model"
	"one-api/providers/base"
	"one-api/providers/openai"
)

type AzureProviderFactory struct{}

// 创建 AzureProvider
func (f AzureProviderFactory) Create(channel *model.Channel) base.ProviderInterface {
	config := getAzureConfig()
	return &AzureProvider{
		OpenAIProvider: openai.OpenAIProvider{
			BaseProvider: base.BaseProvider{
				Config:    config,
				Channel:   channel,
				Requester: requester.NewHTTPRequester(*channel.Proxy, openai.RequestErrorHandle),
			},
			IsAzure:              true,
			BalanceAction:        false,
			SupportStreamOptions: true,
		},
	}
}

func getAzureConfig() base.ProviderConfig {
	return base.ProviderConfig{
		BaseURL:             "",
		Completions:         "/completions",
		ChatCompletions:     "/chat/completions",
		Embeddings:          "/embeddings",
		AudioSpeech:         "/audio/speech",
		AudioTranscriptions: "/audio/transcriptions",
		AudioTranslations:   "/audio/translations",
		ImagesGenerations:   "/images/generations",
		ChatRealtime:        "/realtime",
	}
}

type AzureProvider struct {
	openai.OpenAIProvider
}
