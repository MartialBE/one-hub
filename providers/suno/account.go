package suno

import (
	"net/http"
)

func (s *SunoProvider) GetAccount() (data *TaskResponse[SunoAccount], err error) {
	fullRequestURL := s.GetFullRequestURL(s.Account, "")
	headers := s.GetRequestHeaders()

	// 创建请求
	req, err := s.Requester.NewRequest(http.MethodGet, fullRequestURL, s.Requester.WithHeader(headers))
	if err != nil {
		return nil, err
	}

	_, errWithCode := s.Requester.SendRequest(req, data, false)

	return data, errWithCode
}
