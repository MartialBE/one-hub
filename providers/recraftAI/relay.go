package recraftAI

import (
	"net/http"
	"one-api/common"
	"one-api/types"
)

func (p *RecraftProvider) CreateRelay(url string) (*http.Response, *types.OpenAIErrorWithStatusCode) {

	// 获取请求地址
	fullRequestURL := p.GetFullRequestURL(url)
	if fullRequestURL == "" {
		return nil, common.ErrorWrapper(nil, "invalid_recraft_config", http.StatusInternalServerError)
	}

	// 获取请求头
	headers := p.GetRequestHeaders()

	req, err := p.Requester.NewRequest(
		http.MethodPost,
		fullRequestURL,
		p.Requester.WithBody(p.Context.Request.Body),
		p.Requester.WithHeader(headers),
		p.Requester.WithContentType(p.Context.Request.Header.Get("Content-Type")))
	req.ContentLength = p.Context.Request.ContentLength

	if err != nil {
		return nil, common.ErrorWrapper(err, "new_request_failed", http.StatusInternalServerError)
	}

	// 发送请求
	response, errWithCode := p.Requester.SendRequestRaw(req)
	if errWithCode != nil {
		return nil, errWithCode
	}

	p.Usage.TotalTokens = p.Usage.PromptTokens

	return response, nil
}
