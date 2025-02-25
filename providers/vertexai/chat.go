package vertexai

import (
	"net/http"
	"one-api/common"
	"one-api/common/requester"
	"one-api/providers/vertexai/category"
	"one-api/types"
)

func (p *VertexAIProvider) CreateChatCompletion(request *types.ChatCompletionRequest) (*types.ChatCompletionResponse, *types.OpenAIErrorWithStatusCode) {
	request.OneOtherArg = p.GetOtherArg()
	// 发送请求
	response, errWithCode := p.Send(request)
	if errWithCode != nil {
		return nil, errWithCode
	}

	defer response.Body.Close()

	return p.Category.ResponseChatComplete(p, response, request)
}

func (p *VertexAIProvider) CreateChatCompletionStream(request *types.ChatCompletionRequest) (requester.StreamReaderInterface[string], *types.OpenAIErrorWithStatusCode) {
	request.OneOtherArg = p.GetOtherArg()
	// 发送请求
	response, errWithCode := p.Send(request)
	if errWithCode != nil {
		return nil, errWithCode
	}

	return requester.RequestStream(p.Requester, response, p.Category.ResponseChatCompleteStrem(p, request))
}

func (p *VertexAIProvider) Send(request *types.ChatCompletionRequest) (*http.Response, *types.OpenAIErrorWithStatusCode) {
	req, errWithCode := p.getChatRequest(request)
	if errWithCode != nil {
		return nil, errWithCode
	}
	defer req.Body.Close()

	// 发送请求
	return p.Requester.SendRequestRaw(req)
}

func (p *VertexAIProvider) getChatRequest(request *types.ChatCompletionRequest) (*http.Request, *types.OpenAIErrorWithStatusCode) {
	var err error
	p.Category, err = category.GetCategory(request.Model)
	if err != nil || p.Category.ChatComplete == nil || p.Category.ResponseChatComplete == nil {
		return nil, common.StringErrorWrapperLocal("vertexAI provider not found", "vertexAI_err", http.StatusInternalServerError)
	}

	otherUrl := p.Category.GetOtherUrl(request.Stream)
	modelName := p.Category.GetModelName(request.Model)

	// 获取请求地址
	fullRequestURL := p.GetFullRequestURL(modelName, otherUrl)
	if fullRequestURL == "" {
		return nil, common.ErrorWrapperLocal(nil, "invalid_vertexai_config", http.StatusInternalServerError)
	}

	headers := p.GetRequestHeaders()

	if headers == nil {
		return nil, common.ErrorWrapperLocal(nil, "invalid_vertexai_config", http.StatusInternalServerError)
	}

	vertexaiRequest, errWithCode := p.Category.ChatComplete(request)
	if errWithCode != nil {
		return nil, errWithCode
	}

	// 错误处理
	p.Requester.ErrorHandler = RequestErrorHandle(p.Category.ErrorHandler)

	// 创建请求
	req, err := p.Requester.NewRequest(http.MethodPost, fullRequestURL, p.Requester.WithBody(vertexaiRequest), p.Requester.WithHeader(headers))
	if err != nil {
		return nil, common.ErrorWrapperLocal(err, "new_request_failed", http.StatusInternalServerError)
	}
	return req, nil
}
