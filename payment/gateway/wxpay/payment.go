package wxpay

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"one-api/model"
	"one-api/payment/types"

	"github.com/gin-gonic/gin"
	"github.com/wechatpay-apiv3/wechatpay-go/core"
	"github.com/wechatpay-apiv3/wechatpay-go/core/auth/verifiers"
	"github.com/wechatpay-apiv3/wechatpay-go/core/downloader"
	"github.com/wechatpay-apiv3/wechatpay-go/core/notify"
	"github.com/wechatpay-apiv3/wechatpay-go/core/option"
	"github.com/wechatpay-apiv3/wechatpay-go/services/payments"
	"github.com/wechatpay-apiv3/wechatpay-go/utils"
)

type WeChatPay struct{}

type WeChatConfig struct {
	AppID                      string  `json:"app_id"`                        //应用ID
	MchID                      string  `json:"mch_id"`                        //商户号
	MchCertificateSerialNumber string  `json:"mch_certificate_serial_number"` //商户证书序列号
	MchAPIv3Key                string  `json:"mch_apiv3_key"`                 //商户APIv3密钥
	MchPrivateKey              string  `json:"mch_private_key"`               //商户私钥
	NotifyURL                  string  `json:"notify_url"`
	PayType                    PayType `json:"pay_type"`
}

var client *core.Client

func (w *WeChatPay) Name() string {
	return "微信支付"
}

func (w *WeChatPay) InitClient(config *WeChatConfig) error {
	// 使用 utils 提供的函数从本地文件中加载商户私钥，商户私钥会用来生成请求的签名
	mchPrivateKey, err := utils.LoadPrivateKey(config.MchPrivateKey)
	if err != nil {
		log.Fatal("load merchant private key error")
		return err
	}
	ctx := context.Background()
	// 使用商户私钥等初始化 client，并使它具有自动定时获取微信支付平台证书的能力
	opts := []core.ClientOption{
		option.WithWechatPayAutoAuthCipher(config.MchID, config.MchCertificateSerialNumber, mchPrivateKey, config.MchAPIv3Key),
	}
	client, err = core.NewClient(ctx, opts...)
	return err
}

func (w *WeChatPay) Pay(config *types.PayConfig, gatewayConfig string) (*types.PayRequest, error) {
	wechatConfig, err := getWeChatConfig(gatewayConfig)
	if err != nil {
		return nil, err
	}

	if client == nil {
		err := w.InitClient(wechatConfig)
		if err != nil {
			return nil, err
		}
	}
	switch wechatConfig.PayType {
	case Native:
		return w.handleNativePay(config, wechatConfig)
	default:
		return w.handleNativePay(config, wechatConfig)
	}
}

func (w *WeChatPay) HandleCallback(c *gin.Context, gatewayConfig string) (*types.PayNotify, error) {

	wxpayConfig, err := getWeChatConfig(gatewayConfig)
	if err != nil {
		// 接收失败，返回4XX或5XX状态码以及应答报文
		c.JSON(http.StatusBadRequest, NotifyResponse{
			Code:    "FAIL",
			Message: err.Error(),
		})
		return nil, fmt.Errorf("WeChat params failed: %v", err)
	}
	certificateVisitor := downloader.MgrInstance().GetCertificateVisitor(wxpayConfig.MchID)
	handler := notify.NewNotifyHandler(wxpayConfig.MchAPIv3Key, verifiers.NewSHA256WithRSAVerifier(certificateVisitor))
	transaction := new(payments.Transaction)
	notifyReq, err := handler.ParseNotifyRequest(context.Background(), c.Request, transaction)
	// 如果验签未通过，或者解密失败
	if err != nil {
		// 接收失败，返回4XX或5XX状态码以及应答报文
		c.JSON(http.StatusBadRequest, NotifyResponse{
			Code:    "FAIL",
			Message: err.Error(),
		})
		return nil, fmt.Errorf("WeChat Signature verification failed: %v", err)
	}
	if notifyReq.EventType != "TRANSACTION.SUCCESS" {
		c.Status(http.StatusNoContent)
		return nil, fmt.Errorf("WeChat Transaction failed: %v", notifyReq.EventType)
	}
	if *transaction.TradeState != "SUCCESS" {
		c.Status(http.StatusNoContent)
		return nil, fmt.Errorf("tradeNo: %s, TransactionId: %s,  err: %v", transaction.OutTradeNo, transaction.TransactionId, err)
	}

	payNotify := &types.PayNotify{
		TradeNo:   *transaction.OutTradeNo,
		GatewayNo: *transaction.TransactionId,
	}
	c.Status(http.StatusNoContent)
	return payNotify, nil

}

func getWeChatConfig(gatewayConfig string) (*WeChatConfig, error) {
	var wechatConfig WeChatConfig
	if err := json.Unmarshal([]byte(gatewayConfig), &wechatConfig); err != nil {
		return nil, errors.New("config error")
	}

	return &wechatConfig, nil
}

func (w *WeChatPay) CreatedPay(_ string, _ *model.Payment) error {
	return nil
}
