package replicate

import (
	"net/http"
	"one-api/common"
	"one-api/common/config"
	"one-api/types"
	"time"
)

func (p *ReplicateProvider) CreateImageGenerations(request *types.ImageRequest) (*types.ImageResponse, *types.OpenAIErrorWithStatusCode) {
	url, errWithCode := p.GetSupportedAPIUri(config.RelayModeImagesGenerations)
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

	replicateRequest := convertFromIamgeOpenai(request)
	req, err := p.Requester.NewRequest(http.MethodPost, fullRequestURL, p.Requester.WithBody(replicateRequest), p.Requester.WithHeader(headers))

	if err != nil {
		return nil, common.ErrorWrapper(err, "new_request_failed", http.StatusInternalServerError)
	}

	replicateResponse := &ReplicateResponse[string]{}

	// 发送请求
	_, errWithCode = p.Requester.SendRequest(req, replicateResponse, false)
	if errWithCode != nil {
		return nil, errWithCode
	}

	replicateResponse = getPrediction(p, replicateResponse)

	if replicateResponse.Output == "" {
		replicateResponse.Output = replicateResponse.Urls.Stream
	}

	p.Usage.TotalTokens = p.Usage.PromptTokens

	return p.convertToImageOpenai(replicateResponse)
}

func convertFromIamgeOpenai(request *types.ImageRequest) *ReplicateRequest[ReplicateImageRequest] {
	return &ReplicateRequest[ReplicateImageRequest]{
		Input: ReplicateImageRequest{
			Prompt:           request.Prompt,
			OutputFormat:     request.ResponseFormat,
			Size:             request.Size,
			AspectRatio:      request.AspectRatio,
			OutputQuality:    request.OutputQuality,
			SafetyTolerance:  request.SafetyTolerance,
			PromptUpsampling: request.PromptUpsampling,
		},
	}
}

func (p *ReplicateProvider) convertToImageOpenai(response *ReplicateResponse[string]) (*types.ImageResponse, *types.OpenAIErrorWithStatusCode) {
	openaiResponse := &types.ImageResponse{
		Created: time.Now().Unix(),
		Data: []types.ImageResponseDataInner{
			{
				URL: response.Output,
			},
		},
	}

	return openaiResponse, nil
}
