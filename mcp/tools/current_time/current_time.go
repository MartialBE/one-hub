// Package current_time 提供了一个获取当前时间的工具
// Package current_time provides a tool to get the current time
package current_time

import (
	"context"
	"fmt"
	"time"

	"github.com/ThinkInAIXYZ/go-mcp/protocol"
)

const NAME = "current_time"

// CurrentTime 实现了当前时间工
// CurrentTime 实现了当前时间工具
type CurrentTime struct{}

type timeQueryParam struct {
}

// GetTool 返回当前时间工具的定义
func (c *CurrentTime) GetTool() *protocol.Tool {
	currentTimeTool, _ := protocol.NewTool(
		NAME,
		"获取当前时间",
		timeQueryParam{},
	)

	return currentTimeTool
}

// HandleRequest 处理当前时间工具的请求
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
