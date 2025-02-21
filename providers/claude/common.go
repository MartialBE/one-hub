package claude

import (
	"one-api/common"
	"one-api/types"
	"strconv"
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

	usage.PromptTokensDetails.CachedWriteTokens = cUsage.CacheCreationInputTokens
	usage.PromptTokensDetails.CachedReadTokens = cUsage.CacheReadInputTokens

	usage.PromptTokens = cUsage.InputTokens
	usage.CompletionTokens = cUsage.OutputTokens
	usage.TotalTokens = usage.PromptTokens + usage.CompletionTokens

	return true
}

func ClaudeOutputUsage(response *ClaudeResponse) int {
	text := ""
	for _, c := range response.Content {
		if c.Type == "text" {
			text += c.Text
		}
	}

	return common.CountTokenText(text, response.Model)
}
