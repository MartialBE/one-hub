package openrouter

import "one-api/types"

type ChatCompletionRequest struct {
	types.ChatCompletionRequest
	Provider orProvider `json:"provider,omitempty"`
}

type orProvider struct {
	Order          []string `json:"order,omitempty"`
	Ignore         []string `json:"ignore,omitempty"`
	AllowFallbacks bool     `json:"allow_fallbacks,omitempty"`
}
