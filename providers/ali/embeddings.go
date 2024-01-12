package ali

import (
	"encoding/json"
	"net/http"
	"one-api/common"
	"one-api/providers/base"
	"one-api/types"
)

type aliEmbedHandler struct {
	base.BaseHandler
	Request *types.EmbeddingRequest
}

func (p *AliProvider) CreateEmbeddings(request *types.EmbeddingRequest, promptTokens int) (response *types.EmbeddingResponse, errWithCode *types.OpenAIErrorWithStatusCode) {
	aliEmbedHandler := &aliEmbedHandler{
		BaseHandler: base.BaseHandler{
			Usage: p.Usage,
		},
		Request: request,
	}

	resp, errWithCode := aliEmbedHandler.getResponse(p)

	defer resp.Body.Close()

	aliResponse := &AliEmbeddingResponse{}
	err := json.NewDecoder(resp.Body).Decode(aliResponse)
	if err != nil {
		errWithCode = common.ErrorWrapper(err, "decode_response_body_failed", http.StatusInternalServerError)
		return
	}

	return aliEmbedHandler.convertToOpenai(aliResponse)

}

func (h *aliEmbedHandler) getResponse(p *AliProvider) (*http.Response, *types.OpenAIErrorWithStatusCode) {
	url, err := p.GetSupportedAPIUri(common.RelayModeEmbeddings)
	if err != nil {
		return nil, err
	}
	// 获取请求地址
	fullRequestURL := p.GetFullRequestURL(url, h.Request.Model)

	// 获取请求头
	headers := p.GetRequestHeaders()

	aliChatRequest := h.convertFromOpenai()

	// 发送请求
	return p.SendJsonRequest(http.MethodPost, fullRequestURL, aliChatRequest, headers)
}

func (h *aliEmbedHandler) convertFromOpenai() *AliEmbeddingRequest {
	return &AliEmbeddingRequest{
		Model: "text-embedding-v1",
		Input: struct {
			Texts []string `json:"texts"`
		}{
			Texts: h.Request.ParseInput(),
		},
	}
}

func (h *aliEmbedHandler) convertToOpenai(response *AliEmbeddingResponse) (openaiResponse *types.EmbeddingResponse, errWithCode *types.OpenAIErrorWithStatusCode) {
	error := errorHandle(&response.AliError)
	if error != nil {
		errWithCode = &types.OpenAIErrorWithStatusCode{
			OpenAIError: *error,
			StatusCode:  http.StatusBadRequest,
		}
		return
	}

	openaiResponse = &types.EmbeddingResponse{
		Object: "list",
		Data:   make([]types.Embedding, 0, len(response.Output.Embeddings)),
		Model:  h.Request.Model,
		Usage:  &types.Usage{TotalTokens: response.Usage.TotalTokens},
	}

	for _, item := range response.Output.Embeddings {
		openaiResponse.Data = append(openaiResponse.Data, types.Embedding{
			Object:    `embedding`,
			Index:     item.TextIndex,
			Embedding: item.Embedding,
		})
	}

	return
}
