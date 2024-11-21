package limit

// RateLimiter 定义了限流器的通用接口
type RateLimiter interface {
	Allow(keyPrefix string) bool
	AllowN(keyPrefix string, n int) bool
}
