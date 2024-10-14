package types

import (
	"encoding/json"
	"fmt"
	"one-api/common/utils"
)

const (
	EventTypeResponseDone   = "response.done"
	EventTypeSessionCreated = "session.created"
	EventTypeError          = "error"
)

type Event struct {
	EventId     string         `json:"event_id"`
	Type        string         `json:"type"`
	Response    *ResponseEvent `json:"response,omitempty"`
	ErrorDetail *EventError    `json:"error,omitempty"`
}

type EventError struct {
	OpenAIError
	EventId string `json:"event_id"`
}

func NewErrorEvent(eventId, errType, code, message string) *Event {
	if eventId == "" {
		eventId = fmt.Sprintf("event_%d", utils.GetRandomInt(3))
	}

	return &Event{
		EventId: eventId,
		Type:    EventTypeError,
		ErrorDetail: &EventError{
			EventId: eventId,
			OpenAIError: OpenAIError{
				Type:    errType,
				Code:    code,
				Message: message,
			},
		},
	}
}

func (e *Event) IsError() bool {
	return e.Type == EventTypeError
}

func (e *Event) Error() string {
	if e.ErrorDetail == nil {
		return ""
	}

	// 转换成JSON
	jsonBytes, err := json.Marshal(e)
	if err != nil {
		return ""
	}
	return string(jsonBytes)
}

type ResponseEvent struct {
	ID     string      `json:"id"`
	Object string      `json:"object"`
	Status string      `json:"status"`
	Usage  *UsageEvent `json:"usage,omitempty"`
}

type UsageEvent struct {
	InputTokens        int                 `json:"input_tokens"`
	OutputTokens       int                 `json:"output_tokens"`
	TotalTokens        int                 `json:"total_tokens"`
	InputTokenDetails  *InputTokenDetails  `json:"input_token_details,omitempty"`
	OutputTokenDetails *OutputTokenDetails `json:"output_token_details,omitempty"`
}

func (u *UsageEvent) ToChatUsage() *Usage {
	inputTokenDetails := u.InputTokenDetails
	if inputTokenDetails == nil {
		inputTokenDetails = &InputTokenDetails{}
	}

	outputTokenDetails := u.OutputTokenDetails
	if outputTokenDetails == nil {
		outputTokenDetails = &OutputTokenDetails{}
	}

	return &Usage{
		PromptTokens:     u.InputTokens,
		CompletionTokens: u.OutputTokens,
		TotalTokens:      u.TotalTokens,

		SysTokensDetails: SysTokensDetails{
			InputAudioTokens:  inputTokenDetails.AudioTokens,
			InputTextTokens:   inputTokenDetails.TextTokens,
			CachedTokens:      inputTokenDetails.CachedTokens,
			OutputAudioTokens: outputTokenDetails.AudioTokens,
			OutputTextTokens:  outputTokenDetails.TextTokens,
		},
	}
}

func (u *UsageEvent) Merge(other *UsageEvent) {
	if other == nil {
		return
	}

	u.InputTokens += other.InputTokens
	u.OutputTokens += other.OutputTokens
	u.TotalTokens += other.TotalTokens

	if u.InputTokenDetails == nil {
		u.InputTokenDetails = &InputTokenDetails{}
	}
	if u.OutputTokenDetails == nil {
		u.OutputTokenDetails = &OutputTokenDetails{}
	}

	u.InputTokenDetails.Merge(other.InputTokenDetails)
	u.OutputTokenDetails.Merge(other.OutputTokenDetails)
}

type InputTokenDetails struct {
	AudioTokens  int `json:"audio_tokens"`
	CachedTokens int `json:"cached_tokens"`
	TextTokens   int `json:"text_tokens"`
}

func (i *InputTokenDetails) Merge(other *InputTokenDetails) {
	if other == nil {
		return
	}

	i.AudioTokens += other.AudioTokens
	i.CachedTokens += other.CachedTokens
	i.TextTokens += other.TextTokens
}

type OutputTokenDetails struct {
	AudioTokens int `json:"audio_tokens"`
	TextTokens  int `json:"text_tokens"`
}

func (o *OutputTokenDetails) Merge(other *OutputTokenDetails) {
	if other == nil {
		return
	}

	o.AudioTokens += other.AudioTokens
	o.TextTokens += other.TextTokens
}
