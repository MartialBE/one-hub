package deepseek

import (
	"errors"
	"strconv"
)

type Response struct {
	IsAvailable bool           `json:"is_available"`
	BalanceInfo []*BalanceInfo `json:"balance_infos"`
}

type BalanceInfo struct {
	Currency     string `json:"currency"`
	TotalBalance string `json:"total_balance"`
}

func (p *DeepseekProvider) Balance() (float64, error) {

	fullRequestURL := p.GetFullRequestURL("/user/balance", "")
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

	if len(info.BalanceInfo) == 0 {
		return 0, errors.New("获取余额失败")
	}

	balance, err := strconv.ParseFloat(info.BalanceInfo[0].TotalBalance, 64)
	if err != nil {
		return 0, err
	}

	p.Channel.UpdateBalance(balance)
	return balance, nil
}
