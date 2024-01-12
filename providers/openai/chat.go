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

type OpenAIChatHandler struct {
	base.BaseHandler
	Request *types.ChatCompletionRequest
}

func (p *OpenAIProvider) initChat(request *types.ChatCompletionRequest) (chatHandler *OpenAIChatHandler, resp *http.Response, errWithCode *types.OpenAIErrorWithStatusCode) {
	chatHandler = &OpenAIChatHandler{
		BaseHandler: base.BaseHandler{
			Usage: p.Usage,
		},
		Request: request,
	}
	resp, errWithCode = chatHandler.getResponse(p)

	return
}

func (p *OpenAIProvider) CreateChatCompletion(request *types.ChatCompletionRequest) (openaiResponse *types.ChatCompletionResponse, errWithCode *types.OpenAIErrorWithStatusCode) {
	chatHandler, resp, errWithCode := p.initChat(request)
	if errWithCode != nil {
		return
	}

	defer resp.Body.Close()

	response := &OpenAIProviderChatResponse{}
	err := json.NewDecoder(resp.Body).Decode(response)
	if err != nil {
		errWithCode = common.ErrorWrapper(err, "decode_response_body_failed", http.StatusInternalServerError)
		return
	}

	return chatHandler.convertToOpenai(response)
}

func (p *OpenAIProvider) CreateChatCompletionStream(request *types.ChatCompletionRequest) (stream requester.StreamReaderInterface[types.ChatCompletionStreamResponse], errWithCode *types.OpenAIErrorWithStatusCode) {
	chatHandler, resp, errWithCode := p.initChat(request)
	if errWithCode != nil {
		return
	}

	return requester.RequestStream[types.ChatCompletionStreamResponse](p.Requester, resp, chatHandler.handlerStream)
}

func (h *OpenAIChatHandler) getResponse(p *OpenAIProvider) (*http.Response, *types.OpenAIErrorWithStatusCode) {
	url, err := p.GetSupportedAPIUri(common.RelayModeChatCompletions)
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

func (h *OpenAIChatHandler) convertToOpenai(response *OpenAIProviderChatResponse) (openaiResponse *types.ChatCompletionResponse, errWithCode *types.OpenAIErrorWithStatusCode) {
	error := ErrorHandle(&response.OpenAIErrorResponse)
	if error != nil {
		errWithCode = &types.OpenAIErrorWithStatusCode{
			OpenAIError: *error,
			StatusCode:  http.StatusBadRequest,
		}
		return
	}

	h.Usage = response.Usage

	return &response.ChatCompletionResponse, nil
}

func (h *OpenAIChatHandler) handlerStream(rawLine *[]byte, isFinished *bool, response *[]types.ChatCompletionStreamResponse) error {
	// 如果rawLine 前缀不为data:，则直接返回
	if !strings.HasPrefix(string(*rawLine), "data: ") {
		*rawLine = nil
		return nil
	}

	// 去除前缀
	*rawLine = (*rawLine)[5:]

	var openaiResponse OpenAIProviderChatStreamResponse
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

func (h *OpenAIChatHandler) convertToOpenaiStream(openaiResponse *OpenAIProviderChatStreamResponse, response *[]types.ChatCompletionStreamResponse) error {
	countTokenText := common.CountTokenText(openaiResponse.getResponseText(), h.Request.Model)
	h.Usage.CompletionTokens += countTokenText
	h.Usage.TotalTokens += countTokenText

	*response = append(*response, openaiResponse.ChatCompletionStreamResponse)

	return nil
}
