package cohere

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"one-api/common"
	"one-api/common/config"
	"one-api/common/requester"
	"one-api/common/utils"
	"one-api/providers/base"
	"one-api/types"
	"strings"
)

type CohereStreamHandler struct {
	Usage    *types.Usage
	Request  *types.ChatCompletionRequest
	msgID    string
	startMsg bool
}

func (p *CohereProvider) CreateChatCompletion(request *types.ChatCompletionRequest) (*types.ChatCompletionResponse, *types.OpenAIErrorWithStatusCode) {
	req, errWithCode := p.getChatRequest(request)
	if errWithCode != nil {
		return nil, errWithCode
	}
	defer req.Body.Close()

	cohereResponse := &ChatResponse{}
	// 发送请求
	_, errWithCode = p.Requester.SendRequest(req, cohereResponse, false)
	if errWithCode != nil {
		return nil, errWithCode
	}

	return ConvertToChatOpenai(p, cohereResponse, request)
}

func (p *CohereProvider) CreateChatCompletionStream(request *types.ChatCompletionRequest) (requester.StreamReaderInterface[string], *types.OpenAIErrorWithStatusCode) {
	req, errWithCode := p.getChatRequest(request)
	if errWithCode != nil {
		return nil, errWithCode
	}
	defer req.Body.Close()

	// 发送请求
	resp, errWithCode := p.Requester.SendRequestRaw(req)
	if errWithCode != nil {
		return nil, errWithCode
	}

	chatHandler := &CohereStreamHandler{
		Usage:   p.Usage,
		Request: request,
	}

	return requester.RequestStream(p.Requester, resp, chatHandler.HandlerStream)
}

func (p *CohereProvider) getChatRequest(request *types.ChatCompletionRequest) (*http.Request, *types.OpenAIErrorWithStatusCode) {
	url, errWithCode := p.GetSupportedAPIUri(config.RelayModeChatCompletions)
	if errWithCode != nil {
		return nil, errWithCode
	}

	// 获取请求地址
	fullRequestURL := p.GetFullRequestURL(url)
	if fullRequestURL == "" {
		return nil, common.ErrorWrapper(nil, "invalid_cohere_config", http.StatusInternalServerError)
	}

	headers := p.GetRequestHeaders()
	if request.Stream {
		headers["Accept"] = "text/event-stream"
	}

	cohereRequest, errWithCode := ConvertFromChatOpenai(request)
	if errWithCode != nil {
		return nil, errWithCode
	}

	// 创建请求
	req, err := p.Requester.NewRequest(http.MethodPost, fullRequestURL, p.Requester.WithBody(cohereRequest), p.Requester.WithHeader(headers))
	if err != nil {
		return nil, common.ErrorWrapper(err, "new_request_failed", http.StatusInternalServerError)
	}

	return req, nil
}

func ConvertFromChatOpenai(request *types.ChatCompletionRequest) (*V2ChatRequest, *types.OpenAIErrorWithStatusCode) {
	request.ClearEmptyMessages()

	cohereRequest := V2ChatRequest{
		Model:            request.Model,
		MaxTokens:        &request.MaxTokens,
		Temperature:      request.Temperature,
		P:                request.TopP,
		K:                request.TopK,
		Seed:             request.Seed,
		FrequencyPenalty: request.FrequencyPenalty,
		PresencePenalty:  request.PresencePenalty,
		Stream:           request.Stream,
		StopSequences:    request.Stop,
		Tools:            request.Tools,
		ResponseFormat:   request.ResponseFormat,
		Messages:         request.Messages,
	}

	return &cohereRequest, nil
}

func ConvertToChatOpenai(provider base.ProviderInterface, response *ChatResponse, request *types.ChatCompletionRequest) (openaiResponse *types.ChatCompletionResponse, errWithCode *types.OpenAIErrorWithStatusCode) {
	choice := types.ChatCompletionChoice{
		Index:        0,
		Message:      *response.Message.ToChatCompletionMessage(),
		FinishReason: convertFinishReason(response.FinishReason),
	}
	openaiResponse = &types.ChatCompletionResponse{
		ID:      response.Id,
		Object:  "chat.completion",
		Created: utils.GetTimestamp(),
		Choices: []types.ChatCompletionChoice{choice},
		Model:   request.Model,
		Usage:   &types.Usage{},
	}

	*openaiResponse.Usage = usageHandle(response.Usage.BilledUnits)

	usage := provider.GetUsage()
	*usage = *openaiResponse.Usage

	return openaiResponse, nil
}

// 转换为OpenAI聊天流式请求体
func (h *CohereStreamHandler) HandlerStream(rawLine *[]byte, dataChan chan string, errChan chan error) {
	// 检测首条消息
	if strings.HasPrefix(string(*rawLine), "event: message-start") {
		h.startMsg = true
		return
	}
	// 如果rawLine 前缀不为data:，则直接返回
	if !strings.HasPrefix(string(*rawLine), "data: ") {
		*rawLine = nil
		return
	}

	*rawLine = (*rawLine)[6:]
	*rawLine = bytes.TrimSpace(*rawLine)

	// 如果等于 DONE 则结束
	if string(*rawLine) == "[DONE]" {
		errChan <- io.EOF
		*rawLine = requester.StreamClosed
		return
	}

	var cohereResponse ChatStreamResponse
	if h.startMsg {
		h.startMsg = false
		cohereResponse = ChatStreamResponse{
			Type:  "message-start",
			Index: 0,
			Delta: &ChatEventDelta{
				Message: &ChatEventDeltaMessage{
					Role: "assistant",
				},
			},
		}
	} else {
		err := json.Unmarshal(*rawLine, &cohereResponse)
		if err != nil {
			errChan <- common.ErrorToOpenAIError(err)
			return
		}
	}

	if cohereResponse.Type == "tool-call-end" || cohereResponse.Type == "citation-start" || cohereResponse.Type == "citation-end" {
		*rawLine = nil
		return
	}

	h.convertToOpenaiStream(&cohereResponse, dataChan)
}

func (h *CohereStreamHandler) convertToOpenaiStream(cohereResponse *ChatStreamResponse, dataChan chan string) {
	choice := types.ChatCompletionStreamChoice{
		Index: 0,
	}

	if h.msgID == "" && cohereResponse.Id != "" {
		h.msgID = cohereResponse.Id
	}

	if cohereResponse.Type == "message-end" {
		choice.FinishReason = convertFinishReason(cohereResponse.Delta.FinishReason)
		*h.Usage = usageHandle(cohereResponse.Delta.Usage.BilledUnits)
	} else {
		if cohereResponse.Delta == nil || cohereResponse.Delta.Message == nil {
			return
		}

		delta := cohereResponse.Delta

		choice.Delta = types.ChatCompletionStreamChoiceDelta{
			Role:    delta.Message.Role,
			Content: delta.Message.ToString(),
		}

		if delta.Message.ToolCalls != nil {
			delta.Message.ToolCalls.Index = cohereResponse.Index
			choice.Delta.ToolCalls = []*types.ChatCompletionToolCalls{delta.Message.ToolCalls}
		}

		h.Usage.CompletionTokens += common.CountTokenText(choice.Delta.Content, h.Request.Model)
		h.Usage.TotalTokens = h.Usage.PromptTokens + h.Usage.CompletionTokens
	}

	chatCompletion := types.ChatCompletionStreamResponse{
		ID:      h.msgID,
		Object:  "chat.completion.chunk",
		Created: utils.GetTimestamp(),
		Model:   h.Request.Model,
		Choices: []types.ChatCompletionStreamChoice{choice},
	}

	responseBody, _ := json.Marshal(chatCompletion)
	dataChan <- string(responseBody)
}

func usageHandle(token *UsageBilledUnits) types.Usage {
	usage := types.Usage{
		PromptTokens:     token.InputTokens,
		CompletionTokens: token.OutputTokens + token.SearchUnits + token.Classifications,
	}
	usage.TotalTokens = usage.PromptTokens + usage.CompletionTokens

	return usage
}
