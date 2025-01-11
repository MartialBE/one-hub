package recraftAI

import (
	"errors"
)

type Response struct {
	Credits int `json:"credits"`
}

func (p *RecraftProvider) Balance() (float64, error) {

	fullRequestURL := p.GetFullRequestURL("/v1/users/me")
	headers := p.GetRequestHeaders()

	req, err := p.Requester.NewRequest("GET", fullRequestURL, p.Requester.WithHeader(headers))
	if err != nil {
		return 0, err
	}

	// 发送请求
	var info Response
	_, errWithCode := p.Requester.SendRequest(req, &info, false)
	if errWithCode != nil {
		return 0, errors.New(errWithCode.OpenAIError.Message)
	}

	balance := 0.0
	if info.Credits > 0 {
		balance = float64(info.Credits) / 1000
	}
	p.Channel.UpdateBalance(balance)
	return balance, nil
}
