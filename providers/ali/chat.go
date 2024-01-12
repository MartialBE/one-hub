package ali

import (
	"encoding/json"
	"net/http"
	"one-api/common"
	"one-api/common/requester"
	"one-api/providers/base"
	"one-api/types"
	"strings"
)

type aliChatHandler struct {
	base.BaseHandler
	Request            *types.ChatCompletionRequest
	lastStreamResponse string
}

const AliEnableSearchModelSuffix = "-internet"

func (p *AliProvider) initChat(request *types.ChatCompletionRequest) (chatHandler *aliChatHandler, resp *http.Response, errWithCode *types.OpenAIErrorWithStatusCode) {
	chatHandler = &aliChatHandler{
		BaseHandler: base.BaseHandler{
			Usage: p.Usage,
		},
		Request: request,
	}
	resp, errWithCode = chatHandler.getResponse(p)

	return
}

func (p *AliProvider) CreateChatCompletion(request *types.ChatCompletionRequest) (openaiResponse *types.ChatCompletionResponse, errWithCode *types.OpenAIErrorWithStatusCode) {
	chatHandler, resp, errWithCode := p.initChat(request)
	if errWithCode != nil {
		return
	}

	defer resp.Body.Close()

	aliResponse := &AliChatResponse{}
	err := json.NewDecoder(resp.Body).Decode(aliResponse)
	if err != nil {
		errWithCode = common.ErrorWrapper(err, "decode_response_body_failed", http.StatusInternalServerError)
		return
	}

	return chatHandler.convertToOpenai(aliResponse)
}

func (p *AliProvider) CreateChatCompletionStream(request *types.ChatCompletionRequest) (stream requester.StreamReaderInterface[types.ChatCompletionStreamResponse], errWithCode *types.OpenAIErrorWithStatusCode) {
	chatHandler, resp, errWithCode := p.initChat(request)
	if errWithCode != nil {
		return
	}

	return requester.RequestStream[types.ChatCompletionStreamResponse](p.Requester, resp, chatHandler.handlerStream)
}

func (h *aliChatHandler) getResponse(p *AliProvider) (*http.Response, *types.OpenAIErrorWithStatusCode) {
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
		headers["X-DashScope-SSE"] = "enable"
	}

	aliChatRequest := h.convertFromOpenai()

	// 发送请求
	return p.SendJsonRequest(http.MethodPost, fullRequestURL, aliChatRequest, headers)
}

// 阿里云聊天请求体
func (h *aliChatHandler) convertFromOpenai() *AliChatRequest {
	messages := make([]AliMessage, 0, len(h.Request.Messages))
	for i := 0; i < len(h.Request.Messages); i++ {
		message := h.Request.Messages[i]
		if h.Request.Model != "qwen-vl-plus" {
			messages = append(messages, AliMessage{
				Content: message.StringContent(),
				Role:    strings.ToLower(message.Role),
			})
		} else {
			openaiContent := message.ParseContent()
			var parts []AliMessagePart
			for _, part := range openaiContent {
				if part.Type == types.ContentTypeText {
					parts = append(parts, AliMessagePart{
						Text: part.Text,
					})
				} else if part.Type == types.ContentTypeImageURL {
					parts = append(parts, AliMessagePart{
						Image: part.ImageURL.URL,
					})
				}
			}
			messages = append(messages, AliMessage{
				Content: parts,
				Role:    strings.ToLower(message.Role),
			})
		}

	}

	enableSearch := false
	aliModel := h.Request.Model
	if strings.HasSuffix(aliModel, AliEnableSearchModelSuffix) {
		enableSearch = true
		aliModel = strings.TrimSuffix(aliModel, AliEnableSearchModelSuffix)
	}

	return &AliChatRequest{
		Model: aliModel,
		Input: AliInput{
			Messages: messages,
		},
		Parameters: AliParameters{
			ResultFormat:      "message",
			EnableSearch:      enableSearch,
			IncrementalOutput: h.Request.Stream,
		},
	}
}

// 转换为OpenAI聊天请求体
func (h *aliChatHandler) convertToOpenai(response *AliChatResponse) (openaiResponse *types.ChatCompletionResponse, errWithCode *types.OpenAIErrorWithStatusCode) {
	error := errorHandle(&response.AliError)
	if error != nil {
		errWithCode = &types.OpenAIErrorWithStatusCode{
			OpenAIError: *error,
			StatusCode:  http.StatusBadRequest,
		}
		return
	}

	OpenAIResponse := types.ChatCompletionResponse{
		ID:      response.RequestId,
		Object:  "chat.completion",
		Created: common.GetTimestamp(),
		Model:   h.Request.Model,
		Choices: response.Output.ToChatCompletionChoices(),
		Usage: &types.Usage{
			PromptTokens:     response.Usage.InputTokens,
			CompletionTokens: response.Usage.OutputTokens,
			TotalTokens:      response.Usage.InputTokens + response.Usage.OutputTokens,
		},
	}

	h.Usage = OpenAIResponse.Usage

	return
}

// 转换为OpenAI聊天流式请求体
func (h *aliChatHandler) handlerStream(rawLine *[]byte, isFinished *bool, response *[]types.ChatCompletionStreamResponse) error {
	// 如果rawLine 前缀不为data:，则直接返回
	if !strings.HasPrefix(string(*rawLine), "data:") {
		*rawLine = nil
		return nil
	}

	// 去除前缀
	*rawLine = (*rawLine)[5:]

	var aliResponse AliChatResponse
	err := json.Unmarshal(*rawLine, &aliResponse)
	if err != nil {
		return common.ErrorToOpenAIError(err)
	}

	error := errorHandle(&aliResponse.AliError)
	if error != nil {
		return error
	}

	return h.convertToOpenaiStream(&aliResponse, response)

}

func (h *aliChatHandler) convertToOpenaiStream(aliResponse *AliChatResponse, response *[]types.ChatCompletionStreamResponse) error {
	content := aliResponse.Output.Choices[0].Message.StringContent()

	var choice types.ChatCompletionStreamChoice
	choice.Index = aliResponse.Output.Choices[0].Index
	choice.Delta.Content = strings.TrimPrefix(content, h.lastStreamResponse)
	if aliResponse.Output.Choices[0].FinishReason != "" {
		if aliResponse.Output.Choices[0].FinishReason != "null" {
			finishReason := aliResponse.Output.Choices[0].FinishReason
			choice.FinishReason = &finishReason
		}
	}

	if aliResponse.Output.FinishReason != "" {
		if aliResponse.Output.FinishReason != "null" {
			finishReason := aliResponse.Output.FinishReason
			choice.FinishReason = &finishReason
		}
	}

	h.lastStreamResponse = content
	streamResponse := types.ChatCompletionStreamResponse{
		ID:      aliResponse.RequestId,
		Object:  "chat.completion.chunk",
		Created: common.GetTimestamp(),
		Model:   h.Request.Model,
		Choices: []types.ChatCompletionStreamChoice{choice},
	}

	if aliResponse.Usage.OutputTokens != 0 {
		h.Usage.PromptTokens = aliResponse.Usage.InputTokens
		h.Usage.CompletionTokens = aliResponse.Usage.OutputTokens
		h.Usage.TotalTokens = aliResponse.Usage.InputTokens + aliResponse.Usage.OutputTokens
	}

	*response = append(*response, streamResponse)

	return nil
}
