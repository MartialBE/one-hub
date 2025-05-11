package openrouter

import (
	"encoding/json"
	"net/http"
	"one-api/common"
	"one-api/common/config"
	"one-api/common/image"
	"one-api/common/requester"
	"one-api/providers/openai"
	"one-api/types"
	"strings"
)

func (p *OpenRouterProvider) CreateChatCompletion(request *types.ChatCompletionRequest) (openaiResponse *types.ChatCompletionResponse, errWithCode *types.OpenAIErrorWithStatusCode) {
	orRequest := &ChatCompletionRequest{
		ChatCompletionRequest: *request,
	}

	modelProvider := strings.Split(request.Model, "/")[0]

	p.ConvertFromChatOpenai(orRequest, modelProvider)

	req, errWithCode := p.GetRequestTextBody(config.RelayModeChatCompletions, request.Model, orRequest)
	if errWithCode != nil {
		return nil, errWithCode
	}
	defer req.Body.Close()

	response := &openai.OpenAIProviderChatResponse{}
	// 发送请求
	_, errWithCode = p.Requester.SendRequest(req, response, false)
	if errWithCode != nil {
		return nil, errWithCode
	}

	// 检测是否错误
	openaiErr := openai.ErrorHandle(&response.OpenAIErrorResponse)
	if openaiErr != nil {
		errWithCode = &types.OpenAIErrorWithStatusCode{
			OpenAIError: *openaiErr,
			StatusCode:  http.StatusBadRequest,
		}
		return nil, errWithCode
	}

	if response.Usage == nil || response.Usage.CompletionTokens == 0 {
		response.Usage = &types.Usage{
			PromptTokens:     p.Usage.PromptTokens,
			CompletionTokens: 0,
			TotalTokens:      0,
		}
		// 那么需要计算
		response.Usage.CompletionTokens = common.CountTokenText(response.GetContent(), request.Model)
		response.Usage.TotalTokens = response.Usage.PromptTokens + response.Usage.CompletionTokens
	}

	*p.Usage = *response.Usage

	for index, choices := range response.Choices {
		if choices.Message.ReasoningContent == "" && choices.Message.Reasoning != "" {
			response.Choices[index].Message.ReasoningContent = choices.Message.Reasoning
			response.Choices[index].Message.Reasoning = ""
		}
	}

	return &response.ChatCompletionResponse, nil
}

func (p *OpenRouterProvider) CreateChatCompletionStream(request *types.ChatCompletionRequest) (requester.StreamReaderInterface[string], *types.OpenAIErrorWithStatusCode) {
	orRequest := &ChatCompletionRequest{
		ChatCompletionRequest: *request,
	}

	modelProvider := strings.Split(request.Model, "/")[0]
	p.ConvertFromChatOpenai(orRequest, modelProvider)

	streamOptions := orRequest.StreamOptions
	// 如果支持流式返回Usage 则需要更改配置：
	orRequest.StreamOptions = &types.StreamOptions{
		IncludeUsage: true,
	}

	req, errWithCode := p.GetRequestTextBody(config.RelayModeChatCompletions, orRequest.Model, orRequest)
	if errWithCode != nil {
		return nil, errWithCode
	}
	defer req.Body.Close()

	// 恢复原来的配置
	orRequest.StreamOptions = streamOptions

	// 发送请求
	resp, errWithCode := p.Requester.SendRequestRaw(req)
	if errWithCode != nil {
		return nil, errWithCode
	}

	chatHandler := openai.OpenAIStreamHandler{
		Usage:      p.Usage,
		ModelName:  request.Model,
		EscapeJSON: p.StreamEscapeJSON,

		ReasoningHandler: p.ReasoningHandler,
	}

	return requester.RequestStream(p.Requester, resp, chatHandler.HandlerChatStream)
}

func (p *OpenRouterProvider) ConvertFromChatOpenai(request *ChatCompletionRequest, modelProvider string) {
	if p.Channel.Plugin != nil {
		plugin := p.Channel.Plugin.Data()
		if pOther, ok := plugin["other"]; ok {
			if provider, ok := pOther["provider"].(string); ok && provider != "" {
				var orProvider map[string]orProvider
				err := json.Unmarshal([]byte(provider), &orProvider)
				if err == nil {
					if _, ok := orProvider[modelProvider]; ok {
						request.Provider = orProvider[modelProvider]
					}
				}
			}
		}
	}

	for indexM, message := range request.Messages {
		openaiContent := message.ParseContent()
		needConvert := false
		for indexP, part := range openaiContent {
			if part.Type == types.ContentTypeImageURL {
				mimeType, data, err := image.GetImageFromUrl(part.ImageURL.URL)
				if err != nil {
					continue
				}

				if mimeType == "application/pdf" {
					openaiContent[indexP] = types.ChatMessagePart{
						Type: "file",
						File: &types.ChatMessageFile{
							FileData: "data:application/pdf;base64," + data,
						},
					}
					needConvert = true
				}
			}
		}
		if needConvert {
			request.Messages[indexM].Content = openaiContent
		}
	}
}
