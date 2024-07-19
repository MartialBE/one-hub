package vertexai

import (
	"net/http"
	"one-api/common/requester"
	"one-api/providers/claude"
	"one-api/providers/vertexai/category"
)

func (p *VertexAIProvider) CreateClaudeChat(request *claude.ClaudeRequest) (*claude.ClaudeResponse, *claude.ClaudeErrorWithStatusCode) {
	req, errWithCode := p.getClaudeRequest(request)
	if errWithCode != nil {
		return nil, errWithCode
	}
	defer req.Body.Close()

	claudeResponse := &claude.ClaudeResponse{}
	// // 发送请求
	_, openaiErr := p.Requester.SendRequest(req, claudeResponse, false)
	if openaiErr != nil {
		return nil, claude.OpenaiErrToClaudeErr(openaiErr)
	}

	claude.ClaudeUsageToOpenaiUsage(&claudeResponse.Usage, p.GetUsage())

	return claudeResponse, nil
}

func (p *VertexAIProvider) CreateClaudeChatStream(request *claude.ClaudeRequest) (requester.StreamReaderInterface[string], *claude.ClaudeErrorWithStatusCode) {
	req, errWithCode := p.getClaudeRequest(request)
	if errWithCode != nil {
		return nil, errWithCode
	}
	defer req.Body.Close()

	chatHandler := &claude.ClaudeRelayStreamHandler{
		Usage:     p.Usage,
		ModelName: request.Model,
		Prefix:    `data: {"type"`,
	}

	// 发送请求
	resp, openaiErr := p.Requester.SendRequestRaw(req)
	if openaiErr != nil {
		return nil, claude.OpenaiErrToClaudeErr(openaiErr)
	}

	stream, openaiErr := requester.RequestNoTrimStream(p.Requester, resp, chatHandler.HandlerStream)
	if openaiErr != nil {
		return nil, claude.OpenaiErrToClaudeErr(openaiErr)
	}

	return stream, nil
}

func (p *VertexAIProvider) getClaudeRequest(request *claude.ClaudeRequest) (*http.Request, *claude.ClaudeErrorWithStatusCode) {
	var err error
	p.Category, err = category.GetCategory(request.Model)
	if err != nil || p.Category.Category != "claude" {
		return nil, claude.StringErrorWrapper("vertexAI provider not found", "vertexAI_err", http.StatusInternalServerError, true)
	}

	otherUrl := p.Category.GetOtherUrl(request.Stream)
	modelName := p.Category.GetModelName(request.Model)

	// 获取请求地址
	fullRequestURL := p.GetFullRequestURL(modelName, otherUrl)
	if fullRequestURL == "" {
		return nil, claude.StringErrorWrapper("vertexAI config error", "invalid_vertexai_config", http.StatusInternalServerError, true)
	}

	headers := p.GetRequestHeaders()

	if headers == nil {
		return nil, claude.StringErrorWrapper("vertexAI config error", "invalid_vertexai_config", http.StatusInternalServerError, true)
	}

	if request.Stream {
		headers["Accept"] = "text/event-stream"
	}

	vertexaiRequest := &category.ClaudeRequest{
		ClaudeRequest:    request,
		AnthropicVersion: category.AnthropicVersion,
	}
	vertexaiRequest.Model = ""

	// 错误处理
	p.Requester.ErrorHandler = RequestErrorHandle(p.Category.ErrorHandler)

	// 创建请求
	req, err := p.Requester.NewRequest(http.MethodPost, fullRequestURL, p.Requester.WithBody(vertexaiRequest), p.Requester.WithHeader(headers))
	if err != nil {
		return nil, claude.StringErrorWrapper(err.Error(), "new_request_failed", http.StatusInternalServerError, true)
	}
	return req, nil
}
