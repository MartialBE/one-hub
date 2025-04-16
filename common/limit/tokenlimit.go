// Copyright (c) 2022 zeromicro

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

package limit

import (
	"context"
	_ "embed"
	"errors"
	"fmt"
	"one-api/common/logger"
	"one-api/common/redis"
	"strconv"
	"time"
)

const (
	tokenFormat     = "{%s}:tokens"
	timestampFormat = "{%s}:ts"
)

var (
	//go:embed tokenscript.lua
	tokenLuaScript string
	tokenScript    = redis.NewScript(tokenLuaScript)

	//go:embed tokengetscript.lua
	tokenGetLuaScript string
	tokenGetScript    = redis.NewScript(tokenGetLuaScript)
)

type TokenLimiter struct {
	rate       int
	actualRate int
	burst      int
}

// NewTokenLimiter returns a new TokenLimiter that allows events up to rate and permits
// bursts of at most burst tokens.
func NewTokenLimiter(rate, actualRate, burst int) *TokenLimiter {
	return &TokenLimiter{
		rate:       rate,
		actualRate: actualRate,
		burst:      burst,
	}
}

func (lim *TokenLimiter) Allow(keyPrefix string) bool {
	return lim.AllowN(keyPrefix, 1)
}

// AllowN reports whether n events may happen at time now.
// Use this method if you intend to drop / skip events that exceed the rate.
// Otherwise, use Reserve or Wait.
func (lim *TokenLimiter) AllowN(keyPrefix string, n int) bool {
	return lim.reserveN(context.Background(), keyPrefix, n)
}

// GetCurrentRate 获取当前速率使用情况，返回已使用的速率
func (lim *TokenLimiter) GetCurrentRate(keyPrefix string) (int, error) {
	tokenKey := fmt.Sprintf(tokenFormat, keyPrefix)
	timestampKey := fmt.Sprintf(timestampFormat, keyPrefix)

	resp, err := redis.ScriptRunCtx(context.Background(),
		tokenGetScript,
		[]string{
			tokenKey,
			timestampKey,
		},
		strconv.Itoa(lim.rate),
		strconv.Itoa(lim.burst),
		strconv.FormatInt(time.Now().Unix(), 10),
	)

	if errors.Is(err, redis.Nil) {
		return 0, nil
	}
	if err != nil {
		return 0, err
	}

	// 如果没有使用过令牌，则返回0
	if resp == nil {
		return 0, nil
	}

	currentTokens, ok := resp.(int64)
	if !ok {
		return 0, fmt.Errorf("无法转换令牌使用结果")
	}

	// 计算已使用的速率（总容量减去剩余令牌）
	// 如果currentTokens等于burst，表示没有消耗任何令牌
	if int(currentTokens) >= lim.burst {
		return 0, nil
	}

	usedTokens := lim.burst - int(currentTokens)

	// 返回每分钟的使用率
	return usedTokens * 60 / TokenBurstMultiplier, nil
}

func (lim *TokenLimiter) reserveN(ctx context.Context, keyPrefix string, n int) bool {
	tokenKey := fmt.Sprintf(tokenFormat, keyPrefix)
	timestampKey := fmt.Sprintf(timestampFormat, keyPrefix)

	resp, err := redis.ScriptRunCtx(ctx,
		tokenScript,
		[]string{
			tokenKey,
			timestampKey,
		},
		[]string{
			strconv.Itoa(lim.rate),
			strconv.Itoa(lim.burst),
			strconv.FormatInt(time.Now().Unix(), 10),
			strconv.Itoa(n),
		})
	// redis allowed == false
	// Lua boolean false -> r Nil bulk reply
	if errors.Is(err, redis.Nil) {
		return false
	}
	if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled) {
		logger.SysError(fmt.Sprintf("fail to use rate limiter: %s", err))
		return false
	}
	if err != nil {
		logger.SysError(fmt.Sprintf("fail to use rate limiter: %s, use in-process limiter for rescue", err))
		return false
	}

	code, ok := resp.(int64)
	if !ok {
		logger.SysError(fmt.Sprintf("fail to eval redis script: %v, use in-process limiter for rescue", resp))
		return false
	}

	// redis allowed == true
	// Lua boolean true -> r integer reply with value of 1
	return code == 1
}
