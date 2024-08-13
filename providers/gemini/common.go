package gemini

import (
	"one-api/types"
)

func StringErrorWrapper(err string, code string, statusCode int, localError bool) *GeminiErrorWithStatusCode {
	geminiError := GeminiErrorResponse{
		ErrorInfo: &GeminiError{
			Code:    500,
			Status:  code,
			Message: err,
		},
	}

	return &GeminiErrorWithStatusCode{
		LocalError:          localError,
		StatusCode:          statusCode,
		GeminiErrorResponse: geminiError,
	}
}

func OpenaiErrToGeminiErr(err *types.OpenAIErrorWithStatusCode) *GeminiErrorWithStatusCode {
	if err == nil {
		return nil
	}

	return &GeminiErrorWithStatusCode{
		LocalError: err.LocalError,
		StatusCode: err.StatusCode,
		GeminiErrorResponse: GeminiErrorResponse{
			ErrorInfo: &GeminiError{
				Code:    err.StatusCode,
				Status:  err.Type,
				Message: err.Message,
			},
		},
	}
}

func ErrorToGeminiErr(err error) *GeminiErrorResponse {
	if err == nil {
		return nil
	}
	return &GeminiErrorResponse{
		ErrorInfo: &GeminiError{
			Code:    500,
			Status:  "internal_error",
			Message: err.Error(),
		},
	}
}
