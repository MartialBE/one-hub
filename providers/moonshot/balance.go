package moonshot

import (
	"errors"
	"strings"
)

type Response struct {
	Code   int         `json:"code"`
	Data   BalanceInfo `json:"data"`
	Scode  string      `json:"scode"`
	Status bool        `json:"status"`
}

type BalanceInfo struct {
	AvailableBalance float64 `json:"available_balance"`
	VoucherBalance   float64 `json:"voucher_balance"`
	CashBalance      float64 `json:"cash_balance"`
}

func (p *MoonshotProvider) Balance() (float64, error) {

	fullRequestURL := p.GetFullRequestURL("/v1/users/me/balance", "")
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
	if info.Code != 0 || !strings.EqualFold(info.Scode, "0x0") {
		return 0, errors.New("获取余额失败")
	}
	balance := info.Data.AvailableBalance / 7 //RMB TO USD
	p.Channel.UpdateBalance(balance)
	return balance, nil
}
