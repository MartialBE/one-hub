package suno

import (
	"fmt"
	"net/http"
	"one-api/common"
	"one-api/types"
)

func (s *SunoProvider) GetFetchs(ids []string) (data *types.TaskResponse[[]SunoDataResponse], errWithCode *types.OpenAIErrorWithStatusCode) {
	fullRequestURL := s.GetFullRequestURL(s.Fetchs, "")
	headers := s.GetRequestHeaders()
	fetchReq := &FetchReq{
		IDs: ids,
	}
	// 创建请求
	req, err := s.Requester.NewRequest(http.MethodPost, fullRequestURL, s.Requester.WithHeader(headers), s.Requester.WithBody(fetchReq))
	if err != nil {
		return nil, common.ErrorWrapper(err, "new_request_failed", http.StatusInternalServerError)
	}

	data = &types.TaskResponse[[]SunoDataResponse]{}
	_, errWithCode = s.Requester.SendRequest(req, data, false)

	return data, errWithCode
}

func (s *SunoProvider) GetFetch(id string) (data *types.TaskResponse[SunoDataResponse], errWithCode *types.OpenAIErrorWithStatusCode) {
	fetchUri := fmt.Sprintf(s.Fetch, id)

	fullRequestURL := s.GetFullRequestURL(fetchUri, "")
	headers := s.GetRequestHeaders()

	// 创建请求
	req, err := s.Requester.NewRequest(http.MethodGet, fullRequestURL, s.Requester.WithHeader(headers))
	if err != nil {
		return nil, common.ErrorWrapper(err, "new_request_failed", http.StatusInternalServerError)
	}

	data = &types.TaskResponse[SunoDataResponse]{}
	_, errWithCode = s.Requester.SendRequest(req, data, false)

	return data, errWithCode
}
