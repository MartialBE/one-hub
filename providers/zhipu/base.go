package zhipu

import (
	"encoding/json"
	"fmt"
	"net/http"
	"one-api/common/cache"
	"one-api/common/logger"
	"one-api/common/requester"
	"one-api/model"
	"one-api/providers/base"
	"one-api/types"
	"strings"
	"time"

	"github.com/golang-jwt/jwt"
)

var expSeconds int64 = 24 * 3600

var zhiPuCacheKey = "api_token:zhipu"

type ZhipuProviderFactory struct{}

// 创建 ZhipuProvider
func (f ZhipuProviderFactory) Create(channel *model.Channel) base.ProviderInterface {
	return &ZhipuProvider{
		BaseProvider: base.BaseProvider{
			Config:    getConfig(),
			Channel:   channel,
			Requester: requester.NewHTTPRequester(*channel.Proxy, requestErrorHandle),
		},
	}
}

type ZhipuProvider struct {
	base.BaseProvider
}

func getConfig() base.ProviderConfig {
	return base.ProviderConfig{
		BaseURL:           "https://open.bigmodel.cn/api/paas/v4",
		ChatCompletions:   "/chat/completions",
		Embeddings:        "/embeddings",
		ImagesGenerations: "/images/generations",
	}
}

// 请求错误处理
func requestErrorHandle(resp *http.Response) *types.OpenAIError {
	zhipuError := &ZhipuResponseError{}
	err := json.NewDecoder(resp.Body).Decode(zhipuError)
	if err != nil {
		return nil
	}

	return errorHandle(&zhipuError.Error)
}

// 错误处理
func errorHandle(zhipuError *ZhipuError) *types.OpenAIError {
	if zhipuError.Message == "" {
		return nil
	}
	return &types.OpenAIError{
		Message: zhipuError.Message,
		Type:    "zhipu_error",
		Code:    zhipuError.Code,
	}
}

// 获取请求头
func (p *ZhipuProvider) GetRequestHeaders() (headers map[string]string) {
	headers = make(map[string]string)
	p.CommonRequestHeaders(headers)
	headers["Authorization"] = p.getZhipuToken()
	return headers
}

// 获取完整请求 URL
func (p *ZhipuProvider) GetFullRequestURL(requestURL string) string {
	baseURL := strings.TrimSuffix(p.GetBaseURL(), "/")

	return fmt.Sprintf("%s%s", baseURL, requestURL)
}

func (p *ZhipuProvider) getZhipuToken() string {
	cacheKey := fmt.Sprintf("%s:%d", zhiPuCacheKey, p.Channel.Id)
	tokenStr, err := cache.GetCache[string](cacheKey)
	if err != nil {
		logger.SysError("get zhipu token error: " + err.Error())
	}

	if tokenStr != "" {
		return tokenStr
	}

	apikey := p.Channel.Key
	split := strings.Split(apikey, ".")
	if len(split) != 2 {
		logger.SysError("invalid zhipu key: " + apikey)
		return ""
	}

	id := split[0]
	secret := split[1]

	expMillis := time.Now().Add(time.Duration(expSeconds)*time.Second).UnixNano() / 1e6

	timestamp := time.Now().UnixNano() / 1e6

	payload := jwt.MapClaims{
		"api_key":   id,
		"exp":       expMillis,
		"timestamp": timestamp,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, payload)

	token.Header["alg"] = "HS256"
	token.Header["sign_type"] = "SIGN"

	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return ""
	}

	cache.SetCache(cacheKey, tokenString, time.Duration(expSeconds)*time.Second)

	return tokenString
}

func convertRole(roleName string) string {
	switch roleName {
	case types.ChatMessageRoleFunction:
		return types.ChatMessageRoleTool
	case types.ChatMessageRoleTool, types.ChatMessageRoleSystem, types.ChatMessageRoleAssistant:
		return roleName
	default:
		return types.ChatMessageRoleUser
	}
}
