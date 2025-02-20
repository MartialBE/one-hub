package gemini

import (
	"net/http"
	"one-api/common"
	"one-api/common/utils"
	"one-api/types"
)

func (p *GeminiProvider) CreateImageGenerations(request *types.ImageRequest) (*types.ImageResponse, *types.OpenAIErrorWithStatusCode) {
	geminiRequest := &GeminiImageRequest{
		Instances: []GeminiImageInstance{
			{
				Prompt: request.Prompt,
			},
		},
		Parameters: GeminiImageParameters{
			PersonGeneration: "allow_adult",
			SampleCount:      request.N,
		},
	}

	if request.AspectRatio != nil {
		geminiRequest.Parameters.AspectRatio = *request.AspectRatio
	} else {
		switch request.Size {
		case "1024x1792":
			geminiRequest.Parameters.AspectRatio = "9:16"
		case "1792x1024":
			geminiRequest.Parameters.AspectRatio = "16:9"
		default:
			geminiRequest.Parameters.AspectRatio = "1:1"
		}
	}

	fullRequestURL := p.GetFullRequestURL("predict", request.Model)
	headers := p.GetRequestHeaders()

	req, err := p.Requester.NewRequest(http.MethodPost, fullRequestURL, p.Requester.WithBody(geminiRequest), p.Requester.WithHeader(headers))
	if err != nil {
		return nil, common.ErrorWrapper(err, "new_request_failed", http.StatusInternalServerError)
	}

	defer req.Body.Close()

	geminiImageResponse := &GeminiImageResponse{}
	_, errWithCode := p.Requester.SendRequest(req, geminiImageResponse, false)
	if errWithCode != nil {
		return nil, errWithCode
	}

	imageCount := len(geminiImageResponse.Predictions)

	// 如果imageCount为0，则返回错误
	if imageCount == 0 {
		return nil, common.StringErrorWrapper("no image generated", "no_image_generated", http.StatusInternalServerError)
	}

	openaiResponse := &types.ImageResponse{
		Created: utils.GetTimestamp(),
		Data:    make([]types.ImageResponseDataInner, 0, imageCount),
	}

	for _, prediction := range geminiImageResponse.Predictions {
		if prediction.BytesBase64Encoded == "" {
			continue
		}

		openaiResponse.Data = append(openaiResponse.Data, types.ImageResponseDataInner{
			B64JSON: prediction.BytesBase64Encoded,
		})
	}

	usage := p.GetUsage()
	usage.PromptTokens = imageCount * 258
	usage.TotalTokens = usage.PromptTokens

	return openaiResponse, nil
}
