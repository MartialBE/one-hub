package limit

import (
	"time"
)

const (
	TokenBurstMultiplier = 10 // 令牌桶的突发流量倍数
	RPMThreshold         = 60 // RPM阈值
	window               = 1 * time.Minute
)

// NewAPILimiter 根据RPM创建合适的限流器
func NewAPILimiter(rpm int) RateLimiter {
	if rpm < RPMThreshold {
		return NewCountLimiter(rpm, rpm, window)
	}

	// 将RPM转换为每秒速率
	ratePerSecond := float64(rpm) / 60

	return NewCountLimiter(
		int(ratePerSecond),
		rpm,
		window,
	)
}

// GetMaxRate 获取限流器的最大速率（rpm）
func GetMaxRate(limiter RateLimiter) int {
	switch l := limiter.(type) {
	case *CountLimiter:
		return l.actualRate
	case *TokenLimiter:
		// 后续可能计算TPS/TPM 先保留
		return l.actualRate
	default:
		return 0
	}
}
