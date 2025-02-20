package replicate

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"one-api/common/requester"
	"one-api/model"
	"one-api/providers/base"
	"one-api/types"
	"strings"
	"time"
)

type ReplicateProviderFactory struct{}

// 创建 ReplicateProvider
func (f ReplicateProviderFactory) Create(channel *model.Channel) base.ProviderInterface {
	return &ReplicateProvider{
		BaseProvider: base.BaseProvider{
			Config:    getConfig(),
			Channel:   channel,
			Requester: requester.NewHTTPRequester(*channel.Proxy, requestErrorHandle),
		},
		FetchPredictionUrl: "/v1/predictions/%s",
	}
}

type ReplicateProvider struct {
	base.BaseProvider
	FetchPredictionUrl string
}

func getConfig() base.ProviderConfig {
	return base.ProviderConfig{
		BaseURL:           "https://api.replicate.com",
		ImagesGenerations: "/v1/models/%s/predictions",
		ChatCompletions:   "/v1/models/%s/predictions",
	}
}

// 请求错误处理
func requestErrorHandle(resp *http.Response) *types.OpenAIError {
	replicateError := &ReplicateError{}
	err := json.NewDecoder(resp.Body).Decode(replicateError)
	if err != nil {
		return nil
	}

	return errorHandle(replicateError)
}

// 错误处理
func errorHandle(replicateError *ReplicateError) *types.OpenAIError {
	if replicateError.Status == 0 {
		return nil
	}
	return &types.OpenAIError{
		Message: replicateError.Detail,
		Type:    "replicate_error",
		Code:    replicateError.Status,
	}
}

// 获取请求头
func (p *ReplicateProvider) GetRequestHeaders() (headers map[string]string) {
	headers = make(map[string]string)
	p.CommonRequestHeaders(headers)
	headers["Authorization"] = fmt.Sprintf("Bearer %s", p.Channel.Key)

	return headers
}

// 获取完整请求 URL
func (p *ReplicateProvider) GetFullRequestURL(requestURL string, model string) string {
	baseURL := strings.TrimSuffix(p.GetBaseURL(), "/")
	requestURL = fmt.Sprintf(requestURL, model)

	return fmt.Sprintf("%s%s", baseURL, requestURL)
}

func getPrediction[T any](p *ReplicateProvider, response *ReplicateResponse[T]) (*ReplicateResponse[T], error) {
	if response.Status == "succeeded" {
		return response, nil
	}

	predictionResponse := getPredictionResponse[T](p, response.ID)
	if predictionResponse == nil {
		return response, errors.New("prediction response is nil")
	}

	if predictionResponse.Status == "failed" {
		return nil, errors.New(predictionResponse.Error)
	}

	return predictionResponse, nil
}

func getPredictionResponse[T any](p *ReplicateProvider, predictionID string) *ReplicateResponse[T] {
	fullRequestURL := p.GetFullRequestURL(p.FetchPredictionUrl, predictionID)
	if fullRequestURL == "" {
		return nil
	}

	headers := p.GetRequestHeaders()

	retry := 0
	for retry < 15 {
		time.Sleep(time.Second * 2)

		replicateResponse := &ReplicateResponse[T]{}
		req, err := p.Requester.NewRequest(http.MethodGet, fullRequestURL, p.Requester.WithHeader(headers))
		if err != nil {
			return nil
		}
		p.Requester.SendRequest(req, replicateResponse, false)
		if replicateResponse.Status == "succeeded" || replicateResponse.Status == "failed" {
			return replicateResponse
		}
		retry++
	}

	return nil
}
