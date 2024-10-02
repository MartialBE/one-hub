package stripe

type PayType string

type StripeConfig struct {
	SecretKey     string `json:"secret_key"`
	WebhookSecret string `json:"webhook_secret"`
}
