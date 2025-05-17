package relay_util

import (
	"context"
	"net/http"
	"one-api/common/requester"
	"sync/atomic"
	"time"

	"github.com/bytedance/gopkg/util/gopool"
	"github.com/gin-gonic/gin"
)

const HeartbeatStreamText = "::PING\n\n"
const HeartbeatJsonText = "\n"

// 心跳配置
type HeartbeatConfig struct {
	TimeoutSeconds  int // 心跳超时时间（秒）
	IntervalSeconds int // 心跳间隔（秒）
}

// Heartbeat 心跳处理器
type Heartbeat struct {
	isStream   bool
	config     HeartbeatConfig
	ctx        context.Context
	cancel     context.CancelFunc
	stopped    int32 // 是否已停止
	headerSent int32 // 头部是否已发送
	c          *gin.Context
}

// NewHeartbeat 创建一个新的心跳处理器
func NewHeartbeat(isStream bool, config HeartbeatConfig, c *gin.Context) *Heartbeat {
	if config.IntervalSeconds < 5 {
		config.IntervalSeconds = 5 // 最低只能设置为5秒
	}

	ctx, cancel := context.WithCancel(context.Background())
	return &Heartbeat{
		isStream:   isStream,
		config:     config,
		ctx:        ctx,
		cancel:     cancel,
		stopped:    0,
		headerSent: 0,
		c:          c,
	}
}

// HasWrittenHeader 检查头部是否已写入
func (h *Heartbeat) HasWrittenHeader() bool {
	return atomic.LoadInt32(&h.headerSent) == 1
}

// writeHeader 立即写入头部，确保只写入一次
// 返回是否成功写入头部
func (h *Heartbeat) writeHeader() bool {
	// 如果已停止，不允许写入
	if atomic.LoadInt32(&h.stopped) == 1 {
		return false
	}

	// 如果已经写入，不再写入
	if !atomic.CompareAndSwapInt32(&h.headerSent, 0, 1) {
		return false
	}

	// 写入头部
	if h.isStream {
		requester.SetEventStreamHeaders(h.c)
	} else {
		h.c.Writer.Header().Set("Content-Type", "application/json")
		h.c.Writer.WriteHeader(http.StatusOK)
	}
	return true
}

// Start 启动心跳机制，在指定的超时时间后开始发送心跳
func (h *Heartbeat) Start() {
	// 如果已停止，不允许启动
	if atomic.LoadInt32(&h.stopped) == 1 {
		return
	}

	// 启动心跳协程
	gopool.Go(
		func() {
			// 等待超时时间后开始心跳
			timer := time.NewTimer(time.Duration(h.config.TimeoutSeconds) * time.Second)
			defer timer.Stop()

			select {
			case <-timer.C:
				// 检查是否已停止
				if atomic.LoadInt32(&h.stopped) == 1 {
					return
				}

				// 写入头部
				if !h.writeHeader() {
					return
				}

				// 超时后开始发送心跳
				ticker := time.NewTicker(time.Duration(h.config.IntervalSeconds) * time.Second)
				defer ticker.Stop()

				for {
					select {
					case <-h.ctx.Done():
						// 心跳被取消
						return
					case <-h.c.Request.Context().Done():
						// 客户端已断开
						h.Stop() // 确保停止
						return
					case <-ticker.C:
						// 检查是否已停止
						if atomic.LoadInt32(&h.stopped) == 1 {
							return
						}

						var err error
						// 发送心跳并处理错误
						if h.isStream {
							_, err = h.c.Writer.Write([]byte(HeartbeatStreamText))
						} else {
							_, err = h.c.Writer.Write([]byte(HeartbeatJsonText))
						}
						if err != nil {
							// 发生错误，停止心跳
							h.Stop()
							return
						}
						h.c.Writer.Flush()
					}
				}
			case <-h.ctx.Done():
				return
			case <-h.c.Request.Context().Done():
				// 客户端已断开
				h.Stop()
				return
			}
		})
}

// Close 关闭心跳（可以在defer中使用）
func (h *Heartbeat) Close() {
	h.Stop()
}

// Stop 停止心跳
func (h *Heartbeat) Stop() {
	// 如果已经停止，不再处理
	if !atomic.CompareAndSwapInt32(&h.stopped, 0, 1) {
		return
	}

	// 取消上下文
	h.cancel()
}

// IsSafeWriteStream 检查是否可以安全地写入Stream
func (h *Heartbeat) IsSafeWriteStream() bool {
	h.Stop()

	if h.isStream {
		return h.HasWrittenHeader()
	}

	return false
}
