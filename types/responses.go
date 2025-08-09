package types

import (
	"encoding/json"
	"errors"
	"fmt"
	"one-api/common/utils"
)

const (
	APITollTypeWebSearchPreview = "web_search_preview"
	APITollTypeFileSearch       = "file_search"
	APITollTypeCodeInterpreter  = "code_interpreter"
	APITollTypeImageGeneration  = "image_generation"
)

// message / file_search_call / computer_call / web_search_call / computer_call_output / function_call / function_call_output / reasoning / image_generation_call / code_interpreter_call / local_shell_call / local_shell_call_output / mcp_list_tools / mcp_approval_request / mcp_approval_response / mcp_call

const (
	InputTypeMessage              = "message"
	InputTypeFileSearchCall       = "file_search_call"
	InputTypeComputerCall         = "computer_call"
	InputTypeWebSearchCall        = "web_search_call"
	InputTypeComputerCallOutput   = "computer_call_output"
	InputTypeFunctionCall         = "function_call"
	InputTypeFunctionCallOutput   = "function_call_output"
	InputTypeReasoning            = "reasoning"
	InputTypeImageGenerationCall  = "image_generation_call"
	InputTypeCodeInterpreterCall  = "code_interpreter_call"
	InputTypeLocalShellCall       = "local_shell_call"
	InputTypeLocalShellCallOutput = "local_shell_call_output"
	InputTypeMCPListTools         = "mcp_list_tools"
	InputTypeMCPApprovalRequest   = "mcp_approval_request"
	InputTypeMCPApprovalResponse  = "mcp_approval_response"
	InputTypeMCPCall              = "mcp_call"
)

// input_text / input_image / input_file / output_text / refusal
const (
	ContentTypeInputText   = "input_text"
	ContentTypeInputImage  = "input_image"
	ContentTypeInputFile   = "input_file"
	ContentTypeOutputText  = "output_text"
	ContentTypeSummaryText = "summary_text"
	ContentTypeRefusal     = "refusal"
)

// completed, failed, in_progress, cancelled, queued, or incomplete
const (
	ResponseStatusCompleted  = "completed"
	ResponseStatusFailed     = "failed"
	ResponseStatusInProgress = "in_progress"
	ResponseStatusCancelled  = "cancelled"
	ResponseStatusQueued     = "queued"
	ResponseStatusIncomplete = "incomplete"
)

type OpenAIResponsesRequest struct {
	Input              any              `json:"input,omitempty"`
	Model              string           `json:"model" binding:"required"`
	Include            any              `json:"include,omitempty"`
	Instructions       string           `json:"instructions,omitempty"`
	MaxOutputTokens    int              `json:"max_output_tokens,omitempty"`
	MaxToolCalls       *int             `json:"max_tool_calls,omitempty"`
	ParallelToolCalls  bool             `json:"parallel_tool_calls,omitempty"`
	PreviousResponseID string           `json:"previous_response_id,omitempty"`
	Reasoning          *ReasoningEffort `json:"reasoning,omitempty"`
	Store              *bool            `json:"store,omitempty"` // 是否存储响应结果
	Stream             bool             `json:"stream,omitempty"`
	Temperature        *float64         `json:"temperature,omitempty"`
	Text               *ResponsesText   `json:"text,omitempty"`
	ToolChoice         any              `json:"tool_choice,omitempty"`
	Tools              []ResponsesTools `json:"tools,omitempty"`
	TopLogProbs        any              `json:"top_logprobs,omitempty"` // The number of top log probabilities to return for each token in the response.
	TopP               *float64         `json:"top_p,omitempty"`
	Truncation         string           `json:"truncation,omitempty"`

	ConvertChat bool `json:"-"`
}

type ResponsesText struct {
	Format    *ResponsesTextFormat `json:"format,omitempty"`
	Verbosity string               `json:"verbosity,omitempty"`
}

type ResponsesTextFormat struct {
	Type        string `json:"type,omitempty"`
	Name        string `json:"name,omitempty"` // The name of the text format. This is used to identify the text format in the response.
	Schema      any    `json:"schema,omitempty"`
	Description string `json:"description,omitempty"`
	Strict      any    `json:"strict,omitempty"`
}

func (r *OpenAIResponsesRequest) ToChatCompletionRequest() (*ChatCompletionRequest, error) {

	chat := &ChatCompletionRequest{
		Model:             r.Model,
		MaxTokens:         r.MaxOutputTokens,
		ParallelToolCalls: r.ParallelToolCalls,
		Stream:            r.Stream,
		Temperature:       r.Temperature,
		// ResponseFormat:    r.Text,
		ToolChoice: r.ToolChoice,
		TopP:       r.TopP,
	}

	if r.Text != nil && r.Text.Format != nil {
		chat.ResponseFormat = &ChatCompletionResponseFormat{
			Type: r.Text.Format.Type,
		}

		if r.Text.Format.Type == "json_schema" {
			chat.ResponseFormat.JsonSchema = &FormatJsonSchema{
				Description: r.Text.Format.Description,
				Name:        r.Text.Format.Name,
				Schema:      r.Text.Format.Schema,
				Strict:      r.Text.Format.Strict,
			}
		}
	}

	if len(r.Tools) > 0 {
		chatTools := make([]*ChatCompletionTool, 0)
		for _, tool := range r.Tools {
			if tool.Type != "function" {
				continue
			}
			chatTools = append(chatTools, &ChatCompletionTool{
				Type: tool.Type,
				Function: ChatCompletionFunction{
					Name:        tool.Name,
					Description: tool.Description,
					Parameters:  tool.Parameters,
					Strict:      tool.Strict,
				},
			})

		}

		if len(chatTools) > 0 {
			chat.Tools = chatTools
		}
	}

	var err error
	chat.Messages, err = r.InputToMessages()
	if err != nil {
		return nil, err
	}

	return chat, nil
}

func (r *OpenAIResponsesRequest) ParseInput() ([]InputResponses, error) {
	inputs := make([]InputResponses, 0)
	if input, ok := r.Input.(string); ok {
		inputs = append(inputs, InputResponses{
			Role:    "user",
			Content: input,
			Type:    InputTypeMessage,
		})
		return inputs, nil
	}

	contentBytes, err := json.Marshal(r.Input)
	if err != nil {
		return nil, errors.New("failed to marshal input")
	}

	err = json.Unmarshal(contentBytes, &inputs)
	if err != nil {
		return nil, errors.New("failed to unmarshal input")
	}

	return inputs, nil
}

func (r *OpenAIResponsesRequest) InputToMessages() ([]ChatCompletionMessage, error) {
	messages := make([]ChatCompletionMessage, 0)

	if r.Instructions != "" {
		messages = append(messages, ChatCompletionMessage{
			Role:    "system",
			Content: r.Instructions,
		})
	}

	inputs, err := r.ParseInput()
	if err != nil {
		return nil, err
	}

	for _, item := range inputs {
		switch item.Type {
		case InputTypeMessage, "":
			if item.Content == nil {
				return nil, errors.New("message content is nil")
			}

			contents, err := item.ParseContent()
			if err != nil {
				return nil, err
			}

			msg := ChatCompletionMessage{
				Role: item.Role,
			}
			msgContents := make([]ChatMessagePart, 0)
			for _, contentItem := range contents {
				msgContent, err := contentItem.ToChatContent()
				if err != nil {
					return nil, err
				}

				if msgContent != nil {
					msgContents = append(msgContents, *msgContent)
				}
			}

			if len(msgContents) == 0 {
				return nil, errors.New("message contents cannot be empty")
			}

			msg.Content = msgContents
			messages = append(messages, msg)

		case InputTypeFunctionCall:
			messages = append(messages, ChatCompletionMessage{
				Role: "assistant",
				ToolCalls: []*ChatCompletionToolCalls{
					{
						Id:   item.CallID,
						Type: "function",
						Function: &ChatCompletionToolCallsFunction{
							Name:      item.Name,
							Arguments: item.Arguments,
						},
					},
				},
			})

		case InputTypeFunctionCallOutput:
			messages = append(messages, ChatCompletionMessage{
				Role:       "tool",
				ToolCallID: item.CallID,
				Content:    item.Output,
			})

		default:
			continue
		}
	}

	return messages, nil
}

type InputResponses struct {
	Role    string `json:"role,omitempty"`
	Content any    `json:"content,omitempty"` // string or ContentResponses
	Type    string `json:"type,omitempty"`    // message / file_search_call / computer_call / web_search_call / computer_call_output / function_call / function_call_output / reasoning / image_generation_call / code_interpreter_call / local_shell_call / local_shell_call_output / mcp_list_tools / mcp_approval_request / mcp_approval_response / mcp_call
	Status  string `json:"status,omitempty"`  // The status of item. One of in_progress, completed, or incomplete. Populated when items are returned via API.

	// file_search_call
	ID      string `json:"id,omitempty"`
	Queries any    `json:"queries,omitempty"`
	Results any    `json:"results,omitempty"` // The results of the file search call.

	// computer_call
	Action              any    `json:"action,omitempty"`
	CallID              string `json:"call_id,omitempty"`
	PendingSafetyChecks any    `json:"pending_safety_checks,omitempty"`

	// computer_call_output
	Output                   any `json:"output,omitempty"`
	AcknowledgedSafetyChecks any `json:"acknowledged_safety_checks,omitempty"`

	// function_call
	Name      string `json:"name,omitempty"`
	Arguments string `json:"arguments,omitempty"`

	// reasoning
	Summary          *SummaryResponses `json:"summary,omitempty"`
	EncryptedContent *string           `json:"encrypted_content,omitempty"`

	// image_generation_call
	Result any `json:"result,omitempty"`

	// code_interpreter_call
	Code        string `json:"code,omitempty"`
	ContainerID string `json:"container_id,omitempty"`

	// mcp_list_tools
	ServerLabel string `json:"server_label,omitempty"`
	Tools       any    `json:"tools,omitempty"`
	Error       string `json:"error,omitempty"`

	// mcp_approval_request
	ApprovalRequestID string `json:"approval_request_id,omitempty"`
	Approve           bool   `json:"approve,omitempty"`
	Reason            string `json:"reason,omitempty"`

	Input any `json:"input,omitempty"` // The input to the tool call. This can be a string or a list of ContentResponses.
}

func (i *InputResponses) ParseContent() ([]ContentResponses, error) {
	contents := make([]ContentResponses, 0)

	if i.Content == nil {
		return nil, errors.New("content is nil")
	}

	if content, ok := i.Content.(string); ok {
		contents = append(contents, ContentResponses{
			Type: ContentTypeInputText,
			Text: content,
		})
		return contents, nil
	}

	contentBytes, err := json.Marshal(i.Content)
	if err != nil {
		return nil, errors.New("failed to marshal content")
	}

	err = json.Unmarshal(contentBytes, &contents)
	if err != nil {
		return nil, errors.New("failed to unmarshal content")
	}

	return contents, nil
}

type ContentResponses struct {
	Type string `json:"type"` // input_text / input_image / input_file / output_text / refusal
	//input_text
	Text string `json:"text,omitempty"`

	//input_image
	Detail   string `json:"detail,omitempty"`    // The detail level of the image to be sent to the model. One of high, low, or auto. Defaults to auto.
	FileId   string `json:"file_id,omitempty"`   // The ID of the file to be sent to the model.
	ImageUrl string `json:"image_url,omitempty"` // The URL of the image to be sent to the model. A fully qualified URL or base64 encoded image in a data URL.

	// input_file
	FileData string `json:"file_data,omitempty"` // The content of the file to be sent to the model.
	FileUrl  string `json:"file_url,omitempty"`  // The URL of the file to be sent to the model.
	FileName string `json:"file_name,omitempty"` // The name of the file to be sent to the model.

	// output_text
	Annotations []Annotations `json:"annotations,omitempty"` // The annotations of the text output.
	Logprobs    any           `json:"logprobs,omitempty"`

	// refusal
	Refusal *RefusalResponses `json:"refusal,omitempty"`
}

func (c *ContentResponses) ToChatContent() (*ChatMessagePart, error) {
	switch c.Type {
	case ContentTypeInputText, ContentTypeOutputText:
		return &ChatMessagePart{
			Type: "text",
			Text: c.Text,
		}, nil
	case ContentTypeInputImage:
		if c.FileId == "" && c.ImageUrl == "" {
			return nil, errors.New("input_image must have either file_id or image_url")
		}
		return &ChatMessagePart{
			Type: "image_url",
			ImageURL: &ChatMessageImageURL{
				URL:    c.ImageUrl,
				Detail: c.Detail,
			},
		}, nil
	case ContentTypeInputFile:
		if c.FileData == "" && c.FileName == "" {
			return nil, errors.New("input_file must have either file_data or file_name")
		}
		return &ChatMessagePart{
			Type: "file",
			File: &ChatMessageFile{
				Filename: c.FileName,
				FileData: c.FileData,
			},
		}, nil
	default:
		return nil, nil
	}

}

type RefusalResponses struct {
	Refusal string `json:"refusal,omitempty"`
	Type    string `json:"type,omitempty"`
}

type Annotations struct {
	Type string `json:"type"` // file_citation / url_citation / container_file_citation / file_path
	// file_citation
	FileId string `json:"file_id,omitempty"` // The ID of the file that is cited.
	Index  int    `json:"index,omitempty"`   // The index of the file that is cited.

	// url_citation
	Url        string `json:"url,omitempty"`         // The URL of the web resource.
	Title      string `json:"title,omitempty"`       // The title of the web resource.
	StartIndex int    `json:"start_index,omitempty"` // The index of the first character of the URL citation in the message.
	EndIndex   int    `json:"end_index,omitempty"`   // The index of the last character of the URL citation in the message.

	// container_file_citation
	ContainerId string `json:"container_id,omitempty"` // The ID of the container file.

}

type SummaryResponses struct {
	Type string `json:"type"`
	Text string `json:"text"`
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
	Strict      *bool  `json:"strict,omitempty"`

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
	Quality           string `json:"quality,omitempty"`
	Size              string `json:"size,omitempty"`
}

type ReasoningEffort struct {
	Effort          *string `json:"effort,omitempty"`
	GenerateSummary *string `json:"generate_summary,omitempty"` // Deprecated
	Summary         *string `json:"summary,omitempty"`
}

type OpenAIResponsesResponses struct {
	CreatedAt          any               `json:"created_at,omitempty"`
	Error              *OpenAIError      `json:"error,omitempty"`
	ID                 string            `json:"id,omitempty"`
	IncompleteDetail   *IncompleteDetail `json:"incomplete_details,omitempty"`
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

type TextResponses struct {
	Format struct {
		Type string `json:"type"`
	} `json:"format"`
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

func (m ResponsesOutput) GetSummaryString() string {
	if m.Type != InputTypeReasoning {
		return ""
	}

	summary := ""
	for _, item := range m.Summary {
		if item.Type == ContentTypeSummaryText {
			summary += item.Text
		}
	}
	return summary
}

type IncompleteDetail struct {
	Reason string `json:"reason,omitempty"`
}

type ResponsesOutput struct {
	Type    string `json:"type"`
	ID      string `json:"id"`
	Status  string `json:"status"`
	Role    string `json:"role,omitempty"`
	Content any    `json:"content,omitempty"`

	Queries             any                `json:"queries,omitempty"`
	Results             any                `json:"results,omitempty"`
	Arguments           *string            `json:"arguments,omitempty"`
	CallID              string             `json:"call_id,omitempty"`
	Name                string             `json:"name,omitempty"`
	Action              any                `json:"action,omitempty"`
	PendingSafetyChecks any                `json:"pending_safety_checks,omitempty"`
	Summary             []SummaryResponses `json:"summary,omitempty"`
	EncryptedContent    *string            `json:"encrypted_content,omitempty"`

	Code        any    `json:"code,omitempty"`
	ContainerID string `json:"container_id,omitempty"`
	Outputs     any    `json:"outputs,omitempty"`
	ServerLabel any    `json:"server_label,omitempty"`
	Error       any    `json:"error,omitempty"`
	Output      any    `json:"output,omitempty"` // The output of the tool call.
	Tools       any    `json:"tools,omitempty"`  // The tools available for the tool call.

	Background    any    `json:"background,omitempty"`
	OutputFormat  any    `json:"output_format,omitempty"`
	Quality       string `json:"quality,omitempty"`
	Result        any    `json:"result,omitempty"`         // The result of the image generation call.
	Size          string `json:"size,omitempty"`           // The size of the image to be generated.
	RevisedPrompt any    `json:"revised_prompt,omitempty"` // The revised prompt for the image generation call.
}

type ResponsesOutputToolCall struct {
	ID string `json:"id"`
}

type OpenAIResponsesStreamResponses struct {
	Type           string `json:"type"`            // 始终存在
	SequenceNumber int    `json:"sequence_number"` // 始终存在
	// response.created  第一条数据
	// response.in_progress 第二条数据
	// response.completed  最后一条数据
	// response.failed 内容过滤返回
	// response.incomplete 内容不完整返回
	Response *OpenAIResponsesResponses `json:"response,omitempty"`

	// response.output_item.added response.output_item.done 在新项目的前后, 函数调用时，会在added先输出需要调用的函数名， done 会输出完整的项目数据
	OutputIndex *int             `json:"output_index,omitempty"` // 当前项目的索引，从0开始
	Item        *ResponsesOutput `json:"item,omitempty"`

	ItemID string `json:"item_id,omitempty"` // 项目的ID，和response.output_item 中的Item.ID一致

	// response.content_part.added response.content_part.done 在output_text的前后，done 会输出完整的output_text
	ContentIndex *int              `json:"content_index,omitempty"`
	Part         *ContentResponses `json:"part,omitempty"`

	// response.output_text.delta  response.output_text.done 文本输出
	Delta any     `json:"delta,omitempty"` // 仅在response.output_text.delta / response.refusal.delta / response.function_call_arguments.delta存在
	Text  *string `json:"text,omitempty"`  // 仅在response.output_text.done存在

	// response.refusal.delta response.refusal.done 拒绝输出
	Refusal *string `json:"refusal,omitempty"` // 仅在response.refusal.done存在

	// response.function_call_arguments.delta response.function_call_arguments.done
	Arguments any `json:"arguments,omitempty"` // 仅在response.function_call_arguments.done存在

	// response.reasoning_summary_part.added response.reasoning_summary_part.done 在reasoning_summary_text的前后，done 会输出完整的reasoning_summary_text
	SummaryIndex *int `json:"summary_index,omitempty"` // 当前摘要的索引，从0开始

	// response.reasoning_summary_text.delta response.reasoning_summary_text.done

	//  response.image_generation_call.completed response.image_generation_call.generating response.image_generation_call.in_progress response.image_generation_call.partial_image
	PartialImageIndex *int    `json:"partial_image_index,omitempty"` // 当前图片的索引，从0开始
	PartialImageB64   *string `json:"partial_image_b64,omitempty"`   // 仅在response.image_generation_call.partial_image存在

	// response.mcp_call.arguments.delta 时 Delta 是对象  response.mcp_call.arguments.done 时 arguments 是对象

	// response.reasoning.delta 时 delta 是对象 {"text": "reasoning text"} response.reasoning.done 在text中显示完整的推理内容

	// response.reasoning_summary.delta response.reasoning_summary.done

	// error
	Code    *string `json:"code,omitempty"`    // 错误代码
	Message *string `json:"message,omitempty"` // 错误信息
	Param   *any    `json:"param,omitempty"`   // 错误参数
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

func (u *Usage) ToResponsesUsage() *ResponsesUsage {
	responsesUsage := &ResponsesUsage{
		InputTokens:  u.PromptTokens,
		OutputTokens: u.CompletionTokens,
		TotalTokens:  u.TotalTokens,
	}

	if u.CompletionTokensDetails.ReasoningTokens > 0 {
		responsesUsage.OutputTokensDetails = &ResponsesUsageOutputTokensDetails{
			ReasoningTokens: u.CompletionTokensDetails.ReasoningTokens,
		}
	}

	responsesUsage.InputTokensDetails = &ResponsesUsageInputTokensDetails{
		CachedTokens: u.PromptTokensDetails.CachedTokens,
		TextTokens:   u.PromptTokensDetails.TextTokens,
		ImageTokens:  u.PromptTokensDetails.ImageTokens,
	}

	return responsesUsage
}

func ConvertResponsesStatusToChat(status string) string {
	switch status {
	case ResponseStatusFailed:
		return FinishReasonContentFilter
	case ResponseStatusIncomplete:
		return FinishReasonLength
	default:
		return FinishReasonStop
	}
}

func ConvertChatStatusToResponses(status string) string {
	switch status {
	case FinishReasonContentFilter:
		return ResponseStatusFailed
	case FinishReasonLength:
		return ResponseStatusIncomplete
	default:
		return ResponseStatusCompleted
	}
}

func (cc *ChatCompletionResponse) ToResponses(request *OpenAIResponsesRequest) *OpenAIResponsesResponses {
	res := &OpenAIResponsesResponses{
		CreatedAt: cc.Created,
		ID:        cc.ID,
		Model:     cc.Model,
		Object:    "response",
		Usage:     cc.Usage.ToResponsesUsage(),

		Text: TextResponses{
			Format: struct {
				Type string `json:"type"`
			}{
				Type: "text",
			},
		},
		MaxOutputTokens:   request.MaxOutputTokens,
		ParallelToolCalls: request.ParallelToolCalls,
		Temperature:       request.Temperature,
		ToolChoice:        request.ToolChoice,
		TopP:              request.TopP,
		Truncation:        request.Truncation,
		Tools:             request.Tools,
	}

	status := ResponseStatusCompleted

	outputs := make([]ResponsesOutput, 0, len(cc.Choices))
	for _, choice := range cc.Choices {
		status = ConvertChatStatusToResponses(choice.FinishReason)

		// 函数调用
		if choice.FinishReason == FinishReasonToolCalls {
			for _, tool := range choice.Message.ToolCalls {
				if tool.Function == nil {
					continue
				}
				outputs = append(outputs, ResponsesOutput{
					Type:      InputTypeFunctionCall,
					ID:        fmt.Sprintf("fc_%s", utils.GetRandomString(48)),
					Status:    ResponseStatusCompleted,
					CallID:    tool.Id,
					Name:      tool.Function.Name,
					Arguments: &tool.Function.Arguments,
				})
			}
		} else {
			// 不支持音频
			if choice.Message.Audio != nil {
				continue
			}

			content := make([]ContentResponses, 0)

			if choice.Message.Refusal != "" {
				content = append(content, ContentResponses{
					Type: ContentTypeRefusal,
					Refusal: &RefusalResponses{
						Type:    "refusal",
						Refusal: choice.Message.Refusal,
					},
				})
			}

			if choice.Message.ReasoningContent != "" {
				outputs = append(outputs, ResponsesOutput{
					Type:   InputTypeReasoning,
					ID:     fmt.Sprintf("msg_%s", utils.GetRandomString(48)),
					Status: ResponseStatusCompleted,
					Summary: []SummaryResponses{
						{
							Type: "summary_text",
							Text: choice.Message.ReasoningContent,
						},
					},
				})
			}

			chatContent, ok := choice.Message.Content.(string)
			if ok && chatContent != "" {
				content = append(content, ContentResponses{
					Type: ContentTypeOutputText,
					Text: chatContent,
				})
			}

			if len(content) > 0 {
				outputs = append(outputs, ResponsesOutput{
					Type:    InputTypeMessage,
					ID:      fmt.Sprintf("msg_%s", utils.GetRandomString(48)),
					Role:    ChatMessageRoleAssistant,
					Status:  status,
					Content: content,
				})
			}
		}

	}

	res.Status = status
	res.Output = outputs

	return res
}

func (r *OpenAIResponsesResponses) ToChat() *ChatCompletionResponse {
	resp := &ChatCompletionResponse{
		Created: r.CreatedAt,
		ID:      r.ID,
		Model:   r.Model,
		Object:  "chat.completion",
		Usage:   r.Usage.ToOpenAIUsage(),
		Choices: make([]ChatCompletionChoice, 0),
	}

	choice := ChatCompletionChoice{
		Message: ChatCompletionMessage{
			Role: ChatMessageRoleAssistant,
		},
		FinishReason: FinishReasonStop,
	}

	for _, output := range r.Output {
		switch output.Type {
		case InputTypeMessage:
			choice.Message.Content = output.StringContent()
		case InputTypeReasoning:
			choice.Message.ReasoningContent = output.GetSummaryString()
		case InputTypeFunctionCall:
			if choice.Message.ToolCalls == nil {
				choice.Message.ToolCalls = make([]*ChatCompletionToolCalls, 0)
			}
			arguments := ""
			if output.Arguments != nil {
				arguments = *output.Arguments
			}
			choice.Message.ToolCalls = append(choice.Message.ToolCalls, &ChatCompletionToolCalls{
				Id:   output.CallID,
				Type: "function",
				Function: &ChatCompletionToolCallsFunction{
					Name:      output.Name,
					Arguments: arguments,
				},
			})
			choice.FinishReason = FinishReasonToolCalls
		}

		if output.Status == ResponseStatusFailed || output.Status == ResponseStatusIncomplete {
			choice.FinishReason = ConvertResponsesStatusToChat(output.Status)
		}

	}

	resp.Choices = append(resp.Choices, choice)

	return resp
}
