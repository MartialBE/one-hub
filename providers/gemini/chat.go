package gemini

import (
	"encoding/json"
	"fmt"
	"net/http"
	"one-api/common"
	"one-api/common/requester"
	"one-api/common/utils"
	"one-api/providers/base"
	"one-api/types"
	"strings"
)

const (
	GeminiVisionMaxImageNum = 16
)

type GeminiStreamHandler struct {
	Usage          *types.Usage
	LastCandidates int
	LastType       string
	Request        *types.ChatCompletionRequest

	key string
}

type OpenAIStreamHandler struct {
	Usage     *types.Usage
	ModelName string
}

func (p *GeminiProvider) CreateChatCompletion(request *types.ChatCompletionRequest) (*types.ChatCompletionResponse, *types.OpenAIErrorWithStatusCode) {
	if p.UseOpenaiAPI {
		return p.OpenAIProvider.CreateChatCompletion(request)
	}

	geminiRequest, errWithCode := ConvertFromChatOpenai(request)
	if errWithCode != nil {
		return nil, errWithCode
	}

	req, errWithCode := p.getChatRequest(geminiRequest)
	if errWithCode != nil {
		return nil, errWithCode
	}
	defer req.Body.Close()

	geminiChatResponse := &GeminiChatResponse{}
	// 发送请求
	_, errWithCode = p.Requester.SendRequest(req, geminiChatResponse, false)
	if errWithCode != nil {
		return nil, errWithCode
	}

	return ConvertToChatOpenai(p, geminiChatResponse, request)
}

func (p *GeminiProvider) CreateChatCompletionStream(request *types.ChatCompletionRequest) (requester.StreamReaderInterface[string], *types.OpenAIErrorWithStatusCode) {

	channel := p.GetChannel()
	if p.UseOpenaiAPI {
		return p.OpenAIProvider.CreateChatCompletionStream(request)
	}

	geminiRequest, errWithCode := ConvertFromChatOpenai(request)
	if errWithCode != nil {
		return nil, errWithCode
	}

	req, errWithCode := p.getChatRequest(geminiRequest)
	if errWithCode != nil {
		return nil, errWithCode
	}
	defer req.Body.Close()

	// 发送请求
	resp, errWithCode := p.Requester.SendRequestRaw(req)
	if errWithCode != nil {
		return nil, errWithCode
	}

	chatHandler := &GeminiStreamHandler{
		Usage:          p.Usage,
		LastCandidates: 0,
		LastType:       "",
		Request:        request,

		key: channel.Key,
	}

	return requester.RequestStream[string](p.Requester, resp, chatHandler.HandlerStream)
}

func (p *GeminiProvider) getChatRequest(geminiRequest *GeminiChatRequest) (*http.Request, *types.OpenAIErrorWithStatusCode) {
	url := "generateContent"
	if geminiRequest.Stream {
		url = "streamGenerateContent?alt=sse"
	}
	// 获取请求地址
	fullRequestURL := p.GetFullRequestURL(url, geminiRequest.Model)

	// 获取请求头
	headers := p.GetRequestHeaders()
	if geminiRequest.Stream {
		headers["Accept"] = "text/event-stream"
	}

	p.pluginHandle(geminiRequest)

	// 创建请求
	req, err := p.Requester.NewRequest(http.MethodPost, fullRequestURL, p.Requester.WithBody(geminiRequest), p.Requester.WithHeader(headers))
	if err != nil {
		return nil, common.ErrorWrapper(err, "new_request_failed", http.StatusInternalServerError)
	}

	return req, nil
}

func ConvertFromChatOpenai(request *types.ChatCompletionRequest) (*GeminiChatRequest, *types.OpenAIErrorWithStatusCode) {
	request.ClearEmptyMessages()

	threshold := "BLOCK_NONE"

	// if strings.HasPrefix(request.Model, "gemini-2.0") && !strings.Contains(request.Model, "thinking") {
	// 	threshold = "OFF"
	// }

	geminiRequest := GeminiChatRequest{
		Contents: make([]GeminiChatContent, 0, len(request.Messages)),
		SafetySettings: []GeminiChatSafetySettings{
			{
				Category:  "HARM_CATEGORY_HARASSMENT",
				Threshold: threshold,
			},
			{
				Category:  "HARM_CATEGORY_HATE_SPEECH",
				Threshold: threshold,
			},
			{
				Category:  "HARM_CATEGORY_SEXUALLY_EXPLICIT",
				Threshold: threshold,
			},
			{
				Category:  "HARM_CATEGORY_DANGEROUS_CONTENT",
				Threshold: threshold,
			},
			{
				Category:  "HARM_CATEGORY_CIVIC_INTEGRITY",
				Threshold: threshold,
			},
		},
		GenerationConfig: GeminiChatGenerationConfig{
			Temperature:     request.Temperature,
			TopP:            request.TopP,
			MaxOutputTokens: request.MaxTokens,
		},
	}

	functions := request.GetFunctions()

	if functions != nil {
		var geminiChatTools GeminiChatTools
		googleSearch := false
		codeExecution := false
		for _, function := range functions {
			if function.Name == "googleSearch" {
				googleSearch = true
				continue
			}
			if function.Name == "codeExecution" {
				codeExecution = true
				continue
			}

			if params, ok := function.Parameters.(map[string]interface{}); ok {
				if properties, ok := params["properties"].(map[string]interface{}); ok && len(properties) == 0 {
					function.Parameters = nil
				}
			}

			geminiChatTools.FunctionDeclarations = append(geminiChatTools.FunctionDeclarations, *function)
		}

		if googleSearch && len(geminiRequest.Tools) == 0 {
			geminiRequest.Tools = append(geminiRequest.Tools, GeminiChatTools{
				GoogleSearch: &GeminiCodeExecution{},
			})
		}
		if codeExecution && len(geminiRequest.Tools) == 0 {
			geminiRequest.Tools = append(geminiRequest.Tools, GeminiChatTools{
				CodeExecution: &GeminiCodeExecution{},
			})
		}

		if len(geminiRequest.Tools) == 0 {
			geminiRequest.Tools = append(geminiRequest.Tools, geminiChatTools)
		}
	}

	geminiContent, systemContent, err := OpenAIToGeminiChatContent(request.Messages)
	if err != nil {
		return nil, err
	}

	if systemContent != "" {
		geminiRequest.SystemInstruction = &GeminiChatContent{
			Parts: []GeminiPart{
				{Text: systemContent},
			},
		}
	}

	geminiRequest.Contents = geminiContent
	geminiRequest.Stream = request.Stream
	geminiRequest.Model = request.Model

	if request.ResponseFormat != nil && (request.ResponseFormat.Type == "json_schema" || request.ResponseFormat.Type == "json_object") {
		geminiRequest.GenerationConfig.ResponseMimeType = "application/json"

		if request.ResponseFormat.JsonSchema != nil && request.ResponseFormat.JsonSchema.Schema != nil {
			cleanedSchema := removeAdditionalPropertiesWithDepth(request.ResponseFormat.JsonSchema.Schema, 0)
			geminiRequest.GenerationConfig.ResponseSchema = cleanedSchema
		}
	}

	return &geminiRequest, nil
}

func removeAdditionalPropertiesWithDepth(schema interface{}, depth int) interface{} {
	if depth >= 5 {
		return schema
	}

	v, ok := schema.(map[string]interface{})
	if !ok || len(v) == 0 {
		return schema
	}

	// 如果type不为object和array，则直接返回
	if typeVal, exists := v["type"]; !exists || (typeVal != "object" && typeVal != "array") {
		return schema
	}

	delete(v, "title")

	switch v["type"] {
	case "object":
		delete(v, "additionalProperties")
		// 处理 properties
		if properties, ok := v["properties"].(map[string]interface{}); ok {
			for key, value := range properties {
				properties[key] = removeAdditionalPropertiesWithDepth(value, depth+1)
			}
		}
		for _, field := range []string{"allOf", "anyOf", "oneOf"} {
			if nested, ok := v[field].([]interface{}); ok {
				for i, item := range nested {
					nested[i] = removeAdditionalPropertiesWithDepth(item, depth+1)
				}
			}
		}
	case "array":
		if items, ok := v["items"].(map[string]interface{}); ok {
			v["items"] = removeAdditionalPropertiesWithDepth(items, depth+1)
		}
	}

	return v
}

func ConvertToChatOpenai(provider base.ProviderInterface, response *GeminiChatResponse, request *types.ChatCompletionRequest) (openaiResponse *types.ChatCompletionResponse, errWithCode *types.OpenAIErrorWithStatusCode) {
	openaiResponse = &types.ChatCompletionResponse{
		ID:      fmt.Sprintf("chatcmpl-%s", utils.GetUUID()),
		Object:  "chat.completion",
		Created: utils.GetTimestamp(),
		Model:   request.Model,
		Choices: make([]types.ChatCompletionChoice, 0, len(response.Candidates)),
	}

	if len(response.Candidates) == 0 {
		errWithCode = common.StringErrorWrapper("no candidates", "no_candidates", http.StatusInternalServerError)
		return
	}

	for _, candidate := range response.Candidates {
		openaiResponse.Choices = append(openaiResponse.Choices, candidate.ToOpenAIChoice(request))
	}

	usage := provider.GetUsage()
	*usage = convertOpenAIUsage(request.Model, response.UsageMetadata)
	openaiResponse.Usage = usage

	return
}

// 转换为OpenAI聊天流式请求体
func (h *GeminiStreamHandler) HandlerStream(rawLine *[]byte, dataChan chan string, errChan chan error) {
	// 如果rawLine 前缀不为data:，则直接返回
	if !strings.HasPrefix(string(*rawLine), "data: ") {
		*rawLine = nil
		return
	}

	// 去除前缀
	*rawLine = (*rawLine)[6:]

	var geminiResponse GeminiChatResponse
	err := json.Unmarshal(*rawLine, &geminiResponse)
	if err != nil {
		errChan <- common.ErrorToOpenAIError(err)
		return
	}

	aiError := errorHandle(&geminiResponse.GeminiErrorResponse, h.key)
	if aiError != nil {
		errChan <- aiError
		return
	}

	h.convertToOpenaiStream(&geminiResponse, dataChan)

}

func (h *GeminiStreamHandler) convertToOpenaiStream(geminiResponse *GeminiChatResponse, dataChan chan string) {
	streamResponse := types.ChatCompletionStreamResponse{
		ID:      fmt.Sprintf("chatcmpl-%s", utils.GetUUID()),
		Object:  "chat.completion.chunk",
		Created: utils.GetTimestamp(),
		Model:   h.Request.Model,
		// Choices: choices,
	}

	choices := make([]types.ChatCompletionStreamChoice, 0, len(geminiResponse.Candidates))

	isStop := false
	for _, candidate := range geminiResponse.Candidates {
		if candidate.FinishReason != nil && *candidate.FinishReason == "STOP" {
			isStop = true
			candidate.FinishReason = nil
		}
		choices = append(choices, candidate.ToOpenAIStreamChoice(h.Request))
	}

	if len(choices) > 0 && (choices[0].Delta.ToolCalls != nil || choices[0].Delta.FunctionCall != nil) {
		choices := choices[0].ConvertOpenaiStream()
		for _, choice := range choices {
			chatCompletionCopy := streamResponse
			chatCompletionCopy.Choices = []types.ChatCompletionStreamChoice{choice}
			responseBody, _ := json.Marshal(chatCompletionCopy)
			dataChan <- string(responseBody)
		}
	} else {
		streamResponse.Choices = choices
		responseBody, _ := json.Marshal(streamResponse)
		dataChan <- string(responseBody)
	}

	if isStop {
		streamResponse.Choices = []types.ChatCompletionStreamChoice{
			{
				FinishReason: types.FinishReasonStop,
				Delta: types.ChatCompletionStreamChoiceDelta{
					Role: types.ChatMessageRoleAssistant,
				},
			},
		}
		responseBody, _ := json.Marshal(streamResponse)
		dataChan <- string(responseBody)
	}

	// 和ExecutableCode的tokens共用，所以跳过
	if geminiResponse.UsageMetadata == nil || len(geminiResponse.Candidates) == 0 || geminiResponse.Candidates[0].Content.Parts[0].CodeExecutionResult != nil {
		return
	}

	lastType := "text"
	if geminiResponse.Candidates[0].Content.Parts[0].ExecutableCode != nil {
		lastType = "code"
	}

	if h.LastType != lastType {
		h.LastCandidates = 0
		h.LastType = lastType
	}

	adjustTokenCounts(h.Request.Model, geminiResponse.UsageMetadata)

	h.Usage.PromptTokens = geminiResponse.UsageMetadata.PromptTokenCount
	h.Usage.CompletionTokens += geminiResponse.UsageMetadata.CandidatesTokenCount - h.LastCandidates
	h.Usage.TotalTokens = h.Usage.PromptTokens + h.Usage.CompletionTokens
	h.LastCandidates = geminiResponse.UsageMetadata.CandidatesTokenCount
}

const tokenThreshold = 1000000

var modelAdjustRatios = map[string]int{
	"gemini-1.5-pro":   2,
	"gemini-1.5-flash": 2,
}

func adjustTokenCounts(modelName string, usage *GeminiUsageMetadata) {
	if usage.PromptTokenCount <= tokenThreshold && usage.CandidatesTokenCount <= tokenThreshold {
		return
	}

	currentRatio := 1
	for model, r := range modelAdjustRatios {
		if strings.HasPrefix(modelName, model) {
			currentRatio = r
			break
		}
	}

	if currentRatio == 1 {
		return
	}

	adjustTokenCount := func(count int) int {
		if count > tokenThreshold {
			return tokenThreshold + (count-tokenThreshold)*currentRatio
		}
		return count
	}

	if usage.PromptTokenCount > tokenThreshold {
		usage.PromptTokenCount = adjustTokenCount(usage.PromptTokenCount)
	}

	if usage.CandidatesTokenCount > tokenThreshold {
		usage.CandidatesTokenCount = adjustTokenCount(usage.CandidatesTokenCount)
	}

	usage.TotalTokenCount = usage.PromptTokenCount + usage.CandidatesTokenCount
}

func convertOpenAIUsage(modelName string, geminiUsage *GeminiUsageMetadata) types.Usage {
	adjustTokenCounts(modelName, geminiUsage)

	return types.Usage{
		PromptTokens:     geminiUsage.PromptTokenCount,
		CompletionTokens: geminiUsage.CandidatesTokenCount,
		TotalTokens:      geminiUsage.TotalTokenCount,
	}
}

func (p *GeminiProvider) pluginHandle(request *GeminiChatRequest) {
	if !p.UseCodeExecution {
		return
	}

	if len(request.Tools) > 0 {
		return
	}

	if p.Channel.Plugin == nil {
		return
	}

	request.Tools = append(request.Tools, GeminiChatTools{
		CodeExecution: &GeminiCodeExecution{},
	})

}
