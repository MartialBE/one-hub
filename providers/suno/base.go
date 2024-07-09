package suno

import (
	"encoding/json"
	"fmt"
	"net/http"
	"one-api/common/requester"
	"one-api/model"
	"one-api/providers/base"
	"one-api/types"
)

// 定义供应商工厂
type SunoProviderFactory struct{}

// 创建 SunoProvider
func (f SunoProviderFactory) Create(channel *model.Channel) base.ProviderInterface {
	return &SunoProvider{
		BaseProvider: base.BaseProvider{
			Config:    getConfig(),
			Channel:   channel,
			Requester: requester.NewHTTPRequester(*channel.Proxy, RequestErrorHandle),
		},
		Account:      "/suno/account",
		Fetchs:       "/suno/fetch",
		Fetch:        "/suno/fetch/%s",
		SubmitMusic:  "/suno/submit/music",
		SubmitLyrics: "/suno/submit/lyrics",
	}
}

func getConfig() base.ProviderConfig {
	return base.ProviderConfig{
		BaseURL:         "",
		ChatCompletions: "/v1/chat/completions",
	}
}

type SunoProvider struct {
	base.BaseProvider
	Account      string
	Fetchs       string
	Fetch        string
	SubmitMusic  string
	SubmitLyrics string
}

func (p *SunoProvider) GetRequestHeaders() (headers map[string]string) {
	headers = make(map[string]string)
	p.CommonRequestHeaders(headers)
	if p.Channel.Key != "" {
		headers["Authorization"] = fmt.Sprintf("Bearer %s", p.Channel.Key)
	}
	return headers
}

// 请求错误处理
func RequestErrorHandle(resp *http.Response) *types.OpenAIError {
	errorResponse := &TaskResponse[any]{}
	err := json.NewDecoder(resp.Body).Decode(errorResponse)
	if err != nil {
		return nil
	}

	return ErrorHandle(errorResponse)
}

// 错误处理
func ErrorHandle(err *TaskResponse[any]) *types.OpenAIError {
	if err.IsSuccess() {
		return nil
	}

	return &types.OpenAIError{
		Code:    err.Code,
		Message: err.Message,
		Type:    "suno_error",
	}
}
