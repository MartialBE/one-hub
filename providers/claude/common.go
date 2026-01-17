package claude

import (
	"one-api/common"
	"one-api/types"
	"strconv"
	"strings"
)

func StringErrorWrapper(err string, code string, statusCode int, localError bool) *ClaudeErrorWithStatusCode {
	claudeError := ClaudeError{
		Type: "one_hub_error",
		ErrorInfo: ClaudeErrorInfo{
			Type:    code,
			Message: err,
		},
	}

	return &ClaudeErrorWithStatusCode{
		LocalError:  localError,
		StatusCode:  statusCode,
		ClaudeError: claudeError,
	}
}

func OpenaiErrToClaudeErr(err *types.OpenAIErrorWithStatusCode) *ClaudeErrorWithStatusCode {
	if err == nil {
		return nil
	}

	var typeStr string

	switch v := err.Code.(type) {
	case string:
		typeStr = v
	case int:
		typeStr = strconv.Itoa(v)
	default:
		typeStr = "unknown"
	}

	return &ClaudeErrorWithStatusCode{
		LocalError: err.LocalError,
		StatusCode: err.StatusCode,
		ClaudeError: ClaudeError{
			Type: typeStr,
			ErrorInfo: ClaudeErrorInfo{
				Type:    err.Type,
				Message: err.Message,
			},
		},
	}
}

func ErrorToClaudeErr(err error) *ClaudeError {
	if err == nil {
		return nil
	}
	return &ClaudeError{
		Type: "one_hub_error",
		ErrorInfo: ClaudeErrorInfo{
			Type:    "internal_error",
			Message: err.Error(),
		},
	}
}

func ClaudeUsageMerge(usage *Usage, mergeUsage *Usage) {
	if usage.InputTokens != mergeUsage.InputTokens {
		usage.InputTokens += mergeUsage.InputTokens
	}
	usage.OutputTokens += mergeUsage.OutputTokens
	usage.CacheCreationInputTokens += mergeUsage.CacheCreationInputTokens
	usage.CacheReadInputTokens += mergeUsage.CacheReadInputTokens
}

func ClaudeUsageToOpenaiUsage(cUsage *Usage, usage *types.Usage) bool {
	if usage == nil || cUsage == nil {
		return false
	}

	if cUsage.InputTokens == 0 || cUsage.OutputTokens == 0 {
		return false
	}

	// 设置缓存信息到内部字段（用于内部统计）
	usage.PromptTokensDetails.CachedWriteTokens = cUsage.CacheCreationInputTokens
	usage.PromptTokensDetails.CachedReadTokens = cUsage.CacheReadInputTokens
	usage.PromptTokensDetails.CachedTokens = cUsage.CacheReadInputTokens // cached_tokens 显示读取的缓存

	// 设置缓存信息到顶层字段（用于 API 响应）
	usage.CacheCreationInputTokens = cUsage.CacheCreationInputTokens
	usage.CacheReadInputTokens = cUsage.CacheReadInputTokens

	// 注意：根据 OpenAI 的格式，prompt_tokens 不包含缓存 tokens
	// 缓存 tokens 单独在顶层字段中显示
	usage.PromptTokens = cUsage.InputTokens
	usage.CompletionTokens = cUsage.OutputTokens
	// total_tokens 包含所有 tokens（包括缓存）
	usage.TotalTokens = cUsage.InputTokens + cUsage.OutputTokens + cUsage.CacheCreationInputTokens + cUsage.CacheReadInputTokens

	return true
}

func ClaudeOutputUsage(response *ClaudeResponse) int {
	var textMsg strings.Builder

	for _, c := range response.Content {
		if c.Type == "text" {
			textMsg.WriteString(c.Text + "\n")
		}
	}

	return common.CountTokenText(textMsg.String(), response.Model)
}
