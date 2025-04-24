package types

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
	Tools               any              `json:"tools,omitempty"`
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
	Tools              any               `json:"tools,omitempty"`
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
