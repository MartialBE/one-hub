package replicate

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"one-api/common"
	"one-api/common/config"
	"one-api/common/requester"
	"one-api/common/utils"
	"one-api/types"
	"strings"
)

type ReplicateStreamHandler struct {
	Usage     *types.Usage
	ModelName string
	ID        string
	Provider  *ReplicateProvider
}

func (p *ReplicateProvider) CreateChatCompletion(request *types.ChatCompletionRequest) (response *types.ChatCompletionResponse, errWithCode *types.OpenAIErrorWithStatusCode) {
	url, errWithCode := p.GetSupportedAPIUri(config.RelayModeChatCompletions)
	if errWithCode != nil {
		return nil, errWithCode
	}

	// 获取请求地址
	fullRequestURL := p.GetFullRequestURL(url, request.Model)
	if fullRequestURL == "" {
		return nil, common.ErrorWrapper(nil, "invalid_recraft_config", http.StatusInternalServerError)
	}

	// 获取请求头
	headers := p.GetRequestHeaders()

	replicateRequest := convertFromChatOpenai(request)
	req, err := p.Requester.NewRequest(http.MethodPost, fullRequestURL, p.Requester.WithBody(replicateRequest), p.Requester.WithHeader(headers))

	if err != nil {
		return nil, common.ErrorWrapper(err, "new_request_failed", http.StatusInternalServerError)
	}

	replicateResponse := &ReplicateResponse[[]string]{}

	// 发送请求
	_, errWithCode = p.Requester.SendRequest(req, replicateResponse, false)
	if errWithCode != nil {
		return nil, errWithCode
	}

	replicateResponse = getPrediction(p, replicateResponse)

	return p.convertToChatOpenai(replicateResponse)
}

func convertFromChatOpenai(request *types.ChatCompletionRequest) *ReplicateRequest[ReplicateChatRequest] {

	systemPrompt := ""
	prompt := ""

	if request.MaxTokens == 0 && request.MaxCompletionTokens > 0 {
		request.MaxTokens = request.MaxCompletionTokens
	}

	for _, msg := range request.Messages {
		if msg.Role == "system" {
			systemPrompt += msg.StringContent() + "\n"
			continue
		}

		prompt += msg.Role + ": \n"
		openaiContent := msg.ParseContent()
		for _, content := range openaiContent {
			if content.Type != types.ContentTypeText {
				continue
			}
			prompt += content.Text
		}
		prompt += "\n"
	}

	prompt += "assistant: \n"

	return &ReplicateRequest[ReplicateChatRequest]{
		Stream: request.Stream,
		Input: ReplicateChatRequest{
			TopP:             request.TopP,
			MaxTokens:        request.MaxTokens,
			MinTokens:        0,
			Temperature:      request.Temperature,
			SystemPrompt:     systemPrompt,
			Prompt:           prompt,
			PresencePenalty:  request.PresencePenalty,
			FrequencyPenalty: request.FrequencyPenalty,
		},
	}
}

func (p *ReplicateProvider) convertToChatOpenai(response *ReplicateResponse[[]string]) (*types.ChatCompletionResponse, *types.OpenAIErrorWithStatusCode) {

	responseText := ""
	if response.Output != nil {
		for _, text := range response.Output {
			responseText += text
		}
	}

	choice := types.ChatCompletionChoice{
		Index: 0,
		Message: types.ChatCompletionMessage{
			Role:    types.ChatMessageRoleAssistant,
			Content: responseText,
		},
		FinishReason: types.FinishReasonStop,
	}

	openaiResponse := &types.ChatCompletionResponse{
		ID:      fmt.Sprintf("chatcmpl-%s", utils.GetUUID()),
		Object:  "chat.completion",
		Created: utils.GetTimestamp(),
		Choices: []types.ChatCompletionChoice{choice},
		Model:   response.Model,
		Usage: &types.Usage{
			CompletionTokens: 0,
			PromptTokens:     0,
			TotalTokens:      0,
		},
	}

	p.Usage.PromptTokens = response.Metrics.InputTokenCount
	p.Usage.CompletionTokens = response.Metrics.OutputTokenCount
	p.Usage.TotalTokens = p.Usage.PromptTokens + p.Usage.CompletionTokens
	openaiResponse.Usage = p.Usage

	return openaiResponse, nil
}

func (p *ReplicateProvider) CreateChatCompletionStream(request *types.ChatCompletionRequest) (requester.StreamReaderInterface[string], *types.OpenAIErrorWithStatusCode) {
	url, errWithCode := p.GetSupportedAPIUri(config.RelayModeChatCompletions)
	if errWithCode != nil {
		return nil, errWithCode
	}

	// 获取请求地址
	fullRequestURL := p.GetFullRequestURL(url, request.Model)
	if fullRequestURL == "" {
		return nil, common.ErrorWrapper(nil, "invalid_recraft_config", http.StatusInternalServerError)
	}

	// 获取请求头
	headers := p.GetRequestHeaders()

	replicateRequest := convertFromChatOpenai(request)
	req, err := p.Requester.NewRequest(http.MethodPost, fullRequestURL, p.Requester.WithBody(replicateRequest), p.Requester.WithHeader(headers))

	if err != nil {
		return nil, common.ErrorWrapper(err, "new_request_failed", http.StatusInternalServerError)
	}

	replicateResponse := &ReplicateResponse[[]string]{}

	// 发送请求
	_, errWithCode = p.Requester.SendRequest(req, replicateResponse, false)
	if errWithCode != nil {
		return nil, errWithCode
	}

	headers["Accept"] = "text/event-stream"
	req, err = p.Requester.NewRequest(http.MethodGet, replicateResponse.Urls.Stream, p.Requester.WithHeader(headers))

	if err != nil {
		return nil, common.ErrorWrapper(err, "new_request_failed", http.StatusInternalServerError)
	}

	// 发送请求
	resp, errWithCode := p.Requester.SendRequestRaw(req)
	if errWithCode != nil {
		return nil, errWithCode
	}

	chatHandler := ReplicateStreamHandler{
		Usage:     p.Usage,
		ModelName: request.Model,
		ID:        replicateResponse.ID,
		Provider:  p,
	}

	return requester.RequestStream(p.Requester, resp, chatHandler.HandlerChatStream)
}

func (h *ReplicateStreamHandler) HandlerChatStream(rawLine *[]byte, dataChan chan string, errChan chan error) {
	if strings.HasPrefix(string(*rawLine), "event: done") {

		// 获取用量
		replicateResponse := getPredictionResponse[[]string](h.Provider, h.ID)

		h.Usage.PromptTokens = replicateResponse.Metrics.InputTokenCount
		h.Usage.CompletionTokens = replicateResponse.Metrics.OutputTokenCount
		h.Usage.TotalTokens = h.Usage.PromptTokens + h.Usage.CompletionTokens

		// 需要有一个stop
		choice := types.ChatCompletionStreamChoice{
			Index: 0,
			Delta: types.ChatCompletionStreamChoiceDelta{
				Role: types.ChatMessageRoleAssistant,
			},
			FinishReason: types.FinishReasonStop,
		}

		dataChan <- getStreamResponse(choice, h.ModelName)

		errChan <- io.EOF
		*rawLine = requester.StreamClosed

		return
	}

	// 如果rawLine 前缀不为data:，则直接返回
	if !strings.HasPrefix(string(*rawLine), "data: ") {
		*rawLine = nil
		return
	}

	// 去除前缀
	*rawLine = (*rawLine)[6:]

	choice := types.ChatCompletionStreamChoice{
		Index: 0,
		Delta: types.ChatCompletionStreamChoiceDelta{
			Role:    types.ChatMessageRoleAssistant,
			Content: string(*rawLine),
		},
	}

	dataChan <- getStreamResponse(choice, h.ModelName)
}

func getStreamResponse(choice types.ChatCompletionStreamChoice, modelName string) string {
	chatCompletion := types.ChatCompletionStreamResponse{
		ID:      fmt.Sprintf("chatcmpl-%s", utils.GetUUID()),
		Object:  "chat.completion.chunk",
		Created: utils.GetTimestamp(),
		Model:   modelName,
		Choices: []types.ChatCompletionStreamChoice{choice},
	}

	responseBody, _ := json.Marshal(chatCompletion)

	return string(responseBody)
}
