package alipay

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	sysconfig "one-api/common/config"
	"one-api/payment/types"
	"strconv"

	"github.com/smartwalle/alipay/v3"
)

// handleTradePreCreate 处理支付宝当面付请求
func (a *Alipay) handleTradePreCreate(config *types.PayConfig) (*types.PayRequest, error) {
	var p = alipay.TradePreCreate{}
	p.OutTradeNo = config.TradeNo
	p.TotalAmount = strconv.FormatFloat(config.Money, 'f', 2, 64)
	p.Subject = sysconfig.SystemName + "-Token充值:" + p.TotalAmount
	p.NotifyURL = config.NotifyURL
	p.ReturnURL = config.ReturnURL
	p.TimeoutExpress = "15m"
	ctx := context.Background()
	alipayRes, err := client.TradePreCreate(ctx, p)
	if err != nil {
		return nil, fmt.Errorf("alipay trade precreate failed: %s", err.Error())
	}
	if !alipayRes.IsSuccess() {
		return nil, fmt.Errorf("alipay trade precreate failed: %s", alipayRes.Msg)
	}
	if alipayRes.Code != "10000" {
		return nil, fmt.Errorf("alipay trade precreate failed: %s", alipayRes.Msg)
	}
	payRequest := &types.PayRequest{
		Type: 2,
		Data: types.PayRequestData{
			URL:    alipayRes.QRCode,
			Method: http.MethodGet,
		},
	}
	return payRequest, nil
}

// handlePagePay 处理支付宝网页支付请求
func (a *Alipay) handlePagePay(config *types.PayConfig) (*types.PayRequest, error) {
	var p = alipay.TradePagePay{}
	p.OutTradeNo = config.TradeNo
	p.TotalAmount = strconv.FormatFloat(config.Money, 'f', 2, 64)
	p.Subject = sysconfig.SystemName + "-Token充值:" + p.TotalAmount
	p.NotifyURL = config.NotifyURL
	p.ReturnURL = config.ReturnURL
	p.ProductCode = "FAST_INSTANT_TRADE_PAY"
	p.TimeoutExpress = "15m"
	alipayRes, err := client.TradePagePay(p)
	if err != nil {
		return nil, fmt.Errorf("alipay trade precreate failed: %s", err.Error())
	}
	payUrl, parms, err := extractURLAndParams(alipayRes.String())
	if err != nil {
		return nil, fmt.Errorf("alipay trade precreate failed: %s", err.Error())
	}
	payRequest := &types.PayRequest{
		Type: 1,
		Data: types.PayRequestData{
			URL:    payUrl,
			Params: parms,
			Method: http.MethodGet,
		},
	}
	return payRequest, nil
}

// handlePagePay 处理支付宝手机网页支付请求
func (a *Alipay) handleWapPay(config *types.PayConfig) (*types.PayRequest, error) {
	var p = alipay.TradeWapPay{}
	p.OutTradeNo = config.TradeNo
	p.TotalAmount = strconv.FormatFloat(config.Money, 'f', 2, 64)
	p.Subject = sysconfig.SystemName + "-Token充值:" + p.TotalAmount
	p.NotifyURL = config.NotifyURL
	p.ReturnURL = config.ReturnURL
	p.ProductCode = "QUICK_WAP_WAY"
	p.TimeoutExpress = "15m"
	alipayRes, err := client.TradeWapPay(p)
	if err != nil {
		return nil, fmt.Errorf("alipay trade precreate failed: %s", err.Error())
	}
	payUrl, parms, err := extractURLAndParams(alipayRes.String())
	if err != nil {
		return nil, fmt.Errorf("alipay trade precreate failed: %s", err.Error())
	}
	payRequest := &types.PayRequest{
		Type: 1,
		Data: types.PayRequestData{
			URL:    payUrl,
			Params: parms,
			Method: http.MethodGet,
		},
	}
	return payRequest, nil
}

// extractURLAndParams 从给定的原始 URL 中提取网址和参数，并将参数转换为 map[string]string
func extractURLAndParams(rawURL string) (string, map[string]string, error) {
	// 解析 URL
	parsedURL, err := url.Parse(rawURL)
	if err != nil {
		return "", nil, err
	}

	// 提取网址
	baseURL := fmt.Sprintf("%s://%s%s", parsedURL.Scheme, parsedURL.Host, parsedURL.Path)

	// 提取参数并转换成 map[string]string
	params := parsedURL.Query()
	paramMap := make(map[string]string)
	for key, values := range params {
		// 由于 URL 参数可能有多个值，这里只取第一个值
		paramMap[key] = values[0]
	}

	return baseURL, paramMap, nil
}
