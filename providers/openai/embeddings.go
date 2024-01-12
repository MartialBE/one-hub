package openai

import (
	"encoding/json"
	"net/http"
	"one-api/common"
	"one-api/providers/base"
	"one-api/types"
)

type OpenaiEmbedHandler struct {
	base.BaseHandler
	Request *types.EmbeddingRequest
}

func (p *OpenAIProvider) CreateEmbeddings(request *types.EmbeddingRequest, promptTokens int) (response *types.EmbeddingResponse, errWithCode *types.OpenAIErrorWithStatusCode) {
	openaiEmbedHandler := &OpenaiEmbedHandler{
		BaseHandler: base.BaseHandler{
			Usage: p.Usage,
		},
		Request: request,
	}

	resp, errWithCode := openaiEmbedHandler.getResponse(p)

	defer resp.Body.Close()

	openaiResponse := &OpenAIProviderEmbeddingsResponse{}
	err := json.NewDecoder(resp.Body).Decode(openaiResponse)
	if err != nil {
		errWithCode = common.ErrorWrapper(err, "decode_response_body_failed", http.StatusInternalServerError)
		return
	}

	return openaiEmbedHandler.convertToOpenai(openaiResponse)
}

func (h *OpenaiEmbedHandler) getResponse(p *OpenAIProvider) (*http.Response, *types.OpenAIErrorWithStatusCode) {
	url, err := p.GetSupportedAPIUri(common.RelayModeEmbeddings)
	if err != nil {
		return nil, err
	}
	// 获取请求地址
	fullRequestURL := p.GetFullRequestURL(url, h.Request.Model)

	// 获取请求头
	headers := p.GetRequestHeaders()

	// 发送请求
	return p.SendJsonRequest(http.MethodPost, fullRequestURL, h.Request, headers)
}

func (h *OpenaiEmbedHandler) convertToOpenai(response *OpenAIProviderEmbeddingsResponse) (openaiResponse *types.EmbeddingResponse, errWithCode *types.OpenAIErrorWithStatusCode) {
	error := ErrorHandle(&response.OpenAIErrorResponse)
	if error != nil {
		errWithCode = &types.OpenAIErrorWithStatusCode{
			OpenAIError: *error,
			StatusCode:  http.StatusBadRequest,
		}
		return
	}

	h.Usage = response.Usage

	return &response.EmbeddingResponse, nil
}
