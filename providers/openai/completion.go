package openai

import (
	"encoding/json"
	"net/http"
	"one-api/common"
	"one-api/common/requester"
	"one-api/providers/base"
	"one-api/types"
	"strings"
)

type OpenAICompletionHandler struct {
	base.BaseHandler
	Request *types.CompletionRequest
}

func (p *OpenAIProvider) initCompletion(request *types.CompletionRequest) (handler *OpenAICompletionHandler, resp *http.Response, errWithCode *types.OpenAIErrorWithStatusCode) {
	handler = &OpenAICompletionHandler{
		BaseHandler: base.BaseHandler{
			Usage: p.Usage,
		},
		Request: request,
	}
	resp, errWithCode = handler.getResponse(p)

	return
}

func (p *OpenAIProvider) CreateCompletion(request *types.CompletionRequest) (openaiResponse *types.CompletionResponse, errWithCode *types.OpenAIErrorWithStatusCode) {
	handler, resp, errWithCode := p.initCompletion(request)
	if errWithCode != nil {
		return
	}

	defer resp.Body.Close()

	response := &OpenAIProviderCompletionResponse{}
	err := json.NewDecoder(resp.Body).Decode(response)
	if err != nil {
		errWithCode = common.ErrorWrapper(err, "decode_response_body_failed", http.StatusInternalServerError)
		return
	}

	return handler.convertToOpenai(response)
}

func (p *OpenAIProvider) CreateCompletionStream(request *types.CompletionRequest) (stream requester.StreamReaderInterface[types.CompletionResponse], errWithCode *types.OpenAIErrorWithStatusCode) {
	handler, resp, errWithCode := p.initCompletion(request)
	if errWithCode != nil {
		return
	}

	return requester.RequestStream[types.CompletionResponse](p.Requester, resp, handler.handlerStream)
}

func (h *OpenAICompletionHandler) getResponse(p *OpenAIProvider) (*http.Response, *types.OpenAIErrorWithStatusCode) {
	url, err := p.GetSupportedAPIUri(common.RelayModeCompletions)
	if err != nil {
		return nil, err
	}
	// 获取请求地址
	fullRequestURL := p.GetFullRequestURL(url, h.Request.Model)

	// 获取请求头
	headers := p.GetRequestHeaders()
	if h.Request.Stream {
		headers["Accept"] = "text/event-stream"
	}

	// 发送请求
	return p.SendJsonRequest(http.MethodPost, fullRequestURL, h.Request, headers)
}

func (h *OpenAICompletionHandler) convertToOpenai(response *OpenAIProviderCompletionResponse) (openaiResponse *types.CompletionResponse, errWithCode *types.OpenAIErrorWithStatusCode) {
	error := ErrorHandle(&response.OpenAIErrorResponse)
	if error != nil {
		errWithCode = &types.OpenAIErrorWithStatusCode{
			OpenAIError: *error,
			StatusCode:  http.StatusBadRequest,
		}
		return
	}

	h.Usage = response.Usage

	return &response.CompletionResponse, nil
}

func (h *OpenAICompletionHandler) handlerStream(rawLine *[]byte, isFinished *bool, response *[]types.CompletionResponse) error {
	// 如果rawLine 前缀不为data:，则直接返回
	if !strings.HasPrefix(string(*rawLine), "data: ") {
		*rawLine = nil
		return nil
	}

	// 去除前缀
	*rawLine = (*rawLine)[5:]

	var openaiResponse OpenAIProviderCompletionResponse
	err := json.Unmarshal(*rawLine, &openaiResponse)
	if err != nil {
		return common.ErrorToOpenAIError(err)
	}

	error := ErrorHandle(&openaiResponse.OpenAIErrorResponse)
	if error != nil {
		return error
	}

	return h.convertToOpenaiStream(&openaiResponse, response)
}

func (h *OpenAICompletionHandler) convertToOpenaiStream(openaiResponse *OpenAIProviderCompletionResponse, response *[]types.CompletionResponse) error {
	countTokenText := common.CountTokenText(openaiResponse.getResponseText(), h.Request.Model)
	h.Usage.CompletionTokens += countTokenText
	h.Usage.TotalTokens += countTokenText

	*response = append(*response, openaiResponse.CompletionResponse)

	return nil
}

func (c *OpenAIProviderCompletionResponse) ResponseHandler(resp *http.Response) (OpenAIResponse any, errWithCode *types.OpenAIErrorWithStatusCode) {
	if c.Error.Type != "" {
		errWithCode = &types.OpenAIErrorWithStatusCode{
			OpenAIError: c.Error,
			StatusCode:  resp.StatusCode,
		}
		return
	}
	return nil, nil
}
