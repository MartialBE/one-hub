package types

import (
	"encoding/json"
	"fmt"
	"one-api/common/config"
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
	InputTokens        int                     `json:"input_tokens"`
	OutputTokens       int                     `json:"output_tokens"`
	TotalTokens        int                     `json:"total_tokens"`
	InputTokenDetails  PromptTokensDetails     `json:"input_token_details,omitempty"`
	OutputTokenDetails CompletionTokensDetails `json:"output_token_details,omitempty"`

	ExtraTokens map[string]int `json:"-"`
}

func (u *UsageEvent) GetExtraTokens() map[string]int {
	if u.ExtraTokens == nil {
		u.ExtraTokens = make(map[string]int)
	}

	// 组装，已有的数据
	if u.InputTokenDetails.CachedTokens > 0 && u.ExtraTokens[config.UsageExtraCache] == 0 {
		u.ExtraTokens[config.UsageExtraCache] = u.InputTokenDetails.CachedTokens
	}

	if u.InputTokenDetails.AudioTokens > 0 && u.ExtraTokens[config.UsageExtraInputAudio] == 0 {
		u.ExtraTokens[config.UsageExtraInputAudio] = u.InputTokenDetails.AudioTokens
	}

	if u.OutputTokenDetails.AudioTokens > 0 && u.ExtraTokens[config.UsageExtraOutputAudio] == 0 {
		u.ExtraTokens[config.UsageExtraOutputAudio] = u.OutputTokenDetails.AudioTokens
	}

	return u.ExtraTokens
}

func (u *UsageEvent) SetExtraTokens(key string, value int) {
	if u.ExtraTokens == nil {
		u.ExtraTokens = make(map[string]int)
	}

	u.ExtraTokens[key] = value
}

func (u *UsageEvent) ToChatUsage() *Usage {
	return &Usage{
		PromptTokens:            u.InputTokens,
		CompletionTokens:        u.OutputTokens,
		TotalTokens:             u.TotalTokens,
		PromptTokensDetails:     u.InputTokenDetails,
		CompletionTokensDetails: u.OutputTokenDetails,
	}
}

func (u *UsageEvent) Merge(other *UsageEvent) {
	if other == nil {
		return
	}

	u.InputTokens += other.InputTokens
	u.OutputTokens += other.OutputTokens
	u.TotalTokens += other.TotalTokens

	u.InputTokenDetails.Merge(&other.InputTokenDetails)
	u.OutputTokenDetails.Merge(&other.OutputTokenDetails)
}
