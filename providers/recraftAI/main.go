package recraftAI

import (
	"encoding/json"
	"fmt"
	"net/http"
	"one-api/common/requester"
	"one-api/model"
	"one-api/providers/base"
	"one-api/types"
	"strings"
)

type RecraftProviderFactory struct{}

// 创建 RecraftProvider
func (f RecraftProviderFactory) Create(channel *model.Channel) base.ProviderInterface {
	return &RecraftProvider{
		BaseProvider: base.BaseProvider{
			Config:    getConfig(),
			Channel:   channel,
			Requester: requester.NewHTTPRequester(*channel.Proxy, requestErrorHandle),
		},
		StylesUrl:            "/v1/styles",
		VectorizeUrl:         "/v1/images/vectorize",
		RemoveBackgroundUrl:  "/v1/images/removeBackground",
		ClarityUpscaleUrl:    "/v1/images/clarityUpscale",
		GenerativeUpscaleUrl: "/v1/images/generativeUpscale",
	}
}

type RecraftProvider struct {
	base.BaseProvider
	StylesUrl            string
	VectorizeUrl         string
	RemoveBackgroundUrl  string
	ClarityUpscaleUrl    string
	GenerativeUpscaleUrl string
}

func getConfig() base.ProviderConfig {
	return base.ProviderConfig{
		BaseURL:           "https://external.api.recraft.ai",
		ImagesGenerations: "/v1/images/generations",
	}
}

// 请求错误处理
func requestErrorHandle(resp *http.Response) *types.OpenAIError {
	recraftError := &RecraftError{}
	err := json.NewDecoder(resp.Body).Decode(recraftError)
	if err != nil {
		return nil
	}

	return errorHandle(recraftError)
}

// 错误处理
func errorHandle(recraftError *RecraftError) *types.OpenAIError {
	if recraftError.Code == "" {
		return nil
	}
	return &types.OpenAIError{
		Message: recraftError.Message,
		Type:    "recraft_error",
		Code:    recraftError.Code,
	}
}

// 获取请求头
func (p *RecraftProvider) GetRequestHeaders() (headers map[string]string) {
	headers = make(map[string]string)
	p.CommonRequestHeaders(headers)
	headers["Authorization"] = fmt.Sprintf("Bearer %s", p.Channel.Key)

	return headers
}

// 获取完整请求 URL
func (p *RecraftProvider) GetFullRequestURL(requestURL string) string {
	baseURL := strings.TrimSuffix(p.GetBaseURL(), "/")

	return fmt.Sprintf("%s%s", baseURL, requestURL)
}
