package zhipu

import (
	"one-api/types"
	"time"
)

type ZhipuWebSearch struct {
	Enable      bool   `json:"enable"`
	SearchQuery string `json:"search_query,omitempty"`
}

type ZhipuRetrieval struct {
	KnowledgeId    string `json:"knowledge_id"`
	PromptTemplate string `json:"prompt_template,omitempty"`
}

type ZhipuTool struct {
	Type            string                        `json:"type"`
	Function        *types.ChatCompletionFunction `json:"function,omitempty"`
	WebSearch       *ZhipuWebSearch               `json:"web_search,omitempty"`
	Retrieval       *ZhipuRetrieval               `json:"retrieval,omitempty"`
	WebBrowser      any                           `json:"web_browser,omitempty"`
	DrawingTool     any                           `json:"drawing_tool,omitempty"`
	CodeInterpreter any                           `json:"code_interpreter,omitempty"`
}
type ZhipuRequest struct {
	Model       string                        `json:"model"`
	Messages    []types.ChatCompletionMessage `json:"messages"`
	Stream      bool                          `json:"stream,omitempty"`
	Temperature float64                       `json:"temperature,omitempty"`
	TopP        float64                       `json:"top_p,omitempty"`
	MaxTokens   int                           `json:"max_tokens,omitempty"`
	Stop        []string                      `json:"stop,omitempty"`
	Tools       []ZhipuTool                   `json:"tools,omitempty"`
	ToolChoice  any                           `json:"tool_choice,omitempty"`
}

// type ZhipuMessage struct {
// 	Role       string                           `json:"role"`
// 	Content    string                           `json:"content"`
// 	ToolCalls  []*types.ChatCompletionToolCalls `json:"tool_calls,omitempty"`
// 	ToolCallId string                           `json:"tool_call_id,omitempty"`
// }

type ZhipuResponse struct {
	ID      string                       `json:"id"`
	Created int64                        `json:"created"`
	Model   string                       `json:"model"`
	Choices []types.ChatCompletionChoice `json:"choices"`
	Usage   *types.Usage                 `json:"usage,omitempty"`
	ZhipuResponseError
}

type ZhipuStreamResponse struct {
	ID      string        `json:"id"`
	Created int64         `json:"created"`
	Choices []ZhipuChoice `json:"choices"`
	Usage   *types.Usage  `json:"usage,omitempty"`
	ZhipuResponseError
}

func (z *ZhipuStreamResponse) ToOpenAIChoices() []types.ChatCompletionStreamChoice {
	choices := make([]types.ChatCompletionStreamChoice, 0, len(z.Choices))

	for _, choice := range z.Choices {
		choices = append(choices, choice.ToOpenAIChoice())
	}

	return choices
}

func (z *ZhipuStreamResponse) IsFunction() bool {
	if z.Choices == nil {
		return false
	}

	choice := z.Choices[0]

	return choice.IsFunction()
}

func (z *ZhipuStreamResponse) IsCodeInterpreter() bool {
	if z.Choices == nil {
		return false
	}

	choice := z.Choices[0]

	if choice.Delta.ToolCalls == nil {
		return false
	}

	toolCall := choice.Delta.ToolCalls[0]

	return toolCall.Type == "code_interpreter" && toolCall.CodeInterpreter.Outputs == nil
}

type ZhipuChoice struct {
	Index                int          `json:"index"`
	Delta                ZhipuDelta   `json:"delta"`
	FinishReason         string       `json:"finish_reason"`
	ContentFilterResults any          `json:"content_filter_results,omitempty"`
	Usage                *types.Usage `json:"usage,omitempty"`
}

func (z *ZhipuChoice) ToOpenAIChoice() types.ChatCompletionStreamChoice {
	choice := types.ChatCompletionStreamChoice{
		Index:                z.Index,
		Delta:                z.Delta.ToOpenAIDelta(),
		ContentFilterResults: z.ContentFilterResults,
		Usage:                z.Usage,
	}

	if z.IsFunction() || z.FinishReason != "tool_calls" {
		choice.FinishReason = z.FinishReason
	}

	return choice
}

func (z *ZhipuChoice) IsFunction() bool {
	if z.Delta.ToolCalls == nil {
		return false
	}
	toolCall := z.Delta.ToolCalls[0]

	return toolCall.Type == "function"
}

type ZhipuDelta struct {
	Content   string            `json:"content,omitempty"`
	Role      string            `json:"role,omitempty"`
	ToolCalls []*ZhipuToolCalls `json:"tool_calls,omitempty"`
}

func (z *ZhipuDelta) ToOpenAIDelta() types.ChatCompletionStreamChoiceDelta {
	delta := types.ChatCompletionStreamChoiceDelta{
		Role: z.Role,
	}

	content := z.Content
	changeRole := false
	if z.ToolCalls != nil {
		toolCalls := make([]*types.ChatCompletionToolCalls, 0)
		for _, toolCall := range z.ToolCalls {
			switch toolCall.Type {
			case "web_browser":
				content += toolCall.WebBrowser.ToMarkdown()
				changeRole = true
			case "drawing_tool":
				content += toolCall.DrawingTool.ToMarkdown()
				changeRole = true
			case "code_interpreter":
				content += toolCall.CodeInterpreter.ToMarkdown()
				changeRole = true
			default:
				toolCalls = append(toolCalls, &toolCall.ChatCompletionToolCalls)
				delta.ToolCalls = toolCalls
			}
		}
	}

	if changeRole {
		delta.Role = types.ChatMessageRoleAssistant
	}

	delta.Content = content
	return delta
}

type ZhipuToolCalls struct {
	types.ChatCompletionToolCalls
	WebBrowser      *ZhipuPlugin[WebBrowserPlugin]      `json:"web_browser,omitempty"`
	DrawingTool     *ZhipuPlugin[DrawingToolPlugin]     `json:"drawing_tool,omitempty"`
	CodeInterpreter *ZhipuPlugin[CodeInterpreterPlugin] `json:"code_interpreter,omitempty"`
}

type PluginMD interface {
	ToMarkdown() string
}

type ZhipuPlugin[T PluginMD] struct {
	Input   string `json:"input,omitempty"`
	Outputs []T    `json:"outputs,omitempty"`
}

func (z *ZhipuPlugin[T]) ToMarkdown() string {
	if z.Outputs == nil {
		return z.Input
	}

	markdown := "\n"

	for _, output := range z.Outputs {
		markdown += output.ToMarkdown()
	}

	return markdown
}

type WebBrowserPlugin struct {
	Title   string `json:"title,omitempty"`
	Link    string `json:"link,omitempty"`
	Content string `json:"content,omitempty"`
}

func (z WebBrowserPlugin) ToMarkdown() string {
	markdown := ""
	markdown += "[" + z.Title + "](" + z.Link + ")\n"
	markdown += z.Content + "\n\n"

	return markdown
}

type DrawingToolPlugin struct {
	Image string `json:"image,omitempty"`
}

func (z DrawingToolPlugin) ToMarkdown() string {
	markdown := ""
	markdown += "![" + z.Image + "](" + z.Image + ")\n\n"

	return markdown
}

type CodeInterpreterPlugin struct {
	Type string `json:"type,omitempty"`
	File string `json:"file,omitempty"`
	Logs string `json:"logs,omitempty"`
}

func (z CodeInterpreterPlugin) ToMarkdown() string {
	markdown := ""

	switch z.Type {
	case "file":
		markdown += "[结果文件](" + z.File + ")\n"
	case "logs":
		markdown += "```\n" + z.Logs + "\n```\n"
	}

	return markdown
}

func (z *ZhipuStreamResponse) GetResponseText() (responseText string) {
	for _, choice := range z.Choices {
		responseText += choice.Delta.Content
	}

	return
}

type ZhipuResponseError struct {
	Error ZhipuError `json:"error,omitempty"`
}

type ZhipuError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type ZhipuEmbeddingRequest struct {
	Model string `json:"model"`
	Input string `json:"input"`
}

type ZhipuEmbeddingResponse struct {
	Model  string            `json:"model"`
	Data   []types.Embedding `json:"data"`
	Object string            `json:"object"`
	Usage  *types.Usage      `json:"usage"`
	ZhipuResponseError
}

type ZhipuImageGenerationRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
}

type ZhipuImageGenerationResponse struct {
	Model string                         `json:"model"`
	Data  []types.ImageResponseDataInner `json:"data,omitempty"`
	ZhipuResponseError
}

type zhipuTokenData struct {
	Token      string
	ExpiryTime time.Time
}
