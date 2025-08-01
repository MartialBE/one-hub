package xAI

import (
	"fmt"
	"io"
	"net/http"
	"one-api/common/requester"
	"one-api/model"
	"one-api/providers/base"
	"one-api/providers/openai"
	"one-api/types"
	"strings"
)

// 定义供应商工厂
type XAIProviderFactory struct{}

// 创建 XAIProvider
func (f XAIProviderFactory) Create(channel *model.Channel) base.ProviderInterface {
	fmt.Println("Creating XAIProvider for channel:")
	return &XAIProvider{
		OpenAIProvider: openai.OpenAIProvider{
			BaseProvider: base.BaseProvider{
				Config:    getConfig(),
				Channel:   channel,
				Requester: requester.NewHTTPRequester(*channel.Proxy, RequestErrorHandle),
			},
			UsageHandler:        usageHandler,
			RequestHandleBefore: requestHandler,
		},
	}
}

func getConfig() base.ProviderConfig {
	return base.ProviderConfig{
		BaseURL:           "https://api.x.ai",
		ChatCompletions:   "/v1/chat/completions",
		ImagesGenerations: "/v1/images/generations",
		ModelList:         "/v1/models",
	}
}

type XAIProvider struct {
	openai.OpenAIProvider
}

func RequestErrorHandle(resp *http.Response) *types.OpenAIError {
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil
	}

	msg := string(bodyBytes)
	if msg == "" {
		return nil
	}

	return openai.ErrorHandle(&types.OpenAIErrorResponse{
		Error: types.OpenAIError{
			Message: msg,
			Code:    "xAI_error",
		},
	})
}

func usageHandler(usage *types.Usage) (ForcedFormatting bool) {
	usage.CompletionTokens = usage.TotalTokens - usage.PromptTokens

	return true
}

func requestHandler(request *types.ChatCompletionRequest) (errWithCode *types.OpenAIErrorWithStatusCode) {

	if strings.HasPrefix(request.Model, "grok-4") || strings.HasPrefix(request.Model, "grok-3-mini") || strings.HasPrefix(request.Model, "grok-3-mini-fast") {
		request.Stop = nil
		request.FrequencyPenalty = nil
		request.PresencePenalty = nil
	}

	if strings.HasPrefix(request.Model, "grok-4") {
		request.ReasoningEffort = nil
	}

	return nil
}
