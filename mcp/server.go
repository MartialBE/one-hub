package mcp

import (
	"fmt"
	"github.com/ThinkInAIXYZ/go-mcp/protocol"
	"github.com/ThinkInAIXYZ/go-mcp/server"
	"github.com/ThinkInAIXYZ/go-mcp/transport"
	"github.com/gin-gonic/gin"
	"one-api/common/config"
	"one-api/common/logger"
	"one-api/mcp/tools"
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
	// 遍历注册所有工具
	for _, tool := range tools.McpTools {
		mcp.SSEServer.RegisterTool(tool.GetTool(), tool.HandleRequest)
		mcp.StreamableServer.RegisterTool(tool.GetTool(), tool.HandleRequest)
	}
	logger.SysLog("All MCP tools registered")
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
