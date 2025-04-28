package router

import (
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"one-api/common/logger"
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
		err := mcpServer.SSEServer.Run()
		if err != nil {
			logger.SysError("mcp sse server error: " + err.Error())
			return
		}
		err = mcpServer.StreamableServer.Run()
		if err != nil {
			logger.SysError("mcp streamable server error: " + err.Error())
			return
		}
	}()

}
