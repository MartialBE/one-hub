package bedrock

import (
	"net/http"
	"one-api/common"
	"one-api/common/requester"
	"one-api/providers/claude"
	"one-api/types"
	"strings"
)

type claudeStreamHandler struct {
	Usage   *types.Usage
	Request *types.ChatCompletionRequest
}

func (p *BedrockProvider) CreateChatCompletion(request *types.ChatCompletionRequest) (*types.ChatCompletionResponse, *types.OpenAIErrorWithStatusCode) {
	req, errWithCode := p.getChatRequest(request)
	if errWithCode != nil {
		return nil, errWithCode
	}
	defer req.Body.Close()

	claudeResponse := &ClaudeResponse{}
	// 发送请求
	_, errWithCode = p.Requester.SendRequest(req, claudeResponse, false)
	if errWithCode != nil {
		return nil, errWithCode
	}

	return p.convertToChatOpenai(claudeResponse, request)
}

func (p *BedrockProvider) CreateChatCompletionStream(request *types.ChatCompletionRequest) (requester.StreamReaderInterface[string], *types.OpenAIErrorWithStatusCode) {
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

	chatHandler := &claudeStreamHandler{
		Usage:   p.Usage,
		Request: request,
	}

	return requester.RequestStream[string](p.Requester, resp, chatHandler.handlerStream)
}

func (p *BedrockProvider) getChatRequest(request *types.ChatCompletionRequest) (*http.Request, *types.OpenAIErrorWithStatusCode) {
	url, errWithCode := p.GetSupportedAPIUri(common.RelayModeChatCompletions)
	if errWithCode != nil {
		return nil, errWithCode
	}

	if request.Stream {
		url += "-with-response-stream"
	}

	// 获取请求地址
	fullRequestURL := p.GetFullRequestURL(url, request.Model)
	if fullRequestURL == "" {
		return nil, common.ErrorWrapper(nil, "invalid_claude_config", http.StatusInternalServerError)
	}

	headers := p.GetRequestHeaders()

	bedrockRequest, errWithCode := convertFromChatOpenai(request)
	if errWithCode != nil {
		return nil, errWithCode
	}

	// 创建请求
	req, err := p.Requester.NewRequest(http.MethodPost, fullRequestURL, p.Requester.WithBody(bedrockRequest), p.Requester.WithHeader(headers))
	if err != nil {
		return nil, common.ErrorWrapper(err, "new_request_failed", http.StatusInternalServerError)
	}

	p.Sign(req)

	return req, nil
}

func convertFromChatOpenai(request *types.ChatCompletionRequest) (any, *types.OpenAIErrorWithStatusCode) {
	// 如果前缀是claude，那么就是claude的请求
	if strings.HasPrefix(request.Model, "claude") {
		rawRequest, err := claude.ConvertFromChatOpenai(request)
		if err != nil {
			return nil, err
		}

		claudeRequest := &ClaudeRequest{}
		claudeRequest.ClaudeRequest = rawRequest
		claudeRequest.AnthropicVersion = anthropicVersion

		return claudeRequest, nil
	}

	return nil, nil
}
