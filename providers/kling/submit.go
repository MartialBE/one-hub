package kling

import (
	"fmt"
	"net/http"
	"one-api/common"
	"one-api/types"
)

func (s *KlingProvider) Submit(class, action string, request *KlingTask) (data *KlingResponse[KlingTaskData], errWithCode *types.OpenAIErrorWithStatusCode) {
	submitUri := fmt.Sprintf(s.Generations, class, action)

	fullRequestURL := s.GetFullRequestURL(submitUri, "")
	headers := s.GetRequestHeaders()

	// 创建请求
	req, err := s.Requester.NewRequest(http.MethodPost, fullRequestURL, s.Requester.WithHeader(headers), s.Requester.WithBody(request))

	if err != nil {
		return nil, common.ErrorWrapper(err, "new_request_failed", http.StatusInternalServerError)
	}

	data = &KlingResponse[KlingTaskData]{}
	_, errWithCode = s.Requester.SendRequest(req, data, false)

	return data, errWithCode
}
