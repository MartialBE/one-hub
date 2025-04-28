package router

import (
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"one-api/mcp"
	"one-api/middleware"
)

func SetMcpRouter(router *gin.Engine) {
	mcpServer := mcp.NewMcpServer()
	mcpServer.RegisterTools()

	mcpRouter := router.Group("/mcp")
	mcpRouter.Use(middleware.CORS())
	mcpRouter.Use(gzip.Gzip(gzip.DefaultCompression))
	mcpRouter.Use(middleware.UserAuth())
	mcpRouter.Use(middleware.ContextUserId())
	{
		mcpRouter.POST("/:accessToken", mcpServer.HandleStreamable)
		mcpRouter.GET("/sse/:accessToken", mcpServer.HandleSSE)
		mcpRouter.POST("/message/:accessToken", mcpServer.HandleMessage)
	}

	go func() {
		mcpServer.SSEServer.Run()
		mcpServer.StreamableServer.Run()
	}()

	//defer server.McpServer.Shutdown(context.Background())
}
