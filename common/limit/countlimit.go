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
)

type CountLimiter struct {
	rate   int
	window time.Duration
}

func NewCountLimiter(rate int, window time.Duration) *CountLimiter {
	return &CountLimiter{
		rate:   rate,
		window: window,
	}
}

func (l *CountLimiter) Allow(keyPrefix string) bool {
	return l.AllowN(keyPrefix, 1)
}

func (l *CountLimiter) AllowN(keyPrefix string, n int) bool {
	return l.reserveN(context.Background(), keyPrefix, n)
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
