package azure_v1

import (
	"one-api/common/requester"
	"one-api/model"
	"one-api/providers/base"
	"one-api/providers/openai"
)

type AzureV1ProviderFactory struct{}

// 创建 AzureProvider
func (f AzureV1ProviderFactory) Create(channel *model.Channel) base.ProviderInterface {
	config := getAzureConfig()
	return &AzureV1Provider{
		OpenAIProvider: openai.OpenAIProvider{
			BaseProvider: base.BaseProvider{
				Config:          config,
				Channel:         channel,
				Requester:       requester.NewHTTPRequester(*channel.Proxy, openai.RequestErrorHandle),
				SupportResponse: true,
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
		Completions:         "/v1/completions",
		ChatCompletions:     "/v1/chat/completions",
		Embeddings:          "/v1/embeddings",
		AudioSpeech:         "/v1/audio/speech",
		AudioTranscriptions: "/v1/audio/transcriptions",
		AudioTranslations:   "/v1/audio/translations",
		ImagesGenerations:   "/v1/images/generations",
		ChatRealtime:        "/v1/realtime",
		ModelList:           "1", // 在azure中该参数不参与实际url拼接，只是起到flag的作用
		Responses:           "/v1/responses",
	}
}

type AzureV1Provider struct {
	openai.OpenAIProvider
}
