package alipay

type PayType string

var (
	FacePay PayType = "facepay" // 当面付
	PagePay PayType = "pagepay" // PC网页支付
	WapPay  PayType = "wappay"  // Wap网页支付

)

type PayArgs struct {
	AppID       string `json:"app_id"`
	OutTradeNo  string `json:"out_trade_no"`
	NotifyUrl   string `json:"notify_url"`
	ReturnUrl   string `json:"return_url"`
	Subject     string `json:"subject"`
	TotalAmount string `json:"total_amount"`
}

type PaymentResult struct {
	OutTradeNo  string `mapstructure:"out_trade_no"`
	TradeNo     string `mapstructure:"trade_no"`
	TotalAmount string `mapstructure:"total_amount"`
	TradeStatus string `mapstructure:"trade_status"`
}
