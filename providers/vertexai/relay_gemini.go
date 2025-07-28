package vertexai

import (
	"net/http"
	"one-api/common"
	"one-api/common/requester"
	"one-api/providers/gemini"
	"one-api/providers/vertexai/category"
	"one-api/types"
)

func (p *VertexAIProvider) CreateGeminiChat(request *gemini.GeminiChatRequest) (*gemini.GeminiChatResponse, *types.OpenAIErrorWithStatusCode) {
	req, errWithCode := p.getGeminiRequest(request)
	if errWithCode != nil {
		return nil, errWithCode
	}
	defer req.Body.Close()

	geminiResponse := &gemini.GeminiChatResponse{}
	// // 发送请求
	_, openaiErr := p.Requester.SendRequest(req, geminiResponse, false)
	if openaiErr != nil {
		return nil, openaiErr
	}

	usage := p.GetUsage()
	*usage = gemini.ConvertOpenAIUsage(geminiResponse.UsageMetadata)

	return geminiResponse, nil
}

func (p *VertexAIProvider) CreateGeminiChatStream(request *gemini.GeminiChatRequest) (requester.StreamReaderInterface[string], *types.OpenAIErrorWithStatusCode) {
	req, errWithCode := p.getGeminiRequest(request)
	if errWithCode != nil {
		return nil, errWithCode
	}
	defer req.Body.Close()

	chatHandler := &gemini.GeminiRelayStreamHandler{
		Usage:     p.Usage,
		ModelName: request.Model,
		Prefix:    `data: `,
	}

	// 发送请求
	resp, openaiErr := p.Requester.SendRequestRaw(req)
	if openaiErr != nil {
		return nil, openaiErr
	}

	stream, openaiErr := requester.RequestNoTrimStream(p.Requester, resp, chatHandler.HandlerStream)
	if openaiErr != nil {
		return nil, openaiErr
	}

	return stream, nil
}

func (p *VertexAIProvider) getGeminiRequest(request *gemini.GeminiChatRequest) (*http.Request, *types.OpenAIErrorWithStatusCode) {
	var err error
	p.Category, err = category.GetCategory(request.Model)
	if err != nil || p.Category.Category != "gemini" {
		return nil, common.StringErrorWrapperLocal("vertexAI provider not found", "vertexAI_err", http.StatusInternalServerError)
	}

	otherUrl := p.Category.GetOtherUrl(request.Stream)
	modelName := p.Category.GetModelName(request.Model)

	// 获取请求地址
	fullRequestURL := p.GetFullRequestURL(modelName, otherUrl)
	if fullRequestURL == "" {
		return nil, common.StringErrorWrapperLocal("vertexAI config error", "invalid_vertexai_config", http.StatusInternalServerError)
	}

	headers := p.GetRequestHeaders()

	if headers == nil {
		return nil, common.StringErrorWrapperLocal("vertexAI config error", "invalid_vertexai_config", http.StatusInternalServerError)
	}

	if request.Stream {
		headers["Accept"] = "text/event-stream"
	}

	body, exists := p.GetRawBody()
	if !exists {
		return nil, common.StringErrorWrapperLocal("request body not found", "request_body_not_found", http.StatusInternalServerError)
	}

	// 错误处理
	p.Requester.ErrorHandler = RequestErrorHandle(p.Category.ErrorHandler)

	// 创建请求
	req, err := p.Requester.NewRequest(http.MethodPost, fullRequestURL, p.Requester.WithBody(body), p.Requester.WithHeader(headers))
	if err != nil {
		return nil, common.StringErrorWrapperLocal(err.Error(), "new_request_failed", http.StatusInternalServerError)
	}
	return req, nil
}
