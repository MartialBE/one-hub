package cohere

import (
	"one-api/types"
)

type V2ChatRequest struct {
	Model       string                        `json:"model"`
	Messages    []types.ChatCompletionMessage `json:"messages,omitempty"`
	Tools       []*types.ChatCompletionTool   `json:"tools,omitempty"`
	StrictTools *bool                         `json:"strict_tools,omitempty"`

	ResponseFormat   *types.ChatCompletionResponseFormat `json:"response_format,omitempty"`
	MaxTokens        *int                                `json:"max_tokens,omitempty"`
	StopSequences    any                                 `json:"stop_sequences,omitempty"`
	Temperature      *float64                            `json:"temperature,omitempty"`
	Seed             *int                                `json:"seed,omitempty"`
	FrequencyPenalty *float64                            `json:"frequency_penalty,omitempty"`
	PresencePenalty  *float64                            `json:"presence_penalty,omitempty"`
	K                *float64                            `json:"k,omitempty"`
	P                *float64                            `json:"p,omitempty"`
	ReturnPrompt     *bool                               `json:"return_prompt,omitempty"`
	Logprobs         *bool                               `json:"logprobs,omitempty"`
	ToolChoice       *string                             `json:"tool_choice,omitempty"`
	Stream           bool                                `json:"stream"`
	// Documents       []*V2ChatRequestDocumentsItem `json:"documents,omitempty" url:"-"`
	// CitationOptions *CitationOptions              `json:"citation_options,omitempty" url:"-"`
	// SafetyMode *V2ChatRequestSafetyMode `json:"safety_mode,omitempty" url:"-"`
}

type ChatCompletionMessage struct {
	types.ChatCompletionMessage
	ToolPlan string `json:"tool_plan,omitempty"`
}

func (cc *ChatCompletionMessage) ToChatCompletionMessage() *types.ChatCompletionMessage {
	if cc.ToolPlan != "" {
		cc.Content = cc.ToolPlan
	}

	return &cc.ChatCompletionMessage
}

type ChatResponse struct {
	Id           string                 `json:"id"`
	FinishReason string                 `json:"finish_reason"`
	Prompt       *string                `json:"prompt,omitempty"`
	Message      *ChatCompletionMessage `json:"message,omitempty"`
	Usage        *Usage                 `json:"usage,omitempty"`
	Logprobs     any                    `json:"logprobs,omitempty"`
}

type ChatStreamResponse struct {
	Id    string          `json:"id,omitempty"`
	Index int             `json:"index,omitempty"`
	Delta *ChatEventDelta `json:"delta,omitempty" url:"delta,omitempty"`
	Type  string          `json:"type,omitempty"`
}

type ChatEventDelta struct {
	Message      *ChatEventDeltaMessage `json:"message,omitempty"`
	Usage        *Usage                 `json:"usage,omitempty"`
	FinishReason string                 `json:"finish_reason,omitempty"`
}

type ChatEventDeltaMessage struct {
	Role      string                         `json:"role,omitempty"`
	Content   MessageContent                 `json:"content,omitempty"`
	ToolCalls *types.ChatCompletionToolCalls `json:"tool_calls,omitempty"`
	ToolPlan  string                         `json:"tool_plan,omitempty"`
}

type MessageContent struct {
	Text string `json:"text,omitempty"`
	Type string `json:"type,omitempty"`
}

func (m *ChatEventDeltaMessage) ToString() string {
	if m.ToolPlan != "" {
		return m.ToolPlan
	}

	return m.Content.Text
}

type CohereError struct {
	Message string `json:"message,omitempty"`
}

type Usage struct {
	BilledUnits *UsageBilledUnits `json:"billed_units,omitempty"`
}

type UsageBilledUnits struct {
	InputTokens     int `json:"input_tokens,omitempty"`
	OutputTokens    int `json:"output_tokens,omitempty"`
	SearchUnits     int `json:"search_units,omitempty"`
	Classifications int `json:"classifications,omitempty"`
}

type ModelListResponse struct {
	Models []ModelDetails `json:"models"`
}

type ModelDetails struct {
	Name      string   `json:"name"`
	Endpoints []string `json:"endpoints"`
}

type RerankRequest struct {
	Model           string   `json:"model,omitempty"`
	Query           string   `json:"query" url:"query"`
	Documents       []string `json:"documents,omitempty"`
	TopN            int      `json:"top_n,omitempty"`
	RankFields      []string `json:"rank_fields,omitempty"`
	ReturnDocuments bool     `json:"return_documents,omitempty"`
	MaxChunksPerDoc *int     `json:"max_chunks_per_doc,omitempty"`
}

type RerankRequestDocumentsItem struct {
	String                         string
	RerankRequestDocumentsItemText *RerankDocumentsItemText
}
type RerankDocumentsItemText struct {
	Text string `json:"text"`
}

type RerankResponse struct {
	Id      *string                      `json:"id,omitempty"`
	Results []*RerankResponseResultsItem `json:"results,omitempty"`
	Meta    *Usage                       `json:"meta,omitempty"`
}

type RerankResponseResultsItem struct {
	Document       *RerankDocumentsItemText `json:"document,omitempty"`
	Index          int                      `json:"index"`
	RelevanceScore float64                  `json:"relevance_score"`
}
