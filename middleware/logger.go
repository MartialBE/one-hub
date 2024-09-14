func GinzapWithConfig() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery
		
		// 获取所有请求参数
		var requestParams map[string]interface{}
		
		// 获取 URL 查询参数
		queryParams := c.Request.URL.Query()
		if len(queryParams) > 0 {
			requestParams = make(map[string]interface{})
			for key, values := range queryParams {
				if len(values) > 1 {
					requestParams[key] = values
				} else {
					requestParams[key] = values[0]
				}
			}
		}

		// 获取 POST 表单数据
		if c.Request.Method == "POST" || c.Request.Method == "PUT" {
			if err := c.Request.ParseForm(); err == nil {
				for key, values := range c.Request.PostForm {
					if len(values) > 1 {
						requestParams[key] = values
					} else {
						requestParams[key] = values[0]
					}
				}
			}
		}

		// 获取 JSON 数据
		var jsonParams map[string]interface{}
		if c.Request.Header.Get("Content-Type") == "application/json" {
			if err := c.ShouldBindJSON(&jsonParams); err == nil {
				for key, value := range jsonParams {
					requestParams[key] = value
				}
			}
		}

		c.Next()

		end := time.Now()
		latency := end.Sub(start)
		requestID := c.GetString(logger.RequestIdKey)
		userID := c.GetInt("id")

		fields := []zapcore.Field{
			zap.Int("status", c.Writer.Status()),
			zap.String("request_id", requestID),
			zap.String("method", c.Request.Method),
			zap.String("path", path),
			zap.String("query", query),
			zap.String("ip", c.ClientIP()),
			zap.String("user-agent", c.Request.UserAgent()),
			zap.Duration("latency", latency),
			zap.Int("user_id", userID),
			zap.String("original_model", c.GetString("original_model")),
			zap.String("new_model", c.GetString("new_model")),
			zap.Int("token_id", c.GetInt("token_id")),
			zap.String("token_name", c.GetString("token_name")),
			zap.Int("channel_id", c.GetInt("channel_id")),
			zap.Any("request_params", requestParams), // 添加请求参数
		}

		if len(c.Errors) > 0 {
			for _, e := range c.Errors.Errors() {
				logger.Logger.Error(e, fields...)
			}
		} else {
			logger.Logger.Info("GIN request", fields...)
		}
	}
}
