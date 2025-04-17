package limit

import (
	"context"
	_ "embed"
	"fmt"
	"one-api/common/redis"
	"time"
)

const (
	countFormat = "{%s}:count"
)

var (
	//go:embed countscript.lua
	countLuaScript string
	countScript    = redis.NewScript(countLuaScript)

	//go:embed countgetscript.lua
	countGetLuaScript string
	countGetScript    = redis.NewScript(countGetLuaScript)
)

type CountLimiter struct {
	rate   int
	rpm    int
	window time.Duration
}

func NewCountLimiter(rate int, rpm int, window time.Duration) *CountLimiter {
	return &CountLimiter{
		rate:   rate,
		rpm:    rpm,
		window: window,
	}
}

func (l *CountLimiter) Allow(keyPrefix string) bool {
	return l.AllowN(keyPrefix, 1)
}

func (l *CountLimiter) AllowN(keyPrefix string, n int) bool {
	return l.reserveN(context.Background(), keyPrefix, n)
}

func (l *CountLimiter) GetCurrentRate(keyPrefix string) (int, error) {
	countKey := fmt.Sprintf(countFormat, keyPrefix)

	result, err := redis.ScriptRunCtx(context.Background(),
		countGetScript,
		[]string{
			countKey,
		},
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

	// count是当前已经使用的请求数量
	return int(count), nil
}

func (l *CountLimiter) reserveN(ctx context.Context, keyPrefix string, n int) bool {
	countKey := fmt.Sprintf(countFormat, keyPrefix)

	result, err := redis.ScriptRunCtx(ctx,
		countScript,
		[]string{
			countKey,
		},
		l.rate,                  // ARGV[1]: rate
		int(l.window.Seconds()), // ARGV[2]: window size in seconds
		n,
	)

	if err != nil {
		return false
	}

	return result.(int64) == 1
}
