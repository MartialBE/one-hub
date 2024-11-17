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
		return NewCountLimiter(rpm, window)
	}

	// 将RPM转换为每秒速率
	ratePerSecond := float64(rpm) / 60
	burst := int(ratePerSecond * TokenBurstMultiplier)

	return NewTokenLimiter(
		int(ratePerSecond),
		burst,
	)
}
