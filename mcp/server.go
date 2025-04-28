package mcp

import (
	"fmt"
	"github.com/ThinkInAIXYZ/go-mcp/protocol"
	"github.com/gin-gonic/gin"
	"one-api/common/config"
	"one-api/common/logger"
	"one-api/mcp/tools/available_model"
	"one-api/mcp/tools/calculator"
	"one-api/mcp/tools/current_time"
	"one-api/mcp/tools/dashboard"

	"github.com/ThinkInAIXYZ/go-mcp/server"
	"github.com/ThinkInAIXYZ/go-mcp/transport"
)

type Server struct {
	SSEServer         *server.Server
	SSEHandler        *transport.SSEHandler
	StreamableServer  *server.Server
	StreamableHandler *transport.StreamableHTTPHandler
}

func NewMcpServer() *Server {
	messageEndpointURL := "/mcp/message"
	sseTransport, sseHandler, err := transport.NewSSEServerTransportAndHandler(messageEndpointURL)
	if err != nil {
		logger.SysLog(fmt.Sprintf("new mcp sse transport and hander with error: %v", err))
		return nil
	}
	streamableTransport, StreamableHandler, err := transport.NewStreamableHTTPServerTransportAndHandler()
	if err != nil {
		logger.SysLog(fmt.Sprintf("new mcp streamable http transport and hander with error: %v", err))
		return nil
	}
	sseServer, err := server.NewServer(sseTransport, server.WithServerInfo(protocol.Implementation{
		Name:    config.SystemName + "-MCP SERVER",
		Version: config.Version,
	}))
	if err != nil {
		logger.SysLog(fmt.Sprintf("new mcp sse server create error:%v", err))
		return nil
	}
	streamableServer, err := server.NewServer(streamableTransport, server.WithServerInfo(protocol.Implementation{
		Name:    config.SystemName + "-MCP SERVER",
		Version: config.Version,
	}))
	if err != nil {
		logger.SysLog(fmt.Sprintf("new mcp streamable http server create error:%v", err))
		return nil
	}
	return &Server{
		sseServer, sseHandler, streamableServer, StreamableHandler,
	}
}

// RegisterTools 注册所有MCP工具到服务器
func (mcp *Server) RegisterTools() {
	// 注册计算器工具
	calcTool := calculator.NewCalculator()
	mcp.SSEServer.RegisterTool(calcTool.GetTool(), calcTool.HandleRequest)
	mcp.StreamableServer.RegisterTool(calcTool.GetTool(), calcTool.HandleRequest)

	// 注册当前时间工具
	timeTool := current_time.NewCurrentTime()
	mcp.SSEServer.RegisterTool(timeTool.GetTool(), timeTool.HandleRequest)
	mcp.StreamableServer.RegisterTool(timeTool.GetTool(), timeTool.HandleRequest)

	availableModel := available_model.NewAvailableModel()
	mcp.SSEServer.RegisterTool(availableModel.GetTool(), availableModel.HandleRequest)
	mcp.StreamableServer.RegisterTool(availableModel.GetTool(), availableModel.HandleRequest)

	newDashboard := dashboard.NewDashboard()
	mcp.SSEServer.RegisterTool(newDashboard.GetTool(), newDashboard.HandleRequest)
	mcp.StreamableServer.RegisterTool(newDashboard.GetTool(), newDashboard.HandleRequest)

	logger.SysLog(" All MCP tools registered")
}

func (mcp *Server) HandleSSE(ctx *gin.Context) {
	mcp.SSEHandler.HandleSSE().ServeHTTP(ctx.Writer, ctx.Request)
}

func (mcp *Server) HandleStreamable(ctx *gin.Context) {
	mcp.StreamableHandler.HandleMCP().ServeHTTP(ctx.Writer, ctx.Request)
}

func (mcp *Server) HandleMessage(ctx *gin.Context) {
	mcp.SSEHandler.HandleMessage().ServeHTTP(ctx.Writer, ctx.Request)
}
