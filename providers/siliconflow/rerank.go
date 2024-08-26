package siliconflow

import (
	"net/http"
	"one-api/common"
	"one-api/common/config"
	"one-api/types"
)

func (p *SiliconflowProvider) CreateRerank(request *types.RerankRequest) (*types.RerankResponse, *types.OpenAIErrorWithStatusCode) {
	url, errWithCode := p.GetSupportedAPIUri(config.RelayModeRerank)
	if errWithCode != nil {
		return nil, errWithCode
	}

	// 获取请求地址
	fullRequestURL := p.GetFullRequestURL(url, request.Model)
	if fullRequestURL == "" {
		return nil, common.ErrorWrapper(nil, "invalid_jina_config", http.StatusInternalServerError)
	}

	// 获取请求头
	headers := p.GetRequestHeaders()

	rerankReq := getRerankRequest(request)

	// 创建请求
	req, err := p.Requester.NewRequest(http.MethodPost, fullRequestURL, p.Requester.WithBody(rerankReq), p.Requester.WithHeader(headers))
	if err != nil {
		return nil, common.ErrorWrapper(err, "new_request_failed", http.StatusInternalServerError)
	}
	defer req.Body.Close()

	cResponse := &RerankResponse{}

	// 发送请求
	_, errWithCode = p.Requester.SendRequest(req, cResponse, false)
	if errWithCode != nil {
		return nil, errWithCode
	}

	return p.ConvertToRerank(cResponse, request)
}

func getRerankRequest(request *types.RerankRequest) *RerankRequest {
	return &RerankRequest{
		Model:           request.Model,
		Query:           request.Query,
		TopN:            request.TopN,
		ReturnDocuments: true,
		Documents:       request.Documents,
	}
}

func (p *SiliconflowProvider) ConvertToRerank(response *RerankResponse, request *types.RerankRequest) (*types.RerankResponse, *types.OpenAIErrorWithStatusCode) {
	rerank := &types.RerankResponse{
		Model:   request.Model,
		Results: response.Results,
		Usage: &types.Usage{
			PromptTokens:     response.Meta.Tokens.InputTokens,
			CompletionTokens: response.Meta.Tokens.OutputTokens,
			TotalTokens:      response.Meta.Tokens.InputTokens + response.Meta.Tokens.OutputTokens,
		},
	}

	*p.Usage = *rerank.Usage

	return rerank, nil
}
