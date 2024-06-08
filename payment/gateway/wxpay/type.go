package wxpay

type PayType string

var (
	Native PayType = "Native" // Native支付
)

type NotifyResponse struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}
