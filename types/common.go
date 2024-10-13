package types

import "encoding/json"

type Usage struct {
	PromptTokens            int                      `json:"prompt_tokens"`
	CompletionTokens        int                      `json:"completion_tokens,omitempty"`
	TotalTokens             int                      `json:"total_tokens"`
	PromptTokensDetails     *PromptTokensDetails     `json:"prompt_tokens_details,omitempty"`
	CompletionTokensDetails *CompletionTokensDetails `json:"completion_tokens_details,omitempty"`

	SysTokensDetails SysTokensDetails `json:"-"`
}

type PromptTokensDetails struct {
	AudioTokens  int `json:"audio_tokens,omitempty"`
	CachedTokens int `json:"cached_tokens,omitempty"`
}

type CompletionTokensDetails struct {
	AudioTokens     int `json:"audio_tokens,omitempty"`
	ReasoningTokens int `json:"reasoning_tokens,omitempty"`
}

type SysTokensDetails struct {
	CachedTokens      int `json:"cached_tokens,omitempty"`
	InputAudioTokens  int `json:"input_audio_tokens,omitempty"`
	InputTextTokens   int `json:"input_text_tokens,omitempty"`
	OutputAudioTokens int `json:"output_audio_tokens,omitempty"`
	OutputTextTokens  int `json:"output_text_tokens,omitempty"`
}

type OpenAIError struct {
	Code       any    `json:"code,omitempty"`
	Message    string `json:"message"`
	Param      string `json:"param,omitempty"`
	Type       string `json:"type"`
	InnerError any    `json:"innererror,omitempty"`
}

func (e *OpenAIError) Error() string {
	response := &OpenAIErrorResponse{
		Error: *e,
	}

	// 转换为JSON
	bytes, _ := json.Marshal(response)
	return string(bytes)
}

type OpenAIErrorWithStatusCode struct {
	OpenAIError
	StatusCode int  `json:"status_code"`
	LocalError bool `json:"-"`
}

type OpenAIErrorResponse struct {
	Error OpenAIError `json:"error,omitempty"`
}

type StreamOptions struct {
	IncludeUsage bool `json:"include_usage,omitempty"`
}
