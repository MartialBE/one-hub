package siliconflow

import (
	"errors"
	"strconv"
)

type Response struct {
	Code    int       `json:"code"`
	Message string    `json:"message"`
	Data    *UserInfo `json:"data,omitempty"`
}

type UserInfo struct {
	ID           string `json:"id"`
	Balance      string `json:"balance"`
	TotalBalance string `json:"totalBalance"`
}

func (p *SiliconflowProvider) Balance() (float64, error) {

	fullRequestURL := p.GetFullRequestURL("/v1/user/info", "")
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

	if info.Data == nil {
		return 0, errors.New("获取余额失败")
	}

	balance, err := strconv.ParseFloat(info.Data.TotalBalance, 64)
	if err != nil {
		return 0, err
	}

	p.Channel.UpdateBalance(balance)
	return balance, nil
}
