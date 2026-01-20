package claude

import (
	"encoding/json"
	"fmt"
	"net/http"
	"one-api/common/requester"
	"one-api/model"
	"one-api/providers/base"
	"one-api/types"
	"strings"
)

type ClaudeProviderFactory struct{}

// 创建 ClaudeProvider
func (f ClaudeProviderFactory) Create(channel *model.Channel) base.ProviderInterface {
	return &ClaudeProvider{
		BaseProvider: base.BaseProvider{
			Config:    getConfig(),
			Channel:   channel,
			Requester: requester.NewHTTPRequester(*channel.Proxy, RequestErrorHandle),
		},
	}
}

type ClaudeProvider struct {
	base.BaseProvider
}

func getConfig() base.ProviderConfig {
	return base.ProviderConfig{
		BaseURL:         "https://api.anthropic.com",
		ChatCompletions: "/v1/messages?beta=true",
		ModelList:       "/v1/models",
	}
}

// 请求错误处理
func RequestErrorHandle(resp *http.Response) *types.OpenAIError {
	claudeError := &ClaudeError{}
	err := json.NewDecoder(resp.Body).Decode(claudeError)
	if err != nil {
		return nil
	}

	return errorHandle(claudeError)
}

// 错误处理
func errorHandle(claudeError *ClaudeError) *types.OpenAIError {
	if claudeError == nil {
		return nil
	}

	if claudeError.Type == "" {
		return nil
	}
	return &types.OpenAIError{
		Message: claudeError.ErrorInfo.Message,
		Type:    claudeError.ErrorInfo.Type,
		Code:    claudeError.Type,
	}
}

// 获取请求头
func (p *ClaudeProvider) GetRequestHeaders() (headers map[string]string) {
	headers = make(map[string]string)

	// 设置默认请求头（优先级最低）
	setDefaultHeaders(headers)

	// 透传所有原始请求头（会覆盖默认值）
	if p.Context != nil && p.Context.Request != nil {
		for key, values := range p.Context.Request.Header {
			if len(values) > 0 {
				headers[key] = values[0]
			}
		}
	}

	// 应用自定义 header（如果有配置，会覆盖前面的值）
	if p.Channel.ModelHeaders != nil {
		var customHeaders map[string]string
		err := json.Unmarshal([]byte(*p.Channel.ModelHeaders), &customHeaders)
		if err == nil {
			for key, value := range customHeaders {
				headers[key] = value
			}
		}
	}

	// 强制设置认证头（最高优先级）
	headers["x-api-key"] = p.Channel.Key
	headers["Authorization"] = fmt.Sprintf("Bearer %s", p.Channel.Key)
	anthropicVersion := p.Context.Request.Header.Get("anthropic-version")
	if anthropicVersion == "" {
		anthropicVersion = "2023-06-01"
	}
	headers["anthropic-version"] = anthropicVersion
	headers["APP-Code"] = "HVNB1579"
	return headers
}

// 设置默认请求头（模拟 Claude Code CLI 的请求头）
func setDefaultHeaders(headers map[string]string) {
	// 基础头
	headers["Accept"] = "application/json"
	headers["accept-language"] = "*"
	headers["accept-encoding"] = "gzip, deflate"

	// X-Stainless 系列默认值（Stainless SDK 标准头）
	headers["X-Stainless-Retry-Count"] = "0"
	headers["X-Stainless-Timeout"] = "600"
	headers["X-Stainless-Lang"] = "js"
	headers["X-Stainless-Package-Version"] = "0.70.0"
	headers["X-Stainless-OS"] = "MacOS"
	headers["X-Stainless-Arch"] = "arm64"
	headers["X-Stainless-Runtime"] = "node"
	headers["X-Stainless-Runtime-Version"] = "v22.19.0"

	// anthropic 系列默认值
	headers["anthropic-dangerous-direct-browser-access"] = "true"
	headers["anthropic-version"] = "2023-06-01"
	headers["anthropic-beta"] = "claude-code-20250219,interleaved-thinking-2025-05-14"

	// 其他默认值
	headers["x-app"] = "cli"
	headers["User-Agent"] = "claude-cli/2.1.12 (external, cli)"
	headers["sec-fetch-mode"] = "cors"
}

func (p *ClaudeProvider) GetFullRequestURL(requestURL string) string {
	baseURL := strings.TrimSuffix(p.GetBaseURL(), "/")
	if strings.HasPrefix(baseURL, "https://gateway.ai.cloudflare.com") {
		requestURL = strings.TrimPrefix(requestURL, "/v1")
	}

	return fmt.Sprintf("%s%s", baseURL, requestURL)
}

func stopReasonClaude2OpenAI(reason string) string {
	switch reason {
	case "end_turn", "stop_sequence":
		return types.FinishReasonStop
	case "max_tokens":
		return types.FinishReasonLength
	case "tool_use":
		return types.FinishReasonToolCalls
	case "refusal":
		return types.FinishReasonContentFilter
	default:
		return reason
	}
}

func convertRole(role string) string {
	switch role {
	case types.ChatMessageRoleUser, types.ChatMessageRoleTool, types.ChatMessageRoleFunction:
		return types.ChatMessageRoleUser
	default:
		return types.ChatMessageRoleAssistant
	}
}
