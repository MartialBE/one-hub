package kling

import (
	"encoding/json"
	"fmt"
	"net/http"
	"one-api/common/requester"
	"one-api/model"
	"one-api/providers/base"
	"one-api/types"
	"strings"
	"time"

	"github.com/golang-jwt/jwt"
)

// 定义供应商工厂
type KlingProviderFactory struct{}

// 创建 KlingProvider
func (f KlingProviderFactory) Create(channel *model.Channel) base.ProviderInterface {
	return &KlingProvider{
		BaseProvider: base.BaseProvider{
			Config:    getConfig(),
			Channel:   channel,
			Requester: requester.NewHTTPRequester(*channel.Proxy, RequestErrorHandle),
		},
		Generations: "/v1/%s/%s",    // POST
		Fetch:       "/v1/%s/%s/%s", // GET
		Fetchs:      "/v1/%s/%s",    // GET
	}
}

func getConfig() base.ProviderConfig {
	return base.ProviderConfig{
		BaseURL: "https://api.klingai.com",
	}
}

type KlingProvider struct {
	base.BaseProvider
	Generations string
	Fetch       string
	Fetchs      string
}

func (p *KlingProvider) GetRequestHeaders() (headers map[string]string) {
	headers = make(map[string]string)
	p.CommonRequestHeaders(headers)
	if p.Channel.Key != "" {
		authorization := ""
		keys := strings.Split(p.Channel.Key, "|")
		if len(keys) < 2 {
			authorization = p.Channel.Key
		} else {
			accessKey := keys[0]
			secretKey := keys[1]
			token, err := p.GenerateJWTToken(accessKey, secretKey)
			if err != nil {
				authorization = p.Channel.Key
			} else {
				authorization = token
			}
		}
		headers["Authorization"] = fmt.Sprintf("Bearer %s", authorization)
	}
	return headers
}

// 请求错误处理
func RequestErrorHandle(resp *http.Response) *types.OpenAIError {
	errorResponse := &KlingResponse[any]{}
	err := json.NewDecoder(resp.Body).Decode(errorResponse)
	if err != nil {
		return nil
	}

	return ErrorHandle(errorResponse)
}

// 错误处理
func ErrorHandle(err *KlingResponse[any]) *types.OpenAIError {
	if err.Code == 0 {
		return nil
	}

	return &types.OpenAIError{
		Code:    err.Code,
		Message: err.Message,
		Type:    "Kling_error",
	}
}

func (p *KlingProvider) GenerateJWTToken(accessKey string, secretKey string) (string, error) {
	// 创建token
	token := jwt.New(jwt.SigningMethodHS256)

	// 设置header
	token.Header["typ"] = "JWT"
	token.Header["alg"] = "HS256"

	// 设置payload
	claims := token.Claims.(jwt.MapClaims)
	now := time.Now()
	claims["iss"] = accessKey
	claims["exp"] = now.Add(30 * time.Minute).Unix()
	claims["nbf"] = now.Add(-5 * time.Second).Unix()

	// 签名并获取完整的编码后的字符串token
	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		return "", fmt.Errorf("生成token失败: %v", err)
	}

	return tokenString, nil
}
