package requester

import (
	"bufio"
	"bytes"
	"context"
	"fmt"
	"net/http"
	"one-api/common/logger"
	"one-api/types"
	"runtime/debug"

	"github.com/bytedance/gopkg/util/gopool"
)

var StreamClosed = []byte("stream_closed")

type HandlerPrefix[T streamable] func(rawLine *[]byte, dataChan chan T, errChan chan error)

type streamable interface {
	// types.ChatCompletionStreamResponse | types.CompletionResponse
	any
}

type StreamReaderInterface[T streamable] interface {
	Recv() (<-chan T, <-chan error)
	Close()
}

type streamReader[T streamable] struct {
	reader   *bufio.Reader
	response *http.Response
	NoTrim   bool

	handlerPrefix HandlerPrefix[T]

	DataChan  chan T
	ErrChan   chan error
	ctx       context.Context
	cancelCtx context.CancelFunc
	isClosed  bool
}

func NewStreamReader[T streamable](
	response *http.Response,
	handlerPrefix HandlerPrefix[T],
	noTrim bool,
) *streamReader[T] {
	ctx, cancel := context.WithCancel(context.Background())
	return &streamReader[T]{
		reader:        bufio.NewReader(response.Body),
		response:      response,
		NoTrim:        noTrim,
		handlerPrefix: handlerPrefix,
		DataChan:      make(chan T, 10),    // 添加缓冲区
		ErrChan:       make(chan error, 5), // 添加缓冲区以防止阻塞
		ctx:           ctx,
		cancelCtx:     cancel,
		isClosed:      false,
	}
}

func (stream *streamReader[T]) Recv() (<-chan T, <-chan error) {
	gopool.Go(func() {
		defer func() {

			if r := recover(); r != nil {
				logger.SysError(fmt.Sprintf("Panic in streamReader.processLines: %v", r))
				logger.SysError(fmt.Sprintf("stacktrace from panic: %s", string(debug.Stack())))

				// 使用非阻塞方式发送错误
				select {
				case stream.ErrChan <- &types.OpenAIError{
					Code:    "system error",
					Message: "stream processing panic",
					Type:    "system_error",
				}:
				case <-stream.ctx.Done():
				default:
					// 如果通道已满或已关闭，则忽略
				}
			}

			// 确保关闭流，防止资源泄漏
			stream.Close()
		}()

		stream.processLines()
	})

	return stream.DataChan, stream.ErrChan
}

//nolint:gocognit
func (stream *streamReader[T]) processLines() {
	for {
		select {
		case <-stream.ctx.Done():
			// 如果上下文已取消，停止处理
			return
		default:
			// 继续处理
		}

		rawLine, readErr := stream.reader.ReadBytes('\n')
		if readErr != nil {
			// 使用非阻塞方式发送错误，防止阻塞
			select {
			case stream.ErrChan <- readErr:
				// 错误发送成功
			case <-stream.ctx.Done():
				// 上下文已取消，不再发送错误
			default:
				// 通道已满或已关闭，记录日志但不阻塞
				logger.SysError(fmt.Sprintf("无法发送流错误: %v", readErr))
			}
			return
		}

		if !stream.NoTrim {
			rawLine = bytes.TrimSpace(rawLine)
			if len(rawLine) == 0 {
				continue
			}
		}

		// 处理行数据并检查上下文是否已取消
		select {
		case <-stream.ctx.Done():
			return
		default:
			stream.handlerPrefix(&rawLine, stream.DataChan, stream.ErrChan)

			if rawLine == nil {
				continue
			}

			if bytes.Equal(rawLine, StreamClosed) {
				return
			}
		}
	}
}

func (stream *streamReader[T]) Close() {
	// 避免重复关闭
	if stream.isClosed {
		return
	}
	stream.isClosed = true

	// 首先取消上下文，以停止所有阻塞的操作
	if stream.cancelCtx != nil {
		stream.cancelCtx()
	}

	// 关闭响应体
	if stream.response != nil && stream.response.Body != nil {
		stream.response.Body.Close()
	}

	// 安全地关闭通道
	close(stream.DataChan)
	close(stream.ErrChan)
}
