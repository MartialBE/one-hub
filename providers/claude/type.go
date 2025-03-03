package claude

import (
	"encoding/json"
	"one-api/types"
)

const (
	FinishReasonEndTurn = "end_turn"
	FinishReasonToolUse = "tool_use"
)

const (
	ContentTypeText             = "text"
	ContentTypeImage            = "image"
	ContentTypeToolUes          = "tool_use"
	ContentTypeToolResult       = "tool_result"
	ContentTypeThinking         = "thinking"
	ContentTypeRedactedThinking = "redacted_thinking"

	ContentStreamTypeThinking       = "thinking_delta"
	ContentStreamTypeSignatureDelta = "signature_delta"
	ContentStreamTypeInputJsonDelta = "input_json_delta"
)

type ClaudeError struct {
	Type      string          `json:"type"`
	ErrorInfo ClaudeErrorInfo `json:"error"`
}

func (e *ClaudeError) Error() string {
	bytes, _ := json.Marshal(e)
	return string(bytes) + "\n"
}

type ClaudeErrorWithStatusCode struct {
	ClaudeError
	StatusCode int  `json:"status_code"`
	LocalError bool `json:"-"`
}

func (e *ClaudeErrorWithStatusCode) ToOpenAiError() *types.OpenAIErrorWithStatusCode {
	return &types.OpenAIErrorWithStatusCode{
		StatusCode: e.StatusCode,
		OpenAIError: types.OpenAIError{
			Type:    e.Type,
			Message: e.ErrorInfo.Message,
		},
		LocalError: e.LocalError,
	}
}

type ClaudeErrorInfo struct {
	Type    string `json:"type"`
	Message string `json:"message"`
}

type ClaudeMetadata struct {
	UserId string `json:"user_id"`
}

type ResContent struct {
	Text      string `json:"text,omitempty"`
	Type      string `json:"type"`
	Name      string `json:"name,omitempty"`
	Input     any    `json:"input,omitempty"`
	Id        string `json:"id,omitempty"`
	Thinking  string `json:"thinking,omitempty"`
	Signature string `json:"signature,omitempty"`
	Delta     string `json:"delta,omitempty"`
	Citations any    `json:"citations,omitempty"`
}

func (g *ResContent) ToOpenAITool() *types.ChatCompletionToolCalls {
	args, _ := json.Marshal(g.Input)

	return &types.ChatCompletionToolCalls{
		Id:    g.Id,
		Type:  types.ChatMessageRoleFunction,
		Index: 0,
		Function: &types.ChatCompletionToolCallsFunction{
			Name:      g.Name,
			Arguments: string(args),
		},
	}
}

type ContentSource struct {
	Type      string `json:"type"`
	MediaType string `json:"media_type,omitempty"`
	Data      string `json:"data,omitempty"`
	Url       string `json:"url,omitempty"`
}

type MessageContent struct {
	Type         string         `json:"type"`
	Text         string         `json:"text,omitempty"`
	Source       *ContentSource `json:"source,omitempty"`
	Id           string         `json:"id,omitempty"`
	Name         string         `json:"name,omitempty"`
	Input        any            `json:"input,omitempty"`
	Content      any            `json:"content,omitempty"`
	IsError      *bool          `json:"is_error,omitempty"`
	ToolUseId    string         `json:"tool_use_id,omitempty"`
	CacheControl any            `json:"cache_control,omitempty"`
}

type Message struct {
	Role    string `json:"role"`
	Content any    `json:"content"`
}

type ClaudeRequest struct {
	Model         string      `json:"model,omitempty"`
	System        any         `json:"system,omitempty"`
	Messages      []Message   `json:"messages"`
	MaxTokens     int         `json:"max_tokens"`
	StopSequences []string    `json:"stop_sequences,omitempty"`
	Temperature   *float64    `json:"temperature,omitempty"`
	TopP          *float64    `json:"top_p,omitempty"`
	TopK          *int        `json:"top_k,omitempty"`
	Tools         []Tools     `json:"tools,omitempty"`
	ToolChoice    *ToolChoice `json:"tool_choice,omitempty"`
	Thinking      *Thinking   `json:"thinking,omitempty"`
	//ClaudeMetadata    `json:"metadata,omitempty"`
	Stream bool `json:"stream,omitempty"`
}

type Thinking struct {
	Type         string `json:"type,omitempty"`
	BudgetTokens int    `json:"budget_tokens,omitempty"`
}
type ToolChoice struct {
	Type                   string `json:"type,omitempty"`
	Name                   string `json:"name,omitempty"`
	DisableParallelToolUse bool   `json:"disable_parallel_tool_use,omitempty"`
}

type Tools struct {
	Type            string `json:"type,omitempty"`
	CacheControl    any    `json:"cache_control,omitempty"`
	Name            string `json:"name,omitempty"`
	Description     string `json:"description,omitempty"`
	InputSchema     any    `json:"input_schema,omitempty"`
	DisplayHeightPx int    `json:"display_height_px,omitempty"`
	DisplayWidthPx  int    `json:"display_width_px,omitempty"`
	DisplayNumber   int    `json:"display_number,omitempty"`
}

type Usage struct {
	InputTokens              int `json:"input_tokens,omitempty"`
	OutputTokens             int `json:"output_tokens,omitempty"`
	CacheCreationInputTokens int `json:"cache_creation_input_tokens,omitempty"`
	CacheReadInputTokens     int `json:"cache_read_input_tokens,omitempty"`
}
type ClaudeResponse struct {
	Id           string       `json:"id"`
	Type         string       `json:"type"`
	Role         string       `json:"role"`
	Content      []ResContent `json:"content"`
	Model        string       `json:"model"`
	StopReason   string       `json:"stop_reason,omitempty"`
	StopSequence string       `json:"stop_sequence,omitempty"`
	Usage        Usage        `json:"usage,omitempty"`
	Error        *ClaudeError `json:"error,omitempty"`
}

type Delta struct {
	Type         string `json:"type,omitempty"`
	Text         string `json:"text,omitempty"`
	PartialJson  string `json:"partial_json,omitempty"`
	StopReason   string `json:"stop_reason,omitempty"`
	StopSequence string `json:"stop_sequence,omitempty"`
	Thinking     string `json:"thinking,omitempty"`
	Signature    string `json:"signature,omitempty"`
	Citations    any    `json:"citations,omitempty"`
}

type ClaudeStreamResponse struct {
	Type         string         `json:"type"`
	Message      ClaudeResponse `json:"message,omitempty"`
	Index        int            `json:"index,omitempty"`
	Delta        Delta          `json:"delta,omitempty"`
	ContentBlock ContentBlock   `json:"content_block,omitempty"`
	Usage        Usage          `json:"usage,omitempty"`
	Error        *ClaudeError   `json:"error,omitempty"`
}

type ContentBlock struct {
	Type  string `json:"type"`
	Id    string `json:"id"`
	Name  string `json:"name,omitempty"`
	Input any    `json:"input,omitempty"`
	Text  string `json:"text,omitempty"`
}

type ModelListResponse struct {
	Data []Model `json:"data"`
}

type Model struct {
	Type string `json:"type"`
	ID   string `json:"id"`
}
