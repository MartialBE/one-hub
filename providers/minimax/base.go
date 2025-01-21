package minimax

import (
	"encoding/json"
	"net/http"
	"one-api/common/requester"
	"one-api/model"
	"one-api/providers/base"
	"one-api/providers/openai"
	"one-api/types"
)

type MiniMaxProviderFactory struct{}

// 创建 MiniMaxProvider
func (f MiniMaxProviderFactory) Create(channel *model.Channel) base.ProviderInterface {
	return &MiniMaxProvider{
		OpenAIProvider: openai.OpenAIProvider{
			BaseProvider: base.BaseProvider{
				Config:    getConfig(),
				Channel:   channel,
				Requester: requester.NewHTTPRequester(*channel.Proxy, requestErrorHandle),
			},
		},
	}
}

type MiniMaxProvider struct {
	openai.OpenAIProvider
}

func getConfig() base.ProviderConfig {
	return base.ProviderConfig{
		BaseURL:         "https://api.minimax.chat",
		ChatCompletions: "/v1/chat/completions",
		AudioSpeech:     "/v1/t2a_v2",
		// Embeddings:      "/v1/embeddings",
		// ModelList:       "/v1/models",
	}
}

// 请求错误处理
func requestErrorHandle(resp *http.Response) *types.OpenAIError {
	minimaxError := &MiniMaxBaseResp{}
	err := json.NewDecoder(resp.Body).Decode(minimaxError)
	if err != nil {
		return nil
	}

	return errorHandle(&minimaxError.BaseResp)
}

// 错误处理
func errorHandle(minimaxError *BaseResp) *types.OpenAIError {
	if minimaxError.StatusCode == 0 {
		return nil
	}
	return &types.OpenAIError{
		Message: minimaxError.StatusMsg,
		Type:    "minimax_error",
		Code:    minimaxError.StatusCode,
	}
}
