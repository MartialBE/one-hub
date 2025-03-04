package router

import (
	"one-api/middleware"
	"one-api/relay"
	"one-api/relay/midjourney"
	"one-api/relay/task"
	"one-api/relay/task/kling"
	"one-api/relay/task/suno"

	"github.com/gin-gonic/gin"
)

func SetRelayRouter(router *gin.Engine) {
	router.Use(middleware.CORS())
	// https://platform.openai.com/docs/api-reference/introduction
	setOpenAIRouter(router)
	setMJRouter(router)
	setSunoRouter(router)
	setClaudeRouter(router)
	setGeminiRouter(router)
	setRecraftRouter(router)
	setKlingRouter(router)
}

func setOpenAIRouter(router *gin.Engine) {
	modelsRouter := router.Group("/v1/models")
	modelsRouter.Use(middleware.OpenaiAuth(), middleware.Distribute())
	{
		modelsRouter.GET("", relay.ListModelsByToken)
		modelsRouter.GET("/:model", relay.RetrieveModel)
	}
	relayV1Router := router.Group("/v1")
	relayV1Router.Use(middleware.RelayPanicRecover(), middleware.OpenaiAuth(), middleware.Distribute(), middleware.DynamicRedisRateLimiter())
	{
		relayV1Router.POST("/completions", relay.Relay)
		relayV1Router.POST("/chat/completions", relay.Relay)
		// relayV1Router.POST("/edits", controller.Relay)
		relayV1Router.POST("/images/generations", relay.Relay)
		relayV1Router.POST("/images/edits", relay.Relay)
		relayV1Router.POST("/images/variations", relay.Relay)
		relayV1Router.POST("/embeddings", relay.Relay)
		// relayV1Router.POST("/engines/:model/embeddings", controller.RelayEmbeddings)
		relayV1Router.POST("/audio/transcriptions", relay.Relay)
		relayV1Router.POST("/audio/translations", relay.Relay)
		relayV1Router.POST("/audio/speech", relay.Relay)
		relayV1Router.POST("/moderations", relay.Relay)
		relayV1Router.POST("/rerank", relay.RelayRerank)
		relayV1Router.GET("/realtime", relay.ChatRealtime)

		relayV1Router.Use(middleware.SpecifiedChannel())
		{
			relayV1Router.Any("/files", relay.RelayOnly)
			relayV1Router.Any("/files/*any", relay.RelayOnly)
			relayV1Router.Any("/fine_tuning/*any", relay.RelayOnly)
			relayV1Router.Any("/assistants", relay.RelayOnly)
			relayV1Router.Any("/assistants/*any", relay.RelayOnly)
			relayV1Router.Any("/threads", relay.RelayOnly)
			relayV1Router.Any("/threads/*any", relay.RelayOnly)
			relayV1Router.Any("/batches/*any", relay.RelayOnly)
			relayV1Router.Any("/vector_stores/*any", relay.RelayOnly)
			relayV1Router.DELETE("/models/:model", relay.RelayOnly)
		}
	}
}

func setMJRouter(router *gin.Engine) {
	relayMjRouter := router.Group("/mj")
	registerMjRouterGroup(relayMjRouter)

	relayMjModeRouter := router.Group("/:mode/mj")
	registerMjRouterGroup(relayMjModeRouter)
}

// Author: Calcium-Ion
// GitHub: https://github.com/Calcium-Ion/new-api
// Path: router/relay-router.go
func registerMjRouterGroup(relayMjRouter *gin.RouterGroup) {
	relayMjRouter.GET("/image/:id", midjourney.RelayMidjourneyImage)
	relayMjRouter.Use(middleware.RelayMJPanicRecover(), middleware.MjAuth(), middleware.Distribute(), middleware.DynamicRedisRateLimiter())
	{
		relayMjRouter.POST("/submit/action", midjourney.RelayMidjourney)
		relayMjRouter.POST("/submit/shorten", midjourney.RelayMidjourney)
		relayMjRouter.POST("/submit/modal", midjourney.RelayMidjourney)
		relayMjRouter.POST("/submit/imagine", midjourney.RelayMidjourney)
		relayMjRouter.POST("/submit/change", midjourney.RelayMidjourney)
		relayMjRouter.POST("/submit/simple-change", midjourney.RelayMidjourney)
		relayMjRouter.POST("/submit/describe", midjourney.RelayMidjourney)
		relayMjRouter.POST("/submit/blend", midjourney.RelayMidjourney)
		relayMjRouter.POST("/notify", midjourney.RelayMidjourney)
		relayMjRouter.GET("/task/:id/fetch", midjourney.RelayMidjourney)
		relayMjRouter.GET("/task/:id/image-seed", midjourney.RelayMidjourney)
		relayMjRouter.POST("/task/list-by-condition", midjourney.RelayMidjourney)
		relayMjRouter.POST("/insight-face/swap", midjourney.RelayMidjourney)
		relayMjRouter.POST("/submit/upload-discord-images", midjourney.RelayMidjourney)
	}
}

func setSunoRouter(router *gin.Engine) {
	relaySunoRouter := router.Group("/suno")
	relaySunoRouter.Use(middleware.RelaySunoPanicRecover(), middleware.OpenaiAuth(), middleware.Distribute(), middleware.DynamicRedisRateLimiter())
	{
		relaySunoRouter.POST("/submit/:action", task.RelayTaskSubmit)
		relaySunoRouter.POST("/fetch", suno.GetFetch)
		relaySunoRouter.GET("/fetch/:id", suno.GetFetchByID)
	}
}

func setClaudeRouter(router *gin.Engine) {
	relayClaudeRouter := router.Group("/claude")
	relayV1Router := relayClaudeRouter.Group("/v1")
	relayV1Router.Use(middleware.APIEnabled("claude"), middleware.RelayCluadePanicRecover(), middleware.ClaudeAuth(), middleware.Distribute(), middleware.DynamicRedisRateLimiter())
	{
		relayV1Router.POST("/messages", relay.Relay)
	}
}

func setGeminiRouter(router *gin.Engine) {
	relayGeminiRouter := router.Group("/gemini")
	relayV1Router := relayGeminiRouter.Group("/v1beta")
	relayV1Router.Use(middleware.APIEnabled("gemini"), middleware.RelayGeminiPanicRecover(), middleware.GeminiAuth(), middleware.Distribute(), middleware.DynamicRedisRateLimiter())
	{
		relayV1Router.POST("/models/:model", relay.Relay)
	}
}

func setRecraftRouter(router *gin.Engine) {
	relayRecraftRouter := router.Group("/recraftAI/v1")
	relayRecraftRouter.Use(middleware.RelayPanicRecover(), middleware.OpenaiAuth(), middleware.Distribute(), middleware.DynamicRedisRateLimiter())
	{
		relayRecraftRouter.POST("/images/generations", relay.Relay)
		relayRecraftRouter.POST("/images/vectorize", relay.RelayRecraftAI)
		relayRecraftRouter.POST("/images/removeBackground", relay.RelayRecraftAI)
		relayRecraftRouter.POST("/images/clarityUpscale", relay.RelayRecraftAI)
		relayRecraftRouter.POST("/images/generativeUpscale", relay.RelayRecraftAI)
		relayRecraftRouter.POST("/styles", relay.RelayRecraftAI)
	}
}

func setKlingRouter(router *gin.Engine) {
	relayKlingRouter := router.Group("/kling")
	relayKlingRouter.Use(middleware.RelayKlingPanicRecover(), middleware.OpenaiAuth(), middleware.Distribute())
	relayKlingRouter.GET("/v1/videos/text2video/:id", kling.GetFetchByID)
	relayKlingRouter.GET("/v1/videos/image2video/:id", kling.GetFetchByID)

	relayKlingRouter.Use(middleware.DynamicRedisRateLimiter())
	{
		relayKlingRouter.POST("/v1/:class/:action", task.RelayTaskSubmit)
	}
}
