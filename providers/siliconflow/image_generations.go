package siliconflow

import (
	"net/http"
	"one-api/common"
	"one-api/common/config"
	"one-api/types"
	"time"
)

func (p *SiliconflowProvider) CreateImageGenerations(request *types.ImageRequest) (*types.ImageResponse, *types.OpenAIErrorWithStatusCode) {
	url, errWithCode := p.GetSupportedAPIUri(config.RelayModeImagesGenerations)
	if errWithCode != nil {
		return nil, errWithCode
	}
	// 获取请求地址
	fullRequestURL := p.GetFullRequestURL(url, request.Model)
	if fullRequestURL == "" {
		return nil, common.ErrorWrapper(nil, "invalid_siliconflow_config", http.StatusInternalServerError)
	}

	// 获取请求头
	headers := p.GetRequestHeaders()

	siliconflowRequest := convertFromIamgeOpenai(request)
	// 创建请求
	req, err := p.Requester.NewRequest(http.MethodPost, fullRequestURL, p.Requester.WithBody(siliconflowRequest), p.Requester.WithHeader(headers))
	if err != nil {
		return nil, common.ErrorWrapper(err, "new_request_failed", http.StatusInternalServerError)
	}
	defer req.Body.Close()

	siliconflowResponse := &ImageRes{}

	// 发送请求
	_, errWithCode = p.Requester.SendRequest(req, siliconflowResponse, false)
	if errWithCode != nil {
		return nil, errWithCode
	}

	return p.convertToImageOpenai(siliconflowResponse)
}

func (p *SiliconflowProvider) convertToImageOpenai(response *ImageRes) (openaiResponse *types.ImageResponse, errWithCode *types.OpenAIErrorWithStatusCode) {
	imageResponseDataInner := make([]types.ImageResponseDataInner, 0)

	for _, image := range response.Images {
		imageResponseDataInner = append(imageResponseDataInner, types.ImageResponseDataInner{
			URL: image.Url,
		})
	}

	openaiResponse = &types.ImageResponse{
		Created: time.Now().Unix(),
		Data:    imageResponseDataInner,
	}

	p.Usage.PromptTokens = 1

	return
}

func convertFromIamgeOpenai(request *types.ImageRequest) *ImageGenerations {
	return &ImageGenerations{
		Prompt:            request.Prompt,
		ImageSize:         request.Size,
		NumInferenceSteps: 50,
		BatchSize:         request.N,
	}
}
