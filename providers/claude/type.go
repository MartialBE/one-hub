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
	ContentTypeText       = "text"
	ContentTypeImage      = "image"
	ContentTypeToolUes    = "tool_use"
	ContentTypeToolResult = "tool_result"
)

type ClaudeError struct {
	Type  string          `json:"type"`
	Error ClaudeErrorInfo `json:"error"`
}

type ClaudeErrorInfo struct {
	Type    string `json:"type"`
	Message string `json:"message"`
}

type ClaudeMetadata struct {
	UserId string `json:"user_id"`
}

type ResContent struct {
	Text  string `json:"text,omitempty"`
	Type  string `json:"type"`
	Name  string `json:"name,omitempty"`
	Input any    `json:"input,omitempty"`
	Id    string `json:"id,omitempty"`
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
	MediaType string `json:"media_type"`
	Data      string `json:"data"`
}

type MessageContent struct {
	Type      string         `json:"type"`
	Text      string         `json:"text,omitempty"`
	Source    *ContentSource `json:"source,omitempty"`
	Id        string         `json:"id,omitempty"`
	Name      string         `json:"name,omitempty"`
	Input     any            `json:"input,omitempty"`
	Content   string         `json:"content,omitempty"`
	ToolUseId string         `json:"tool_use_id,omitempty"`
}

type Message struct {
	Role    string           `json:"role"`
	Content []MessageContent `json:"content"`
}

type ClaudeRequest struct {
	Model         string      `json:"model,omitempty"`
	System        string      `json:"system,omitempty"`
	Messages      []Message   `json:"messages"`
	MaxTokens     int         `json:"max_tokens"`
	StopSequences []string    `json:"stop_sequences,omitempty"`
	Temperature   float64     `json:"temperature,omitempty"`
	TopP          float64     `json:"top_p,omitempty"`
	TopK          int         `json:"top_k,omitempty"`
	Tools         []Tools     `json:"tools,omitempty"`
	ToolChoice    *ToolChoice `json:"tool_choice,omitempty"`
	//ClaudeMetadata    `json:"metadata,omitempty"`
	Stream bool `json:"stream,omitempty"`
}

type ToolChoice struct {
	Type string `json:"type,omitempty"`
	Name string `json:"name,omitempty"`
}

type Tools struct {
	Name        string `json:"name,omitempty"`
	Description string `json:"description,omitempty"`
	InputSchema any    `json:"input_schema,omitempty"`
}

type Usage struct {
	InputTokens  int `json:"input_tokens,omitempty"`
	OutputTokens int `json:"output_tokens,omitempty"`
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
	Error        ClaudeError  `json:"error,omitempty"`
}

type Delta struct {
	Type         string `json:"type,omitempty"`
	Text         string `json:"text,omitempty"`
	PartialJson  string `json:"partial_json,omitempty"`
	StopReason   string `json:"stop_reason,omitempty"`
	StopSequence string `json:"stop_sequence,omitempty"`
}

type ClaudeStreamResponse struct {
	Type         string         `json:"type"`
	Message      ClaudeResponse `json:"message,omitempty"`
	Index        int            `json:"index,omitempty"`
	Delta        Delta          `json:"delta,omitempty"`
	ContentBlock ContentBlock   `json:"content_block,omitempty"`
	Usage        Usage          `json:"usage,omitempty"`
	Error        ClaudeError    `json:"error,omitempty"`
}

type ContentBlock struct {
	Type  string `json:"type"`
	Id    string `json:"id"`
	Name  string `json:"name,omitempty"`
	Input any    `json:"input,omitempty"`
	Text  string `json:"text,omitempty"`
}
