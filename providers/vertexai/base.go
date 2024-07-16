package vertexai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"one-api/common/cache"
	"one-api/common/logger"
	"one-api/common/requester"
	"one-api/common/utils"
	"one-api/model"
	"one-api/providers/base"
	"one-api/providers/vertexai/category"
	"one-api/types"
	"strings"
	"time"

	credentials "cloud.google.com/go/iam/credentials/apiv1"
	"cloud.google.com/go/iam/credentials/apiv1/credentialspb"
	"golang.org/x/net/proxy"
	"google.golang.org/api/option"
	"google.golang.org/grpc"
)

const TokenCacheKey = "api_token:vertexai"
const defaultScope = "https://www.googleapis.com/auth/cloud-platform"

type VertexAIProviderFactory struct{}

// 创建 VertexAIProvider
func (f VertexAIProviderFactory) Create(channel *model.Channel) base.ProviderInterface {
	vertexAIProvider := &VertexAIProvider{
		BaseProvider: base.BaseProvider{
			Config:    getConfig(),
			Channel:   channel,
			Requester: requester.NewHTTPRequester(*channel.Proxy, nil),
		},
	}

	getKeyConfig(vertexAIProvider)

	return vertexAIProvider
}

type VertexAIProvider struct {
	base.BaseProvider
	Region    string
	ProjectID string
	Category  *category.Category
}

func getConfig() base.ProviderConfig {
	return base.ProviderConfig{
		BaseURL:         "https://%s-aiplatform.googleapis.com/v1/projects/%s/locations/%s/publishers/google/models/%s:%s",
		ChatCompletions: "/",
	}
}

func getKeyConfig(vertexAI *VertexAIProvider) {
	keys := strings.Split(vertexAI.Channel.Other, "|")
	if len(keys) != 2 {
		return
	}

	vertexAI.Region = keys[0]
	vertexAI.ProjectID = keys[1]
}

func (p *VertexAIProvider) GetFullRequestURL(modelName string, other string) string {
	return fmt.Sprintf(p.GetBaseURL(), p.Region, p.ProjectID, p.Region, modelName, other)
}

func (p *VertexAIProvider) GetRequestHeaders() (headers map[string]string) {
	headers = make(map[string]string)
	p.CommonRequestHeaders(headers)

	token, err := p.GetToken()
	if err != nil {
		logger.SysError("Failed to get token: " + err.Error())
		return nil
	}

	headers["Authorization"] = "Bearer " + token

	return headers
}

func (p *VertexAIProvider) GetToken() (string, error) {
	cacheKey := fmt.Sprintf("%s:%s", TokenCacheKey, p.ProjectID)
	token, err := cache.GetCache[string](cacheKey)
	if err != nil {
		logger.SysError("Failed to get token from cache: " + err.Error())
	}

	if token != "" {
		return token, nil
	}

	creds := &Credentials{}
	if err := json.Unmarshal([]byte(p.Channel.Key), creds); err != nil {
		return "", fmt.Errorf("failed to unmarshal credentials: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if p.Channel.Proxy != nil && *p.Channel.Proxy != "" {
		ctx = context.WithValue(ctx, utils.ProxyAddrKey, *p.Channel.Proxy)
	}

	client, err := credentials.NewIamCredentialsClient(ctx, option.WithCredentialsJSON([]byte(p.Channel.Key)), option.WithGRPCDialOption(grpc.WithContextDialer(customDialer)))
	if err != nil {
		return "", fmt.Errorf("failed to create IAM credentials client: %w", err)
	}
	defer client.Close()

	req := &credentialspb.GenerateAccessTokenRequest{
		Name:  fmt.Sprintf("projects/-/serviceAccounts/%s", creds.ClientEmail),
		Scope: []string{defaultScope},
	}

	resp, err := client.GenerateAccessToken(ctx, req)
	if err != nil {
		return "", fmt.Errorf("failed to generate access token: %w", err)
	}

	duration := time.Until(resp.ExpireTime.AsTime())
	cache.SetCache(cacheKey, resp.AccessToken, duration)

	return resp.AccessToken, nil
}

func RequestErrorHandle(otherErr requester.HttpErrorHandler) requester.HttpErrorHandler {

	return func(resp *http.Response) *types.OpenAIError {
		requestBody, _ := io.ReadAll(resp.Body)
		resp.Body = io.NopCloser(bytes.NewBuffer(requestBody))

		if otherErr != nil {
			err := otherErr(resp)
			if err != nil {
				return err
			}
		}
		vertexaiErrors := &VertexaiErrors{}
		if err := json.Unmarshal(requestBody, vertexaiErrors); err == nil {
			if vertexaiError := vertexaiErrors.Error(); vertexaiError != nil {
				return errorHandle(vertexaiError)
			}
		} else {
			vertexaiError := &VertexaiError{}
			if err := json.Unmarshal(requestBody, vertexaiError); err == nil {
				return errorHandle(vertexaiError)
			}
		}

		return nil
	}
}

func errorHandle(vertexaiError *VertexaiError) *types.OpenAIError {
	if vertexaiError.Error.Message == "" {
		return nil
	}

	logger.SysError(fmt.Sprintf("VertexAI error: %s", vertexaiError.Error.Message))

	return &types.OpenAIError{
		Message: "VertexAI错误",
		Type:    "gemini_error",
		Param:   vertexaiError.Error.Status,
		Code:    vertexaiError.Error.Code,
	}
}

func customDialer(ctx context.Context, addr string) (net.Conn, error) {
	proxyAddress, ok := ctx.Value(utils.ProxyAddrKey).(string)
	if !ok || proxyAddress == "" {
		return net.Dial("tcp", addr)
	}

	proxyURL, err := url.Parse(proxyAddress)
	if err != nil {
		return nil, fmt.Errorf("error parsing proxy address: %w", err)
	}

	dialer := &net.Dialer{}

	dialerProxy, err := proxy.FromURL(proxyURL, dialer)
	if err != nil {
		return nil, fmt.Errorf("failed to create HTTP dialer: %v", err)
	}

	return dialerProxy.Dial("tcp", addr)
}
