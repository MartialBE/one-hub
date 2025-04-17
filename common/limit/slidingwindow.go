package limit

import (
	"context"
	_ "embed"
	"fmt"
	"one-api/common/redis"
	"time"
)

const (
	slidingWindowFormat = "{%s}:sliding"
)

var (
	//go:embed slidingwindow.lua
	slidingWindowLuaScript string
	slidingWindowScript    = redis.NewScript(slidingWindowLuaScript)

	//go:embed slidingwindowget.lua
	slidingWindowGetLuaScript string
	slidingWindowGetScript    = redis.NewScript(slidingWindowGetLuaScript)
)

// SlidingWindowLimiter 滑动窗口限流器
type SlidingWindowLimiter struct {
	rate   int           // 最大请求速率
	rpm    int           // 系统设置的RPM阈值
	window time.Duration // 窗口大小
}

// NewSlidingWindowLimiter 创建新的滑动窗口限流器
func NewSlidingWindowLimiter(rate int, rpm int, window time.Duration) *SlidingWindowLimiter {
	return &SlidingWindowLimiter{
		rate:   rate,
		rpm:    rpm,
		window: window,
	}
}

// Allow 检查是否允许一个请求通过
func (l *SlidingWindowLimiter) Allow(keyPrefix string) bool {
	return l.AllowN(keyPrefix, 1)
}

// AllowN 检查是否允许n个请求通过
func (l *SlidingWindowLimiter) AllowN(keyPrefix string, n int) bool {
	return l.reserveN(context.Background(), keyPrefix, n)
}

// GetCurrentRate 获取当前速率
func (l *SlidingWindowLimiter) GetCurrentRate(keyPrefix string) (int, error) {
	slidingKey := fmt.Sprintf(slidingWindowFormat, keyPrefix)
	nowSec := time.Now().Unix()

	result, err := redis.ScriptRunCtx(
		context.Background(),
		slidingWindowGetScript,
		[]string{slidingKey},
		int(l.window.Seconds()), // ARGV[1]: 窗口大小（秒）
		nowSec,                  // ARGV[2]: 当前时间戳
	)

	if err != nil {
		return 0, err
	}

	// 如果是redis.Nil错误，表示计数不存在，已用速率为0
	if result == nil {
		return 0, nil
	}

	count, ok := result.(int64)
	if !ok {
		return 0, fmt.Errorf("无法转换计数结果")
	}

	return int(count), nil
}

// reserveN 预留N个请求位置
func (l *SlidingWindowLimiter) reserveN(ctx context.Context, keyPrefix string, n int) bool {
	slidingKey := fmt.Sprintf(slidingWindowFormat, keyPrefix)
	nowSec := time.Now().Unix()

	result, err := redis.ScriptRunCtx(
		ctx,
		slidingWindowScript,
		[]string{slidingKey},
		l.rate,                  // ARGV[1]: 最大速率限制
		int(l.window.Seconds()), // ARGV[2]: 窗口大小（秒）
		nowSec,                  // ARGV[3]: 当前时间戳
		n,                       // ARGV[4]: 增加的请求数
	)

	if err != nil {
		return false
	}

	resultArray, ok := result.([]interface{})
	if !ok || len(resultArray) < 1 {
		return false
	}

	allowed, ok := resultArray[0].(int64)
	if !ok {
		return false
	}

	return allowed == 1
}
