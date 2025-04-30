package tools

import (
	"context"
	"github.com/ThinkInAIXYZ/go-mcp/protocol"
	"one-api/mcp/tools/available_model"
	"one-api/mcp/tools/calculator"
	"one-api/mcp/tools/current_time"
	"one-api/mcp/tools/dashboard"
)

type McpTool interface {
	GetTool() *protocol.Tool
	HandleRequest(ctx context.Context, req *protocol.CallToolRequest) (*protocol.CallToolResult, error)
}

var McpTools = make(map[string]McpTool)

func init() {
	McpTools[calculator.NAME] = &calculator.Calculator{}
	McpTools[available_model.NAME] = &available_model.AvailableModel{}
	McpTools[dashboard.NAME] = &dashboard.Dashboard{}
	McpTools[current_time.NAME] = &current_time.CurrentTime{}
}
