package types

import "encoding/json"

const (
	ContentTypeText     = "text"
	ContentTypeImageURL = "image_url"
)

const (
	FinishReasonStop          = "stop"
	FinishReasonLength        = "length"
	FinishReasonFunctionCall  = "function_call"
	FinishReasonToolCalls     = "tool_calls"
	FinishReasonContentFilter = "content_filter"
	FinishReasonNull          = "null"
)

const (
	ChatMessageRoleSystem    = "system"
	ChatMessageRoleDeveloper = "developer"
	ChatMessageRoleUser      = "user"
	ChatMessageRoleAssistant = "assistant"
	ChatMessageRoleFunction  = "function"
	ChatMessageRoleTool      = "tool"
)

const (
	ToolChoiceTypeFunction = "function"
	ToolChoiceTypeAuto     = "auto"
	ToolChoiceTypeNone     = "none"
	ToolChoiceTypeRequired = "required"
)

type ChatCompletionToolCallsFunction struct {
	Name      string `json:"name,omitempty"`
	Arguments string `json:"arguments"`
}

type ChatCompletionToolCalls struct {
	Id       string                           `json:"id,omitempty"`
	Type     string                           `json:"type,omitempty"`
	Function *ChatCompletionToolCallsFunction `json:"function"`
	Index    int                              `json:"index"`
}

type ChatCompletionMessage struct {
	Role             string                           `json:"role"`
	Content          any                              `json:"content,omitempty"`
	Refusal          string                           `json:"refusal,omitempty"`
	ReasoningContent string                           `json:"reasoning_content,omitempty"`
	Reasoning        string                           `json:"reasoning,omitempty"`
	Name             *string                          `json:"name,omitempty"`
	FunctionCall     *ChatCompletionToolCallsFunction `json:"function_call,omitempty"`
	ToolCalls        []*ChatCompletionToolCalls       `json:"tool_calls,omitempty"`
	ToolCallID       string                           `json:"tool_call_id,omitempty"`
	Audio            any                              `json:"audio,omitempty"`
	Annotations      any                              `json:"annotations,omitempty"`
	Image            []MultimediaData                 `json:"image,omitempty"`
	Images           []ChatMessagePart                `json:"images,omitempty"`
}

func (m ChatCompletionMessage) StringContent() string {
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

func (m ChatCompletionMessage) ParseContent() []ChatMessagePart {
	var contentList []ChatMessagePart
	content, ok := m.Content.(string)
	if ok {
		contentList = append(contentList, ChatMessagePart{
			Type: ContentTypeText,
			Text: content,
		})
		return contentList
	}
	msgJson, err := json.Marshal(m.Content)
	if err != nil {
		return contentList
	}

	json.Unmarshal(msgJson, &contentList)
	return contentList
}

// 将FunctionCall转换为ToolCalls
func (m *ChatCompletionMessage) FuncToToolCalls() {
	if m.ToolCalls != nil {
		return
	}
	if m.FunctionCall != nil {
		m.ToolCalls = []*ChatCompletionToolCalls{
			{
				Id:       m.FunctionCall.Name,
				Type:     ChatMessageRoleFunction,
				Function: m.FunctionCall,
			},
		}
		m.FunctionCall = nil
	}
}

// 将ToolCalls转换为FunctionCall
func (m *ChatCompletionMessage) ToolToFuncCalls() {

	if m.FunctionCall != nil {
		return
	}
	if m.ToolCalls != nil {
		m.FunctionCall = &ChatCompletionToolCallsFunction{
			Name:      m.ToolCalls[0].Function.Name,
			Arguments: m.ToolCalls[0].Function.Arguments,
		}
		m.ToolCalls = nil
	}
}

func (m *ChatCompletionMessage) IsSystemRole() bool {
	return m.Role == ChatMessageRoleSystem || m.Role == ChatMessageRoleDeveloper
}

type ChatMessageImageURL struct {
	URL    string `json:"url,omitempty"`
	Detail string `json:"detail,omitempty"`
}

type ChatMessagePart struct {
	Type       string               `json:"type,omitempty"`
	Text       string               `json:"text,omitempty"`
	ImageURL   *ChatMessageImageURL `json:"image_url,omitempty"`
	InputAudio *InputAudio          `json:"input_audio,omitempty"`
	Refusal    string               `json:"refusal,omitempty"`

	File *ChatMessageFile `json:"file,omitempty"`
}

type InputAudio struct {
	Data   string `json:"data"`
	Format string `json:"format"`
}

type ChatMessageFile struct {
	Filename string `json:"filename,omitempty"`
	FileData string `json:"file_data,omitempty"`
}

type ChatCompletionResponseFormat struct {
	Type       string            `json:"type,omitempty"`
	JsonSchema *FormatJsonSchema `json:"json_schema,omitempty"`
}

type FormatJsonSchema struct {
	Description string `json:"description,omitempty"`
	Name        string `json:"name"`
	Schema      any    `json:"schema,omitempty"`
	Strict      any    `json:"strict,omitempty"`
}

type ChatCompletionRequest struct {
	Model               string                        `json:"model" binding:"required"`
	Messages            []ChatCompletionMessage       `json:"messages" binding:"required"`
	MaxTokens           int                           `json:"max_tokens,omitempty"`
	MaxCompletionTokens int                           `json:"max_completion_tokens,omitempty"`
	Temperature         *float64                      `json:"temperature,omitempty"`
	TopP                *float64                      `json:"top_p,omitempty"`
	TopK                *float64                      `json:"top_k,omitempty"`
	N                   *int                          `json:"n,omitempty"`
	Stream              bool                          `json:"stream,omitempty"`
	StreamOptions       *StreamOptions                `json:"stream_options,omitempty"`
	Stop                any                           `json:"stop,omitempty"`
	PresencePenalty     *float64                      `json:"presence_penalty,omitempty"`
	ResponseFormat      *ChatCompletionResponseFormat `json:"response_format,omitempty"`
	Seed                *int                          `json:"seed,omitempty"`
	FrequencyPenalty    *float64                      `json:"frequency_penalty,omitempty"`
	LogitBias           any                           `json:"logit_bias,omitempty"`
	LogProbs            *bool                         `json:"logprobs,omitempty"`
	TopLogProbs         int                           `json:"top_logprobs,omitempty"`
	User                string                        `json:"user,omitempty"`
	Functions           []*ChatCompletionFunction     `json:"functions,omitempty"`
	FunctionCall        any                           `json:"function_call,omitempty"`
	Tools               []*ChatCompletionTool         `json:"tools,omitempty"`
	ToolChoice          any                           `json:"tool_choice,omitempty"`
	ParallelToolCalls   bool                          `json:"parallel_tool_calls,omitempty"`
	Modalities          []string                      `json:"modalities,omitempty"`
	Audio               *ChatAudio                    `json:"audio,omitempty"`
	ReasoningEffort     *string                       `json:"reasoning_effort,omitempty"`
	Prediction          any                           `json:"prediction,omitempty"`
	WebSearchOptions    *WebSearchOptions             `json:"web_search_options,omitempty"`
	Verbosity           string                        `json:"verbosity,omitempty"` // 用于控制输出的详细程度

	Reasoning *ChatReasoning `json:"reasoning,omitempty"`

	// 考虑到后续一些模型逐步采用openai api格式扩展参数的方式进行服务提供，所以考虑把一些模型的特有参数放入可选参数
	EnableThinking *bool `json:"enable_thinking,omitempty"` // qwen3 思考开关
	ThinkingBudget *int  `json:"thinking_budget,omitempty"` // qwen3 思考长度，只有enable_thinking开启才生效
	EnableSearch   *bool `json:"enable_search,omitempty"`   // qwen 搜索开关

	OneOtherArg string `json:"-"`
}

type ChatReasoning struct {
	MaxTokens int     `json:"max_tokens,omitempty"`
	Effort    string  `json:"effort,omitempty"`
	Summary   *string `json:"summary,omitempty"`
}

type WebSearchOptions struct {
	SearchContextSize string `json:"search_context_size,omitempty"`
	UserLocation      any    `json:"user_location,omitempty"`
}

func (r ChatCompletionRequest) ParseToolChoice() (toolType, toolFunc string) {
	if choice, ok := r.ToolChoice.(map[string]any); ok {
		if function, ok := choice["function"].(map[string]any); ok {
			toolType = ToolChoiceTypeFunction
			toolFunc = function["name"].(string)
		}
	} else if toolChoiceType, ok := r.ToolChoice.(string); ok {
		toolType = toolChoiceType
	}

	if toolType == "" {
		toolType = ToolChoiceTypeAuto
	}

	return
}

func (r ChatCompletionRequest) GetFunctionCate() string {
	if r.Tools != nil {
		return "tool"
	} else if r.Functions != nil {
		return "function"
	}
	return ""
}

func (r *ChatCompletionRequest) GetFunctions() []*ChatCompletionFunction {
	if r.Tools == nil && r.Functions == nil {
		return nil
	}

	if r.Tools != nil {
		var functions []*ChatCompletionFunction
		for _, tool := range r.Tools {
			functions = append(functions, &tool.Function)
		}
		return functions
	}

	return r.Functions
}

type ChatCompletionFunction struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Parameters  any    `json:"parameters"`
	Strict      *bool  `json:"strict,omitempty"`
}

type ChatCompletionTool struct {
	Type     string                 `json:"type"`
	Function ChatCompletionFunction `json:"function,omitzero"`

	ResponsesTools
}

type ChatCompletionChoice struct {
	Index                int                   `json:"index"`
	Message              ChatCompletionMessage `json:"message"`
	LogProbs             any                   `json:"logprobs,omitempty"`
	FinishReason         string                `json:"finish_reason,omitempty"`
	ContentFilterResults any                   `json:"content_filter_results,omitempty"`
	FinishDetails        any                   `json:"finish_details,omitempty"`
}

func (c *ChatCompletionChoice) CheckChoice(request *ChatCompletionRequest) {
	if request.Functions != nil && c.Message.ToolCalls != nil {
		c.Message.ToolToFuncCalls()
		c.FinishReason = FinishReasonFunctionCall
	}
}

type ChatCompletionResponse struct {
	ID                  string                 `json:"id"`
	Object              string                 `json:"object"`
	Created             any                    `json:"created"`
	Model               string                 `json:"model"`
	Choices             []ChatCompletionChoice `json:"choices"`
	Usage               *Usage                 `json:"usage,omitempty"`
	SystemFingerprint   string                 `json:"system_fingerprint,omitempty"`
	PromptFilterResults any                    `json:"prompt_filter_results,omitempty"`
}

func (cc *ChatCompletionResponse) GetContent() string {
	var content string
	for _, choice := range cc.Choices {
		content += choice.Message.StringContent()
	}
	return content
}

func (c ChatCompletionStreamChoice) ConvertOpenaiStream() []ChatCompletionStreamChoice {
	var choices []ChatCompletionStreamChoice
	var stopFinish string
	if c.Delta.FunctionCall != nil {
		stopFinish = FinishReasonFunctionCall
		choices = c.Delta.FunctionCall.Split(&c, stopFinish, 0)
	} else {
		stopFinish = FinishReasonToolCalls
		for index, tool := range c.Delta.ToolCalls {
			choices = append(choices, tool.Function.Split(&c, stopFinish, index)...)
		}
	}

	choices = append(choices, ChatCompletionStreamChoice{
		Index:        c.Index,
		Delta:        ChatCompletionStreamChoiceDelta{},
		FinishReason: stopFinish,
	})

	return choices
}

func (f *ChatCompletionToolCallsFunction) Split(c *ChatCompletionStreamChoice, stopFinish string, index int) []ChatCompletionStreamChoice {
	var functions []*ChatCompletionToolCallsFunction
	var choices []ChatCompletionStreamChoice
	functions = append(functions, &ChatCompletionToolCallsFunction{
		Name:      f.Name,
		Arguments: "",
	})

	if f.Arguments == "" || f.Arguments == "{}" {
		functions = append(functions, &ChatCompletionToolCallsFunction{
			Arguments: "{}",
		})
	} else {
		functions = append(functions, &ChatCompletionToolCallsFunction{
			Arguments: f.Arguments,
		})
	}

	for fIndex, function := range functions {
		choice := ChatCompletionStreamChoice{
			Index: c.Index,
			Delta: ChatCompletionStreamChoiceDelta{
				Role: c.Delta.Role,
			},
		}
		if stopFinish == FinishReasonFunctionCall {
			choice.Delta.FunctionCall = function
		} else {
			toolCalls := &ChatCompletionToolCalls{
				// Id:       c.Delta.ToolCalls[0].Id,
				Index:    index,
				Type:     ChatMessageRoleFunction,
				Function: function,
			}

			if fIndex == 0 {
				toolCalls.Id = c.Delta.ToolCalls[0].Id
			}
			choice.Delta.ToolCalls = []*ChatCompletionToolCalls{toolCalls}
		}

		choices = append(choices, choice)
	}

	return choices
}

type ChatCompletionStreamChoiceDelta struct {
	Content          string                           `json:"content,omitempty"`
	Role             string                           `json:"role,omitempty"`
	FunctionCall     *ChatCompletionToolCallsFunction `json:"function_call,omitempty"`
	ToolCalls        []*ChatCompletionToolCalls       `json:"tool_calls,omitempty"`
	ReasoningContent string                           `json:"reasoning_content,omitempty"`
	Reasoning        string                           `json:"reasoning,omitempty"`
	Image            []MultimediaData                 `json:"image,omitempty"`
	Images           []ChatMessagePart                `json:"images,omitempty"`
}

func (m *ChatCompletionStreamChoiceDelta) ToolToFuncCalls() {

	if m.FunctionCall != nil {
		return
	}
	if m.ToolCalls != nil {
		m.FunctionCall = &ChatCompletionToolCallsFunction{
			Name:      m.ToolCalls[0].Function.Name,
			Arguments: m.ToolCalls[0].Function.Arguments,
		}
		m.ToolCalls = nil
	}
}

type ChatCompletionStreamChoice struct {
	Index                int                             `json:"index"`
	Delta                ChatCompletionStreamChoiceDelta `json:"delta"`
	FinishReason         any                             `json:"finish_reason"`
	ContentFilterResults any                             `json:"content_filter_results,omitempty"`
	Usage                *Usage                          `json:"usage,omitempty"`
}

func (c *ChatCompletionStreamChoice) CheckChoice(request *ChatCompletionRequest) {
	if request.Functions != nil && c.Delta.ToolCalls != nil {
		c.Delta.ToolToFuncCalls()
		c.FinishReason = FinishReasonToolCalls
	}
}

type ChatCompletionStreamResponse struct {
	ID                string                       `json:"id"`
	Object            string                       `json:"object"`
	Created           any                          `json:"created"`
	Model             string                       `json:"model"`
	Choices           []ChatCompletionStreamChoice `json:"choices"`
	PromptAnnotations any                          `json:"prompt_annotations,omitempty"`
	Usage             *Usage                       `json:"usage,omitempty"`
}

func (c *ChatCompletionStreamResponse) GetResponseText() (responseText string) {
	for _, choice := range c.Choices {
		responseText += choice.Delta.Content
	}

	return
}

type ChatAudio struct {
	Voice  string `json:"voice"`
	Format string `json:"format"`
}

type MultimediaData struct {
	Data       string `json:"data"`
	ExpiresAt  int64  `json:"expires_at,omitempty"`
	ID         string `json:"id,omitempty"`
	Transcript string `json:"transcript,omitempty"`
}

func (c *ChatCompletionRequest) ToResponsesRequest() *OpenAIResponsesRequest {

	res := &OpenAIResponsesRequest{
		Model:             c.Model,
		MaxOutputTokens:   c.MaxTokens,
		ParallelToolCalls: c.ParallelToolCalls,
		Stream:            c.Stream,
		Temperature:       c.Temperature,
		ToolChoice:        c.ToolChoice,
		TopP:              c.TopP,
	}

	if c.ResponseFormat != nil {
		res.Text = &ResponsesText{}

		if c.ResponseFormat.Type != "" {
			res.Text.Format = &ResponsesTextFormat{
				Type: c.ResponseFormat.Type,
			}
		}

		if c.ResponseFormat.JsonSchema != nil && res.Text.Format != nil {
			res.Text.Format.Name = c.ResponseFormat.JsonSchema.Name
			res.Text.Format.Schema = c.ResponseFormat.JsonSchema.Schema
			res.Text.Format.Description = c.ResponseFormat.JsonSchema.Description
			res.Text.Format.Strict = c.ResponseFormat.JsonSchema.Strict
		}

	}

	if c.Verbosity != "" {
		if res.Text == nil {
			res.Text = &ResponsesText{}
		}

		res.Text.Verbosity = c.Verbosity
	}

	if c.MaxCompletionTokens > 0 && c.MaxTokens == 0 {
		res.MaxOutputTokens = c.MaxCompletionTokens
	}

	if c.Reasoning != nil {
		res.Reasoning = &ReasoningEffort{
			Summary: c.Reasoning.Summary,
		}

		if c.Reasoning.Effort != "" {
			res.Reasoning.Effort = &c.Reasoning.Effort
		}
	}

	if c.ReasoningEffort != nil && res.Reasoning == nil {
		res.Reasoning = &ReasoningEffort{
			Effort: c.ReasoningEffort,
		}
	}

	if len(c.Tools) > 0 {
		resTools := make([]ResponsesTools, 0)
		for _, tool := range c.Tools {
			if tool.Type == "function" && tool.Function.Name != "" {
				resTools = append(resTools, ResponsesTools{
					Type:        tool.Type,
					Name:        tool.Function.Name,
					Description: tool.Function.Description,
					Parameters:  tool.Function.Parameters,
					Strict:      tool.Function.Strict,
				})
				continue
			}

			tool.ResponsesTools.Type = tool.Type
			resTools = append(resTools, tool.ResponsesTools)
		}

		if len(resTools) > 0 {
			res.Tools = resTools
		}
	}

	inputs := make([]InputResponses, 0)
	for _, msg := range c.Messages {
		// 处理ToolCalls
		if len(msg.ToolCalls) > 0 {
			for _, tool := range msg.ToolCalls {
				if tool == nil || tool.Function == nil {
					continue
				}
				inputs = append(inputs, InputResponses{
					Type:      InputTypeFunctionCall,
					CallID:    tool.Id,
					Name:      tool.Function.Name,
					Arguments: tool.Function.Arguments,
				})
			}

			continue
		}

		if msg.ToolCallID != "" {
			inputs = append(inputs, InputResponses{
				Type:   InputTypeFunctionCallOutput,
				CallID: msg.ToolCallID,
				Output: msg.Content,
			})

			continue
		}

		input := InputResponses{
			Type: InputTypeMessage,
			Role: msg.Role,
		}

		inputContent := make([]ContentResponses, 0)

		messges := msg.ParseContent()
		for _, part := range messges {
			switch part.Type {
			case ContentTypeImageURL:
				if part.ImageURL == nil {
					continue
				}
				inputContent = append(inputContent, ContentResponses{
					Type:     ContentTypeInputImage,
					ImageUrl: part.ImageURL.URL,
				})
			case ContentTypeText:
				roleType := ContentTypeInputText
				if msg.Role == ChatMessageRoleAssistant {
					roleType = ContentTypeOutputText
				}
				inputContent = append(inputContent, ContentResponses{
					Type: roleType,
					Text: part.Text,
				})
			}
		}

		if len(inputContent) > 0 {
			input.Content = inputContent
			inputs = append(inputs, input)
		}
	}

	if len(inputs) > 0 {
		res.Input = inputs
	}

	return res
}
