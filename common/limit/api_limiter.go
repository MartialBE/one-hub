package limit

import (
	"one-api/common/config"
	"time"
)

const (
	TokenBurstMultiplier = 10 // 令牌桶的突发流量倍数
	RPMThreshold         = 60 // RPM阈值
	window               = 1 * time.Minute
)

// NewAPILimiter 根据RPM创建合适的限流器
// 固定窗口和滑动窗口比较
// 维度	        固定窗口	        滑动窗口（高并发内存占用大）
// 并发处理能力	高（简单计数器）	  中（需维护时间片）
// 限流准确性	  低（边界突刺）	    高（平滑控制）
// 实现复杂度	  低	            高
// 适用场景	对突刺不敏感的高吞吐场景	对流量敏感的关键业务场景
func NewAPILimiter(rpm int) RateLimiter {
	// 如果Redis未启用，使用内存限流器
	if !config.RedisEnabled {
		if rpm < RPMThreshold {
			// 对于低RPM，使用固定窗口方式
			return NewMemoryLimiter(rpm, rpm, window, false)
		} else {
			// 对于高RPM，使用令牌桶方式
			ratePerSecond := float64(rpm) / 60
			return NewMemoryLimiter(int(ratePerSecond), rpm, window, true)
		}
	}

	// Redis启用时，使用Redis限流器
	if rpm < RPMThreshold {
		// 如果是rpm设定值较小，说明并发较小，使用固定窗口
		return NewCountLimiter(rpm, rpm, window)
	}
	// 将RPM转换为每秒速率
	ratePerSecond := float64(rpm) / 60
	burst := int(ratePerSecond * TokenBurstMultiplier)
	return NewTokenLimiter(
		int(ratePerSecond),
		rpm,
		burst,
	)
	// 如果是rpm设定值较大，说明并发较大，限流敏感，使用滑动窗口灵活限流
	//return NewSlidingWindowLimiter(rpm, rpm, window)
}

// GetMaxRate 获取限流器的最大速率（rpm）
func GetMaxRate(limiter RateLimiter) int {
	switch l := limiter.(type) {
	case *CountLimiter:
		return l.rpm
	case *TokenLimiter:
		return l.rpm
	case *SlidingWindowLimiter:
		return l.rpm
	case *MemoryLimiter:
		return l.rpm
	default:
		return 0
	}
}
