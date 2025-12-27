package bedrock

import (
	"encoding/json"
	"net/http"
	"one-api/common"
	"one-api/common/config"
	"one-api/common/requester"
	"one-api/providers/bedrock/category"
	"one-api/types"
)

func (p *BedrockProvider) CreateChatCompletion(request *types.ChatCompletionRequest) (*types.ChatCompletionResponse, *types.OpenAIErrorWithStatusCode) {
	request.OneOtherArg = p.GetOtherArg()
	// 发送请求
	response, errWithCode := p.Send(request)
	if errWithCode != nil {
		return nil, errWithCode
	}

	defer response.Body.Close()

	return p.Category.ResponseChatComplete(p, response, request)
}

func (p *BedrockProvider) CreateChatCompletionStream(request *types.ChatCompletionRequest) (requester.StreamReaderInterface[string], *types.OpenAIErrorWithStatusCode) {
	request.OneOtherArg = p.GetOtherArg()
	// 发送请求
	response, errWithCode := p.Send(request)
	if errWithCode != nil {
		return nil, errWithCode
	}

	return RequestStream(response, p.Category.ResponseChatCompleteStrem(p, request))
}

func (p *BedrockProvider) Send(request *types.ChatCompletionRequest) (*http.Response, *types.OpenAIErrorWithStatusCode) {
	req, errWithCode := p.getChatRequest(request)
	if errWithCode != nil {
		return nil, errWithCode
	}
	defer req.Body.Close()

	// 发送请求
	return p.Requester.SendRequestRaw(req)
}

func (p *BedrockProvider) getChatRequest(request *types.ChatCompletionRequest) (*http.Request, *types.OpenAIErrorWithStatusCode) {
	var err error
	p.Category, err = category.GetCategory(request.Model)
	if err != nil || p.Category.ChatComplete == nil || p.Category.ResponseChatComplete == nil {
		return nil, common.StringErrorWrapperLocal("bedrock provider not found", "bedrock_err", http.StatusInternalServerError)
	}

	url, errWithCode := p.GetSupportedAPIUri(config.RelayModeChatCompletions)
	if errWithCode != nil {
		return nil, errWithCode
	}

	if request.Stream {
		url += "-with-response-stream"
	}

	// 获取请求地址
	fullRequestURL := p.GetFullRequestURL(url, p.Category.ModelName)
	if fullRequestURL == "" {
		return nil, common.ErrorWrapper(nil, "invalid_claude_config", http.StatusInternalServerError)
	}

	headers := p.GetRequestHeaders()

	bedrockRequest, errWithCode := p.Category.ChatComplete(request)
	if errWithCode != nil {
		return nil, errWithCode
	}

	// 处理额外参数
	customParams, err := p.CustomParameterHandler()
	if err != nil {
		return nil, common.ErrorWrapper(err, "custom_parameter_error", http.StatusInternalServerError)
	}

	// 如果有额外参数，将其合并到请求体中
	var req *http.Request
	if customParams != nil {
		// 将请求体转换为map，以便添加额外参数
		var requestMap map[string]interface{}
		requestBytes, err := json.Marshal(bedrockRequest)
		if err != nil {
			return nil, common.ErrorWrapper(err, "marshal_request_failed", http.StatusInternalServerError)
		}

		err = json.Unmarshal(requestBytes, &requestMap)
		if err != nil {
			return nil, common.ErrorWrapper(err, "unmarshal_request_failed", http.StatusInternalServerError)
		}

		// 合并自定义参数
		requestMap = p.mergeCustomParams(requestMap, customParams)

		// 使用修改后的请求体创建请求
		req, err = p.Requester.NewRequest(http.MethodPost, fullRequestURL, p.Requester.WithBody(requestMap), p.Requester.WithHeader(headers))
		if err != nil {
			return nil, common.ErrorWrapper(err, "new_request_failed", http.StatusInternalServerError)
		}
	} else {
		// 如果没有额外参数，使用原始请求体创建请求
		req, err = p.Requester.NewRequest(http.MethodPost, fullRequestURL, p.Requester.WithBody(bedrockRequest), p.Requester.WithHeader(headers))
		if err != nil {
			return nil, common.ErrorWrapper(err, "new_request_failed", http.StatusInternalServerError)
		}
	}

	p.Sign(req)

	return req, nil
}
