package replicate

type ReplicateError struct {
	Detail string `json:"detail"`
	Status int    `json:"status"`
	Title  string `json:"title"`
}

type ReplicateRequest[T any] struct {
	Stream bool `json:"stream,omitempty"`
	Input  T    `json:"input"`
}

type ReplicateImageRequest struct {
	Prompt           string  `json:"prompt"`
	AspectRatio      *string `json:"aspect_ratio,omitempty"`
	OutputFormat     string  `json:"output_format,omitempty"`
	OutputQuality    *int    `json:"output_quality,omitempty"`
	SafetyTolerance  *string `json:"safety_tolerance,omitempty"`
	PromptUpsampling *string `json:"prompt_upsampling,omitempty"`
	Size             string  `json:"size,omitempty"`
}

type ReplicateChatRequest struct {
	TopK             float64  `json:"top_k,omitempty"`
	TopP             *float64 `json:"top_p,omitempty"`
	Prompt           string   `json:"prompt"`
	MaxTokens        int      `json:"max_tokens,omitempty"`
	MinTokens        int      `json:"min_tokens,omitempty"`
	Temperature      *float64 `json:"temperature,omitempty"`
	SystemPrompt     string   `json:"system_prompt,omitempty"`
	PresencePenalty  *float64 `json:"presence_penalty,omitempty"`
	FrequencyPenalty *float64 `json:"frequency_penalty,omitempty"`
}

type ReplicateResponse[T any] struct {
	ID      string            `json:"id"`
	Model   string            `json:"model"`
	Urls    ReplicateImageUrl `json:"urls"`
	Status  string            `json:"status"` // starting / succeeded
	Output  T                 `json:"output,omitempty"`
	Metrics ReplicateMetrics  `json:"metrics,omitempty"`
}

type ReplicateImageUrl struct {
	Stream string `json:"stream"`
}

type ReplicateMetrics struct {
	InputTokenCount  int `json:"input_token_count,omitempty"`
	OutputTokenCount int `json:"output_token_count,omitempty"`
}
