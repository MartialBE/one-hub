package palm

import (
	"fmt"
	"one-api/model"
	"one-api/providers/base"
	"strings"
)

type PalmProviderFactory struct{}

// 创建 PalmProvider
func (f PalmProviderFactory) Create(channel *model.Channel) base.ProviderInterface {
	return &PalmProvider{
		BaseProvider: base.BaseProvider{
			BaseURL:         "https://generativelanguage.googleapis.com",
			ChatCompletions: "/v1beta2/models/chat-bison-001:generateMessage",
			Context:         c,
		},
	}
}

type PalmProvider struct {
	base.BaseProvider
}

// 获取请求头
func (p *PalmProvider) GetRequestHeaders() (headers map[string]string) {
	headers = make(map[string]string)
	p.CommonRequestHeaders(headers)
	headers["x-goog-api-key"] = p.Channel.Key

	return headers
}

// 获取完整请求 URL
func (p *PalmProvider) GetFullRequestURL(requestURL string, modelName string) string {
	baseURL := strings.TrimSuffix(p.GetBaseURL(), "/")

	return fmt.Sprintf("%s%s", baseURL, requestURL)
}
