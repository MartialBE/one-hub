package jina

import (
	"net/http"
	"one-api/common"
	"one-api/common/config"
	"one-api/types"
)

func (p *JinaProvider) CreateRerank(request *types.RerankRequest) (*types.RerankResponse, *types.OpenAIErrorWithStatusCode) {
	url, errWithCode := p.GetSupportedAPIUri(config.RelayModeRerank)
	if errWithCode != nil {
		return nil, errWithCode
	}

	// 获取请求地址
	fullRequestURL := p.GetFullRequestURL(url)
	if fullRequestURL == "" {
		return nil, common.ErrorWrapper(nil, "invalid_jina_config", http.StatusInternalServerError)
	}

	// 获取请求头
	headers := p.GetRequestHeaders()

	// 创建请求
	req, err := p.Requester.NewRequest(http.MethodPost, fullRequestURL, p.Requester.WithBody(request), p.Requester.WithHeader(headers))
	if err != nil {
		return nil, common.ErrorWrapper(err, "new_request_failed", http.StatusInternalServerError)
	}
	defer req.Body.Close()

	jinaResponse := &types.RerankResponse{}

	// 发送请求
	_, errWithCode = p.Requester.SendRequest(req, jinaResponse, false)
	if errWithCode != nil {
		return nil, errWithCode
	}

	p.Usage.PromptTokens = jinaResponse.Usage.PromptTokens
	p.Usage.TotalTokens = jinaResponse.Usage.TotalTokens

	return jinaResponse, nil
}
