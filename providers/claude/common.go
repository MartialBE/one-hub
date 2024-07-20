package claude

import (
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

func ClaudeUsageToOpenaiUsage(cUsage *Usage, usage *types.Usage) {
	if usage == nil || cUsage == nil {
		return
	}

	usage.PromptTokens = cUsage.InputTokens
	usage.CompletionTokens = cUsage.OutputTokens
	usage.TotalTokens = cUsage.InputTokens + cUsage.OutputTokens
}
