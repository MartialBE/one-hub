package types

import (
	"encoding/json"
	"fmt"
	"one-api/common/config"
)

type Usage struct {
	PromptTokens            int                     `json:"prompt_tokens"`
	CompletionTokens        int                     `json:"completion_tokens"`
	TotalTokens             int                     `json:"total_tokens"`
	PromptTokensDetails     PromptTokensDetails     `json:"prompt_tokens_details"`
	CompletionTokensDetails CompletionTokensDetails `json:"completion_tokens_details"`

	ExtraTokens map[string]int `json:"-"`
}

func (u *Usage) GetExtraTokens() map[string]int {
	if u.ExtraTokens == nil {
		u.ExtraTokens = make(map[string]int)
	}

	// 组装，已有的数据

	// 缓存数据
	if u.PromptTokensDetails.CachedTokens > 0 && u.ExtraTokens[config.UsageExtraCache] == 0 {
		u.ExtraTokens[config.UsageExtraCache] = u.PromptTokensDetails.CachedTokens
	}

	// 输入音频
	if u.PromptTokensDetails.AudioTokens > 0 && u.ExtraTokens[config.UsageExtraInputAudio] == 0 {
		u.ExtraTokens[config.UsageExtraInputAudio] = u.PromptTokensDetails.AudioTokens
	}

	// 输入文字
	if u.PromptTokensDetails.TextTokens > 0 && u.ExtraTokens[config.UsageExtraInputTextTokens] == 0 {
		u.ExtraTokens[config.UsageExtraInputTextTokens] = u.PromptTokensDetails.TextTokens
	}

	// 缓存写入
	if u.PromptTokensDetails.CachedWriteTokens > 0 && u.ExtraTokens[config.UsageExtraCachedWrite] == 0 {
		u.ExtraTokens[config.UsageExtraCachedWrite] = u.PromptTokensDetails.CachedWriteTokens
	}

	// 缓存读取
	if u.PromptTokensDetails.CachedReadTokens > 0 && u.ExtraTokens[config.UsageExtraCachedRead] == 0 {
		u.ExtraTokens[config.UsageExtraCachedRead] = u.PromptTokensDetails.CachedReadTokens
	}

	// 输入图像
	if u.PromptTokensDetails.ImageTokens > 0 && u.ExtraTokens[config.UsageExtraInputImageTokens] == 0 {
		u.ExtraTokens[config.UsageExtraInputImageTokens] = u.PromptTokensDetails.ImageTokens
	}

	// 输出音频
	if u.CompletionTokensDetails.AudioTokens > 0 && u.ExtraTokens[config.UsageExtraOutputAudio] == 0 {
		u.ExtraTokens[config.UsageExtraOutputAudio] = u.CompletionTokensDetails.AudioTokens
	}

	// 输出文字
	if u.CompletionTokensDetails.TextTokens > 0 && u.ExtraTokens[config.UsageExtraOutputTextTokens] == 0 {
		u.ExtraTokens[config.UsageExtraOutputTextTokens] = u.CompletionTokensDetails.TextTokens
	}

	// 推理
	if u.CompletionTokensDetails.ReasoningTokens > 0 && u.ExtraTokens[config.UsageExtraReasoning] == 0 {
		u.ExtraTokens[config.UsageExtraReasoning] = u.CompletionTokensDetails.ReasoningTokens
	}

	return u.ExtraTokens
}

func (u *Usage) SetExtraTokens(key string, value int) {
	if u.ExtraTokens == nil {
		u.ExtraTokens = make(map[string]int)
	}

	u.ExtraTokens[key] = value
}

type PromptTokensDetails struct {
	AudioTokens          int `json:"audio_tokens,omitempty"`
	CachedTokens         int `json:"cached_tokens,omitempty"`
	TextTokens           int `json:"text_tokens,omitempty"`
	ImageTokens          int `json:"image_tokens,omitempty"`
	CachedTokensInternal int `json:"cached_tokens_internal,omitempty"`

	CachedWriteTokens int `json:"-"`
	CachedReadTokens  int `json:"-"`
}

type CompletionTokensDetails struct {
	AudioTokens              int `json:"audio_tokens,omitempty"`
	TextTokens               int `json:"text_tokens,omitempty"`
	ReasoningTokens          int `json:"reasoning_tokens"`
	AcceptedPredictionTokens int `json:"accepted_prediction_tokens"`
	RejectedPredictionTokens int `json:"rejected_prediction_tokens"`
}

func (i *PromptTokensDetails) Merge(other *PromptTokensDetails) {
	if other == nil {
		return
	}

	i.AudioTokens += other.AudioTokens
	i.CachedTokens += other.CachedTokens
	i.TextTokens += other.TextTokens
}

func (o *CompletionTokensDetails) Merge(other *CompletionTokensDetails) {
	if other == nil {
		return
	}

	o.AudioTokens += other.AudioTokens
	o.TextTokens += other.TextTokens
}

type OpenAIError struct {
	Code       any    `json:"code,omitempty"`
	Message    string `json:"message"`
	Param      string `json:"param,omitempty"`
	Type       string `json:"type,omitempty"`
	InnerError any    `json:"innererror,omitempty"`
}

func (e *OpenAIError) Error() string {
	response := &OpenAIErrorResponse{
		Error: *e,
	}

	// 转换为JSON
	bytes, _ := json.Marshal(response)

	fmt.Println("e", string(bytes))
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
