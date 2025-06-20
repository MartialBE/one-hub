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
		Completions:         "/completions",
		ChatCompletions:     "/chat/completions",
		Embeddings:          "/embeddings",
		AudioSpeech:         "/audio/speech",
		AudioTranscriptions: "/audio/transcriptions",
		AudioTranslations:   "/audio/translations",
		ImagesGenerations:   "/images/generations",
		ImagesEdit:          "/images/edits",
		ImagesVariations:    "/images/variations", //azure dall-e-2 variations支持
		ChatRealtime:        "/realtime",
		ModelList:           "isGetAzureModelList", // 在azure中该参数不参与实际url拼接，只是起到flag的作用
		Responses:           "/responses",
	}
}

type AzureProvider struct {
	openai.OpenAIProvider
}
