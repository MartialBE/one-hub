package types

const (
	APITollTypeWebSearchPreview = "web_search_preview"
	APITollTypeFileSearch       = "file_search"
	APITollTypeCodeInterpreter  = "code_interpreter"
	APITollTypeImageGeneration  = "image_generation"
)

type OpenAIResponsesRequest struct {
	Input               any              `json:"input,omitempty"`
	Model               string           `json:"model" binding:"required"`
	Include             any              `json:"include,omitempty"`
	Instructions        any              `json:"instructions,omitempty"`
	MaxCompletionTokens int              `json:"max_completion_tokens,omitempty"`
	ParallelToolCalls   bool             `json:"parallel_tool_calls,omitempty"`
	PreviousResponseID  string           `json:"previous_response_id,omitempty"`
	Reasoning           *ReasoningEffort `json:"reasoning,omitempty"`
	Stream              bool             `json:"stream,omitempty"`
	Temperature         *float64         `json:"temperature,omitempty"`
	Text                any              `json:"text,omitempty"`
	ToolChoice          any              `json:"tool_choice,omitempty"`
	Tools               []ResponsesTools `json:"tools,omitempty"`
	TopP                *float64         `json:"top_p,omitempty"`
	Truncation          string           `json:"truncation,omitempty"`
}

type ReasoningEffort struct {
	Effort          *string `json:"effort,omitempty"`
	GenerateSummary *string `json:"generate_summary,omitempty"`
}

type OpenAIResponsesResponses struct {
	CreatedAt          int               `json:"created_at,omitempty"`
	Error              *OpenAIError      `json:"error,omitempty"`
	ID                 string            `json:"id,omitempty"`
	IncompleteDetail   any               `json:"incomplete_details,omitempty"`
	Instructions       any               `json:"instructions,omitempty"`
	MaxOutputTokens    int               `json:"max_output_tokens,omitempty"`
	Model              string            `json:"model"`
	Object             string            `json:"object"`
	Output             []ResponsesOutput `json:"output,omitempty"`
	ParallelToolCalls  bool              `json:"parallel_tool_calls,omitempty"`
	PreviousResponseID string            `json:"previous_response_id,omitempty"`
	Reasoning          *ReasoningEffort  `json:"reasoning,omitempty"`
	Status             string            `json:"status"`
	Temperature        *float64          `json:"temperature,omitempty"`
	Text               any               `json:"text,omitempty"`
	ToolChoice         any               `json:"tool_choice,omitempty"`
	Tools              []ResponsesTools  `json:"tools,omitempty"`
	TopP               *float64          `json:"top_p,omitempty"`
	Truncation         string            `json:"truncation,omitempty"`

	Usage *ResponsesUsage `json:"usage,omitempty"`
}

func (cc *OpenAIResponsesResponses) GetContent() string {
	var content string
	for _, output := range cc.Output {
		content += output.StringContent()
	}
	return content
}

func (m ResponsesOutput) StringContent() string {

	if m.Type != "message" {
		return ""
	}

	content, ok := m.Content.(string)
	if ok {
		return content
	}
	contentList, ok := m.Content.([]any)
	if ok {
		var contentStr string
		for _, contentItem := range contentList {
			contentMap, ok := contentItem.(map[string]any)
			if !ok {
				continue
			}

			if subStr, ok := contentMap["text"].(string); ok && subStr != "" {
				contentStr += subStr
			}

		}
		return contentStr
	}
	return ""
}

type ResponsesOutput struct {
	Type    string `json:"type"`
	ID      string `json:"id"`
	Status  string `json:"status"`
	Role    string `json:"role,omitempty"`
	Content any    `json:"content,omitempty"`

	Queries             any     `json:"queries,omitempty"`
	Results             any     `json:"results,omitempty"`
	Arguments           any     `json:"arguments,omitempty"`
	CallID              *string `json:"call_id,omitempty"`
	Name                *string `json:"name,omitempty"`
	Action              any     `json:"action,omitempty"`
	PendingSafetyChecks any     `json:"pending_safety_checks,omitempty"`
	Summary             any     `json:"summary,omitempty"`
}

type ResponsesOutputToolCall struct {
	ID string `json:"id"`
}

type OpenAIResponsesStreamResponses struct {
	Type         string                    `json:"type"`
	Response     *OpenAIResponsesResponses `json:"response,omitempty"`
	OutputIndex  int                       `json:"output_index,omitempty"`
	Item         any                       `json:"item,omitempty"`
	ItemID       string                    `json:"item_id,omitempty"`
	ContentIndex int                       `json:"content_index,omitempty"`
	Delta        string                    `json:"delta,omitempty"`
}

type ResponsesUsage struct {
	InputTokens         int                                `json:"input_tokens"`
	OutputTokens        int                                `json:"output_tokens"`
	TotalTokens         int                                `json:"total_tokens"`
	OutputTokensDetails *ResponsesUsageOutputTokensDetails `json:"output_tokens_details"`
	InputTokensDetails  *ResponsesUsageInputTokensDetails  `json:"input_tokens_details"`
}

type ResponsesUsageOutputTokensDetails struct {
	ReasoningTokens int `json:"reasoning_tokens"`
}

type ResponsesUsageInputTokensDetails struct {
	CachedTokens int `json:"cached_tokens,omitempty"`
	TextTokens   int `json:"text_tokens,omitempty"`
	ImageTokens  int `json:"image_tokens,omitempty"`
}

func (u *ResponsesUsage) ToOpenAIUsage() *Usage {
	usage := &Usage{
		PromptTokens:     u.InputTokens,
		CompletionTokens: u.OutputTokens,
		TotalTokens:      u.TotalTokens,
	}

	if u.OutputTokensDetails != nil {
		usage.CompletionTokensDetails.ReasoningTokens = u.OutputTokensDetails.ReasoningTokens
	}

	if u.InputTokensDetails != nil {
		usage.PromptTokensDetails.CachedTokens = u.InputTokensDetails.CachedTokens
		usage.PromptTokensDetails.TextTokens = u.InputTokensDetails.TextTokens
		usage.PromptTokensDetails.ImageTokens = u.InputTokensDetails.ImageTokens
	}

	return usage
}

type ResponsesTools struct {
	Type string `json:"type"`
	// Web Search
	UserLocation      any    `json:"user_location,omitempty"`
	SearchContextSize string `json:"search_context_size,omitempty"`
	// File Search
	VectorStoreIds []string `json:"vector_store_ids,omitempty"`
	MaxNumResults  uint     `json:"max_num_results,omitempty"`
	Filters        any      `json:"filters,omitempty"`
	RankingOptions any      `json:"ranking_options,omitempty"`
	// Computer Use
	DisplayWidth  uint   `json:"display_width,omitempty"`
	DisplayHeight uint   `json:"display_height,omitempty"`
	Environment   string `json:"environment,omitempty"`
	// Function
	Name        string `json:"name,omitempty"`
	Description string `json:"description,omitempty"`
	Parameters  any    `json:"parameters,omitempty"`
	Strict      any    `json:"strict,omitempty"`

	//MCP
	ServerLabel     string `json:"server_label,omitempty"`
	ServerURL       string `json:"server_url,omitempty"`
	AllowedTools    any    `json:"allowed_tools,omitempty"`
	Headers         any    `json:"headers,omitempty"`
	RequireApproval any    `json:"require_approval,omitempty"`

	// Code interpreter
	Container any `json:"container,omitempty"`
	// Image generation tool
	Background        any    `json:"background,omitempty"`
	InputImageMask    any    `json:"input_image_mask,omitempty"`
	Model             string `json:"model,omitempty"`
	Moderation        any    `json:"moderation,omitempty"`
	OutputCompression any    `json:"output_compression,omitempty"`
	OutputFormat      any    `json:"output_format,omitempty"`
	PartialImages     any    `json:"partial_images,omitempty"`
	Quality           any    `json:"quality,omitempty"`
	Size              any    `json:"size,omitempty"`
}
