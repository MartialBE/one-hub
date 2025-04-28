// Package current_time 提供了一个获取当前时间的工具
// Package current_time provides a tool to get the current time
package current_time

import (
	"context"
	"fmt"
	"time"

	"github.com/ThinkInAIXYZ/go-mcp/protocol"
)

// CurrentTime 实现了当前时间工具
// CurrentTime implements a current time tool
type CurrentTime struct{}

type timeReq struct {
}

// NewCurrentTime 创建一个新的当前时间工具实例
// NewCurrentTime creates a new current time tool instance
func NewCurrentTime() *CurrentTime {
	return &CurrentTime{}
}

// GetTool 返回当前时间工具的定义
// GetTool returns the current time tool definition
func (c *CurrentTime) GetTool() *protocol.Tool {
	// 创建一个新的当前时间工具
	// Create a new current time tool
	currentTimeTool, _ := protocol.NewTool(
		"current_time",
		"获取当前日期时间",
		timeReq{},
	)

	return currentTimeTool
}

// HandleRequest 处理当前时间工具的请求
// HandleRequest handles current time tool requests
func (c *CurrentTime) HandleRequest(_ context.Context, _ *protocol.CallToolRequest) (*protocol.CallToolResult, error) {

	// 获取当前时间
	var currentTime time.Time
	currentTime = time.Now()

	// 根据格式返回时间
	var result string
	result = currentTime.Format("2006-01-02 15:04:05")

	// 返回时间结果
	// Return time result
	return &protocol.CallToolResult{
		Content: []protocol.Content{
			protocol.TextContent{
				Type: "text",
				Text: fmt.Sprintf("当前时间: %s", result),
			},
		},
	}, nil
}
