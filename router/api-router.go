package router

import (
	"one-api/controller"
	"one-api/middleware"
	"one-api/relay"

	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func SetApiRouter(router *gin.Engine) {
	apiRouter := router.Group("/api")
	apiRouter.GET("/metrics", middleware.MetricsWithBasicAuth(), gin.WrapH(promhttp.Handler()))

	apiRouter.Use(gzip.Gzip(gzip.DefaultCompression))
	apiRouter.POST("/telegram/:token", middleware.Telegram(), controller.TelegramBotWebHook)
	apiRouter.Use(middleware.GlobalAPIRateLimit())
	{
		apiRouter.GET("/image/:id", controller.CheckImg)
		apiRouter.GET("/status", controller.GetStatus)
		apiRouter.GET("/notice", controller.GetNotice)
		apiRouter.GET("/about", controller.GetAbout)
		apiRouter.GET("/prices", middleware.PricesAuth(), middleware.CORS(), controller.GetPricesList)
		apiRouter.GET("/ownedby", relay.GetModelOwnedBy)
		apiRouter.GET("/available_model", middleware.CORS(), middleware.TrySetUserBySession(), relay.AvailableModel)
		apiRouter.GET("/user_group_map", middleware.TrySetUserBySession(), controller.GetUserGroupRatio)
		apiRouter.GET("/home_page_content", controller.GetHomePageContent)
		apiRouter.GET("/verification", middleware.CriticalRateLimit(), middleware.TurnstileCheck(), controller.SendEmailVerification)
		apiRouter.GET("/reset_password", middleware.CriticalRateLimit(), middleware.TurnstileCheck(), controller.SendPasswordResetEmail)
		apiRouter.POST("/user/reset", middleware.CriticalRateLimit(), controller.ResetPassword)
		apiRouter.GET("/oauth/github", middleware.CriticalRateLimit(), controller.GitHubOAuth)
		apiRouter.GET("/oauth/lark", middleware.CriticalRateLimit(), controller.LarkOAuth)
		apiRouter.GET("/oauth/state", middleware.CriticalRateLimit(), controller.GenerateOAuthCode)
		apiRouter.GET("/oauth/wechat", middleware.CriticalRateLimit(), controller.WeChatAuth)
		apiRouter.GET("/oauth/wechat/bind", middleware.CriticalRateLimit(), middleware.UserAuth(), controller.WeChatBind)
		apiRouter.GET("/oauth/email/bind", middleware.CriticalRateLimit(), middleware.UserAuth(), controller.EmailBind)

		apiRouter.GET("/oauth/endpoint", middleware.CriticalRateLimit(), controller.OIDCEndpoint)
		apiRouter.GET("/oauth/oidc", middleware.CriticalRateLimit(), controller.OIDCAuth)

		apiRouter.Any("/payment/notify/:uuid", controller.PaymentCallback)

		userRoute := apiRouter.Group("/user")
		{
			userRoute.POST("/register", middleware.CriticalRateLimit(), middleware.TurnstileCheck(), controller.Register)
			userRoute.POST("/login", middleware.CriticalRateLimit(), controller.Login)
			userRoute.GET("/logout", controller.Logout)

			selfRoute := userRoute.Group("/")
			selfRoute.Use(middleware.UserAuth())
			{
				selfRoute.GET("/dashboard", controller.GetUserDashboard)
				selfRoute.GET("/self", controller.GetSelf)
				selfRoute.PUT("/self", controller.UpdateSelf)
				// selfRoute.DELETE("/self", controller.DeleteSelf)
				selfRoute.GET("/token", controller.GenerateAccessToken)
				selfRoute.GET("/aff", controller.GetAffCode)
				selfRoute.POST("/topup", controller.TopUp)
				selfRoute.GET("/payment", controller.GetUserPaymentList)
				selfRoute.POST("/order", controller.CreateOrder)
				selfRoute.GET("/order/status", controller.CheckOrderStatus)
			}

			adminRoute := userRoute.Group("/")
			adminRoute.Use(middleware.AdminAuth())
			{
				adminRoute.GET("/", controller.GetUsersList)
				adminRoute.GET("/:id", controller.GetUser)
				adminRoute.POST("/", controller.CreateUser)
				adminRoute.POST("/manage", controller.ManageUser)
				adminRoute.POST("/quota/:id", controller.ChangeUserQuota)
				adminRoute.PUT("/", controller.UpdateUser)
				adminRoute.DELETE("/:id", controller.DeleteUser)
			}
		}
		optionRoute := apiRouter.Group("/option")
		optionRoute.Use(middleware.RootAuth())
		{
			optionRoute.GET("/", controller.GetOptions)
			optionRoute.PUT("/", controller.UpdateOption)
			optionRoute.GET("/telegram", controller.GetTelegramMenuList)
			optionRoute.POST("/telegram", controller.AddOrUpdateTelegramMenu)
			optionRoute.GET("/telegram/status", controller.GetTelegramBotStatus)
			optionRoute.PUT("/telegram/reload", controller.ReloadTelegramBot)
			optionRoute.GET("/telegram/:id", controller.GetTelegramMenu)
			optionRoute.DELETE("/telegram/:id", controller.DeleteTelegramMenu)
		}

		modelOwnedByRoute := apiRouter.Group("/model_ownedby")
		modelOwnedByRoute.GET("/", controller.GetAllModelOwnedBy)
		modelOwnedByRoute.Use(middleware.AdminAuth())
		{
			modelOwnedByRoute.GET("/:id", controller.GetModelOwnedBy)
			modelOwnedByRoute.POST("/", controller.CreateModelOwnedBy)
			modelOwnedByRoute.PUT("/", controller.UpdateModelOwnedBy)
			modelOwnedByRoute.DELETE("/:id", controller.DeleteModelOwnedBy)
		}

		userGroup := apiRouter.Group("/user_group")
		userGroup.Use(middleware.AdminAuth())
		{
			userGroup.GET("/", controller.GetUserGroups)
			userGroup.GET("/:id", controller.GetUserGroupById)
			userGroup.POST("/", controller.AddUserGroup)
			userGroup.PUT("/enable/:id", controller.ChangeUserGroupEnable)
			userGroup.PUT("/", controller.UpdateUserGroup)
			userGroup.DELETE("/:id", controller.DeleteUserGroup)

		}
		channelRoute := apiRouter.Group("/channel")
		channelRoute.Use(middleware.AdminAuth())
		{
			channelRoute.GET("/", controller.GetChannelsList)
			channelRoute.GET("/models", relay.ListModelsForAdmin)
			channelRoute.POST("/provider_models_list", controller.GetModelList)
			channelRoute.GET("/:id", controller.GetChannel)
			channelRoute.GET("/test", controller.TestAllChannels)
			channelRoute.GET("/test/:id", controller.TestChannel)
			channelRoute.GET("/update_balance", controller.UpdateAllChannelsBalance)
			channelRoute.GET("/update_balance/:id", controller.UpdateChannelBalance)
			channelRoute.POST("/", controller.AddChannel)
			channelRoute.PUT("/", controller.UpdateChannel)
			channelRoute.PUT("/batch/azure_api", controller.BatchUpdateChannelsAzureApi)
			channelRoute.PUT("/batch/del_model", controller.BatchDelModelChannels)
			channelRoute.DELETE("/disabled", controller.DeleteDisabledChannel)
			channelRoute.DELETE("/:id/tag", controller.DeleteChannelTag)
			channelRoute.DELETE("/:id", controller.DeleteChannel)
		}
		channelTagRoute := apiRouter.Group("/channel_tag")
		channelTagRoute.Use(middleware.AdminAuth())
		{
			channelTagRoute.GET("/_all", controller.GetChannelsTagAllList)
			channelTagRoute.GET("/", controller.GetChannelsTagList)
			channelTagRoute.GET("/:tag", controller.GetChannelsTag)
			channelTagRoute.PUT("/:tag", controller.UpdateChannelsTag)
			channelTagRoute.DELETE("/:tag", controller.DeleteChannelsTag)

		}

		tokenRoute := apiRouter.Group("/token")
		tokenRoute.Use(middleware.UserAuth())
		{
			tokenRoute.GET("/playground", controller.GetPlaygroundToken)
			tokenRoute.GET("/", controller.GetUserTokensList)
			tokenRoute.GET("/:id", controller.GetToken)
			tokenRoute.POST("/", controller.AddToken)
			tokenRoute.PUT("/", controller.UpdateToken)
			tokenRoute.DELETE("/:id", controller.DeleteToken)
		}
		redemptionRoute := apiRouter.Group("/redemption")
		redemptionRoute.Use(middleware.AdminAuth())
		{
			redemptionRoute.GET("/", controller.GetRedemptionsList)
			redemptionRoute.GET("/:id", controller.GetRedemption)
			redemptionRoute.POST("/", controller.AddRedemption)
			redemptionRoute.PUT("/", controller.UpdateRedemption)
			redemptionRoute.DELETE("/:id", controller.DeleteRedemption)
		}
		logRoute := apiRouter.Group("/log")
		logRoute.GET("/", middleware.AdminAuth(), controller.GetLogsList)
		logRoute.DELETE("/", middleware.AdminAuth(), controller.DeleteHistoryLogs)
		logRoute.GET("/stat", middleware.AdminAuth(), controller.GetLogsStat)
		logRoute.GET("/self/stat", middleware.UserAuth(), controller.GetLogsSelfStat)
		// logRoute.GET("/search", middleware.AdminAuth(), controller.SearchAllLogs)
		logRoute.GET("/self", middleware.UserAuth(), controller.GetUserLogsList)
		// logRoute.GET("/self/search", middleware.UserAuth(), controller.SearchUserLogs)
		groupRoute := apiRouter.Group("/group")
		groupRoute.Use(middleware.AdminAuth())
		{
			groupRoute.GET("/", controller.GetGroups)
		}

		analyticsRoute := apiRouter.Group("/analytics")
		analyticsRoute.Use(middleware.AdminAuth())
		{
			analyticsRoute.GET("/statistics", controller.GetStatisticsDetail)
			analyticsRoute.GET("/period", controller.GetStatisticsByPeriod)
		}

		pricesRoute := apiRouter.Group("/prices")
		pricesRoute.Use(middleware.AdminAuth())
		{
			pricesRoute.GET("/model_list", controller.GetAllModelList)
			pricesRoute.POST("/single", controller.AddPrice)
			pricesRoute.PUT("/single/*model", controller.UpdatePrice)
			pricesRoute.DELETE("/single/*model", controller.DeletePrice)
			pricesRoute.POST("/multiple", controller.BatchSetPrices)
			pricesRoute.PUT("/multiple/delete", controller.BatchDeletePrices)
			pricesRoute.POST("/sync", controller.SyncPricing)

		}

		paymentRoute := apiRouter.Group("/payment")
		paymentRoute.Use(middleware.AdminAuth())
		{
			paymentRoute.GET("/order", controller.GetOrderList)
			paymentRoute.GET("/", controller.GetPaymentList)
			paymentRoute.GET("/:id", controller.GetPayment)
			paymentRoute.POST("/", controller.AddPayment)
			paymentRoute.PUT("/", controller.UpdatePayment)
			paymentRoute.DELETE("/:id", controller.DeletePayment)
		}

		mjRoute := apiRouter.Group("/mj")
		mjRoute.GET("/self", middleware.UserAuth(), controller.GetUserMidjourney)
		mjRoute.GET("/", middleware.AdminAuth(), controller.GetAllMidjourney)

		taskRoute := apiRouter.Group("/task")
		taskRoute.GET("/self", middleware.UserAuth(), controller.GetUserAllTask)
		taskRoute.GET("/", middleware.AdminAuth(), controller.GetAllTask)
	}

	sseRouter := router.Group("/api/sse")
	sseRouter.Use(middleware.GlobalAPIRateLimit())
	{
		sseRouter.POST("/channel/check", middleware.AdminAuth(), controller.CheckChannel)
	}

}
