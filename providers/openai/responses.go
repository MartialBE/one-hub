package openai

import (
	"bytes"
	"encoding/json"
	"one-api/common"
	"one-api/common/config"
	"one-api/common/requester"
	"one-api/common/utils"
	"one-api/types"
	"strings"
)

type OpenAIResponsesStreamHandler struct {
	Usage     *types.Usage
	Prefix    string
	Model     string
	MessageID string

	searchType string
	toolIndex  int
}

func (p *OpenAIProvider) CreateResponses(request *types.OpenAIResponsesRequest) (openaiResponse *types.OpenAIResponsesResponses, errWithCode *types.OpenAIErrorWithStatusCode) {
	req, errWithCode := p.GetRequestTextBody(config.RelayModeResponses, request.Model, request)
	if errWithCode != nil {
		return nil, errWithCode
	}
	defer req.Body.Close()

	response := &types.OpenAIResponsesResponses{}
	// 发送请求
	_, errWithCode = p.Requester.SendRequest(req, response, false)
	if errWithCode != nil {
		return nil, errWithCode
	}

	if response.Usage == nil || response.Usage.OutputTokens == 0 {
		response.Usage = &types.ResponsesUsage{
			InputTokens:  p.Usage.PromptTokens,
			OutputTokens: 0,
			TotalTokens:  0,
		}
		// // 那么需要计算
		response.Usage.OutputTokens = common.CountTokenText(response.GetContent(), request.Model)
		response.Usage.TotalTokens = response.Usage.InputTokens + response.Usage.OutputTokens
	}

	*p.Usage = *response.Usage.ToOpenAIUsage()

	getResponsesExtraBilling(response, p.Usage)

	return response, nil
}

func (p *OpenAIProvider) CreateResponsesStream(request *types.OpenAIResponsesRequest) (requester.StreamReaderInterface[string], *types.OpenAIErrorWithStatusCode) {
	req, errWithCode := p.GetRequestTextBody(config.RelayModeResponses, request.Model, request)
	if errWithCode != nil {
		return nil, errWithCode
	}
	defer req.Body.Close()

	// 发送请求
	resp, errWithCode := p.Requester.SendRequestRaw(req)
	if errWithCode != nil {
		return nil, errWithCode
	}

	chatHandler := OpenAIResponsesStreamHandler{
		Usage:  p.Usage,
		Prefix: `data: `,
		Model:  request.Model,
	}

	if request.ConvertChat {
		return requester.RequestStream(p.Requester, resp, chatHandler.HandlerChatStream)
	}

	return requester.RequestNoTrimStream(p.Requester, resp, chatHandler.HandlerResponsesStream)
}

func (h *OpenAIResponsesStreamHandler) HandlerResponsesStream(rawLine *[]byte, dataChan chan string, errChan chan error) {
	rawStr := string(*rawLine)

	// 如果rawLine 前缀不为data:，则直接返回
	if !strings.HasPrefix(rawStr, h.Prefix) {
		dataChan <- rawStr
		return
	}

	noSpaceLine := bytes.TrimSpace(*rawLine)
	if strings.HasPrefix(string(noSpaceLine), "data: ") {
		// 去除前缀
		noSpaceLine = noSpaceLine[6:]
	}

	var openaiResponse types.OpenAIResponsesStreamResponses
	err := json.Unmarshal(noSpaceLine, &openaiResponse)
	if err != nil {
		errChan <- common.ErrorToOpenAIError(err)
		return
	}

	switch openaiResponse.Type {
	case "response.created":
		if len(openaiResponse.Response.Tools) > 0 {
			for _, tool := range openaiResponse.Response.Tools {
				if tool.Type == types.APITollTypeWebSearchPreview {
					h.searchType = "medium"
					if tool.SearchContextSize != "" {
						h.searchType = tool.SearchContextSize
					}
				}
			}
		}
	case "response.output_text.delta":
		delta, ok := openaiResponse.Delta.(string)
		if ok {
			h.Usage.TextBuilder.WriteString(delta)
		}
	case "response.output_item.added":
		if openaiResponse.Item != nil {
			switch openaiResponse.Item.Type {
			case types.InputTypeWebSearchCall:
				if h.searchType == "" {
					h.searchType = "medium"
				}
				h.Usage.IncExtraBilling(types.APITollTypeWebSearchPreview, h.searchType)
			case types.InputTypeCodeInterpreterCall:
				h.Usage.IncExtraBilling(types.APITollTypeCodeInterpreter, "")
			case types.InputTypeFileSearchCall:
				h.Usage.IncExtraBilling(types.APITollTypeFileSearch, "")
			}
		}
	default:
		if openaiResponse.Response != nil && openaiResponse.Response.Usage != nil {
			usage := openaiResponse.Response.Usage
			*h.Usage = *usage.ToOpenAIUsage()
			getResponsesExtraBilling(openaiResponse.Response, h.Usage)

		}
	}

	dataChan <- rawStr
}

func (h *OpenAIResponsesStreamHandler) HandlerChatStream(rawLine *[]byte, dataChan chan string, errChan chan error) {
	// 如果rawLine 前缀不为data:，则直接返回
	if !strings.HasPrefix(string(*rawLine), h.Prefix) {
		*rawLine = nil
		return
	}

	// 去除前缀
	*rawLine = (*rawLine)[6:]

	var openaiResponse types.OpenAIResponsesStreamResponses
	err := json.Unmarshal(*rawLine, &openaiResponse)
	if err != nil {
		errChan <- common.ErrorToOpenAIError(err)
		return
	}

	chatRes := types.ChatCompletionStreamResponse{
		ID:      h.MessageID,
		Object:  "chat.completion.chunk",
		Created: utils.GetTimestamp(),
		Model:   h.Model,
		Choices: make([]types.ChatCompletionStreamChoice, 0),
	}
	needOutput := false

	switch openaiResponse.Type {
	case "response.created":
		if openaiResponse.Response != nil {
			if h.MessageID == "" {
				h.MessageID = openaiResponse.Response.ID
				chatRes.ID = h.MessageID
			}
		}
		if len(openaiResponse.Response.Tools) > 0 {
			for _, tool := range openaiResponse.Response.Tools {
				if tool.Type == types.APITollTypeWebSearchPreview {
					h.searchType = "medium"
					if tool.SearchContextSize != "" {
						h.searchType = tool.SearchContextSize
					}
				}
			}
		}
		chatRes.Choices = append(chatRes.Choices, types.ChatCompletionStreamChoice{
			Index: 0,
			Delta: types.ChatCompletionStreamChoiceDelta{},
		})
		needOutput = true
	case "response.output_text.delta": // 处理文本输出的增量
		delta, ok := openaiResponse.Delta.(string)
		if ok {
			h.Usage.TextBuilder.WriteString(delta)
		}
		chatRes.Choices = append(chatRes.Choices, types.ChatCompletionStreamChoice{
			Index: 0,
			Delta: types.ChatCompletionStreamChoiceDelta{
				Content: delta,
			},
		})
		needOutput = true
	case "response.reasoning_summary_text.delta": // 处理文本输出的增量
		delta, ok := openaiResponse.Delta.(string)
		if ok {
			h.Usage.TextBuilder.WriteString(delta)
		}
		chatRes.Choices = append(chatRes.Choices, types.ChatCompletionStreamChoice{
			Index: 0,
			Delta: types.ChatCompletionStreamChoiceDelta{
				ReasoningContent: delta,
			},
		})
		needOutput = true
	case "response.function_call_arguments.delta": // 处理函数调用参数的增量
		delta, ok := openaiResponse.Delta.(string)
		if ok {
			h.Usage.TextBuilder.WriteString(delta)
		}
		chatRes.Choices = append(chatRes.Choices, types.ChatCompletionStreamChoice{
			Index: 0,
			Delta: types.ChatCompletionStreamChoiceDelta{
				Role: types.ChatMessageRoleAssistant,
				ToolCalls: []*types.ChatCompletionToolCalls{
					{
						Index: h.toolIndex,
						Function: &types.ChatCompletionToolCallsFunction{
							Arguments: delta,
						},
					},
				},
			},
		})
		needOutput = true
	case "response.function_call_arguments.done":
		h.toolIndex++
	case "response.output_item.added":
		if openaiResponse.Item != nil {
			switch openaiResponse.Item.Type {
			case types.InputTypeWebSearchCall:
				if h.searchType == "" {
					h.searchType = "medium"
				}
				h.Usage.IncExtraBilling(types.APITollTypeWebSearchPreview, h.searchType)
			case types.InputTypeCodeInterpreterCall:
				h.Usage.IncExtraBilling(types.APITollTypeCodeInterpreter, "")
			case types.InputTypeFileSearchCall:
				h.Usage.IncExtraBilling(types.APITollTypeFileSearch, "")

			case types.InputTypeMessage, types.InputTypeReasoning:
				chatRes.Choices = append(chatRes.Choices, types.ChatCompletionStreamChoice{
					Index: 0,
					Delta: types.ChatCompletionStreamChoiceDelta{
						Role:    types.ChatMessageRoleAssistant,
						Content: "",
					},
				})
				needOutput = true
			case types.InputTypeFunctionCall:
				arguments := ""
				if openaiResponse.Item.Arguments != nil {
					arguments = *openaiResponse.Item.Arguments
				}

				chatRes.Choices = append(chatRes.Choices, types.ChatCompletionStreamChoice{
					Index: 0,
					Delta: types.ChatCompletionStreamChoiceDelta{
						Role: types.ChatMessageRoleAssistant,
						ToolCalls: []*types.ChatCompletionToolCalls{
							{
								Index: h.toolIndex,
								Id:    openaiResponse.Item.CallID,
								Type:  "function",
								Function: &types.ChatCompletionToolCallsFunction{
									Name:      openaiResponse.Item.Name,
									Arguments: arguments,
								},
							},
						},
					},
				})
				needOutput = true
			}
		}
	default:
		if openaiResponse.Response != nil && openaiResponse.Response.Usage != nil {
			usage := openaiResponse.Response.Usage
			*h.Usage = *usage.ToOpenAIUsage()

			getResponsesExtraBilling(openaiResponse.Response, h.Usage)
			chatRes.Choices = append(chatRes.Choices, types.ChatCompletionStreamChoice{
				Index:        0,
				Delta:        types.ChatCompletionStreamChoiceDelta{},
				FinishReason: types.ConvertResponsesStatusToChat(openaiResponse.Response.Status),
			})
			needOutput = true

		}
	}

	if needOutput {
		jsonData, err := json.Marshal(chatRes)
		if err != nil {
			errChan <- common.ErrorToOpenAIError(err)
			return
		}
		dataChan <- string(jsonData)

		return
	}

	*rawLine = nil
}

func getResponsesExtraBilling(response *types.OpenAIResponsesResponses, usage *types.Usage) {
	if usage == nil {
		return
	}

	searchType := "medium"
	if len(response.Tools) > 0 {
		for _, tool := range response.Tools {
			if tool.Type == types.APITollTypeWebSearchPreview {
				if tool.SearchContextSize != "" {
					searchType = tool.SearchContextSize
				}
			}
		}
	}
	if len(response.Output) > 0 {
		for _, output := range response.Output {
			switch output.Type {
			case types.InputTypeWebSearchCall:
				usage.IncExtraBilling(types.APITollTypeWebSearchPreview, searchType)
			case types.InputTypeCodeInterpreterCall:
				usage.IncExtraBilling(types.APITollTypeCodeInterpreter, "")
			case types.InputTypeFileSearchCall:
				usage.IncExtraBilling(types.APITollTypeFileSearch, "")
			}
		}
	}
}
