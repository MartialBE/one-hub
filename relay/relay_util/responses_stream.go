package relay_util

import (
	"encoding/json"
	"fmt"
	"one-api/common/utils"
	"one-api/types"

	"github.com/gin-gonic/gin"
)

type responsesHandler func(response *types.OpenAIResponsesStreamResponses)

type OpenAIResponsesStreamConverter struct {
	sequenceNumber    int
	lastChoiceIndex   int
	lastResponseType  string
	outputIndex       int
	contentIndex      int
	summaryIndex      int
	responses         *types.OpenAIResponsesResponses
	item              *types.ResponsesOutput
	part              *types.ContentResponses
	content           []types.ContentResponses
	itemID            string
	isFirstResponse   bool
	isCompleted       bool
	c                 *gin.Context
	nowStatus         string
	lastToolCallIndex int
	usage             *types.Usage
}

func NewOpenAIResponsesStreamConverter(c *gin.Context, request *types.OpenAIResponsesRequest, usage *types.Usage) *OpenAIResponsesStreamConverter {
	converter := &OpenAIResponsesStreamConverter{
		sequenceNumber:    0,
		lastChoiceIndex:   -1,
		outputIndex:       0,
		contentIndex:      0,
		summaryIndex:      0,
		isFirstResponse:   true,
		c:                 c,
		lastToolCallIndex: 0,
		usage:             usage,
	}

	converter.initializeResponse(request)

	return converter
}

func (converter *OpenAIResponsesStreamConverter) initializeResponse(request *types.OpenAIResponsesRequest) {
	converter.responses = &types.OpenAIResponsesResponses{
		Object: "response",
		Text: types.TextResponses{
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
		Output:            make([]types.ResponsesOutput, 0),
		Status:            "in_progress",
	}
}

func (converter *OpenAIResponsesStreamConverter) ProcessStreamData(jsonStr string) {
	if jsonStr == "[DONE]" {
		converter.finalizeStream()
		return
	}

	var response types.ChatCompletionStreamResponse
	if err := json.Unmarshal([]byte(jsonStr), &response); err != nil {
		converter.sendError(fmt.Sprintf("解析JSON失败: %v", err))
		return
	}

	// 第一次响应创建response.created
	if converter.isFirstResponse {
		converter.responses.ID = response.ID
		converter.responses.CreatedAt = response.Created
		converter.responses.Model = response.Model
		converter.sendStreamResponse("response.created", converter.populateResponseData)
		converter.sendStreamResponse("response.in_progress", converter.populateResponseData)
		converter.isFirstResponse = false
	}

	converter.processChoices(response.Choices)

}

func (converter *OpenAIResponsesStreamConverter) ProcessError(jsonStr string) {
	converter.sendError(jsonStr)
}

// 处理choices
func (converter *OpenAIResponsesStreamConverter) processChoices(choices []types.ChatCompletionStreamChoice) {
	for _, choice := range choices {
		nowStatus, ok := choice.FinishReason.(string)
		if ok {
			converter.nowStatus = types.ConvertChatStatusToResponses(nowStatus)
		}

		currentType := converter.GetResponseType(&choice)
		// 检查是否需要创建新的output_item
		needNewOutputItem := false
		if converter.lastResponseType != currentType {
			needNewOutputItem = true
		}

		if currentType == types.InputTypeFunctionCall {

			if len(choice.Delta.ToolCalls) > 0 && converter.lastToolCallIndex != choice.Delta.ToolCalls[0].Index {
				needNewOutputItem = true
				converter.lastToolCallIndex = choice.Delta.ToolCalls[0].Index
			}
		}

		if needNewOutputItem {
			converter.createNewItem(choice, currentType)
		}

		// 处理不同类型的内容
		switch currentType {
		case types.InputTypeReasoning:
			converter.processReasoning(choice)
		case types.InputTypeFunctionCall:
			converter.processFunctionCall(choice)
		default:
			converter.processMessage(choice)
		}

		converter.lastChoiceIndex = choice.Index
		converter.lastResponseType = currentType
	}
}

// 创建新的输出项
func (converter *OpenAIResponsesStreamConverter) createNewItem(choice types.ChatCompletionStreamChoice, currentType string) {
	// 如果是新的输出类型，先结束上一个输出
	if converter.item != nil {
		converter.done()
	}

	// 生成新的itemID
	converter.generateResponseItemID(currentType)

	response := converter.buildStreamResponse("response.output_item.added")

	converter.item = &types.ResponsesOutput{
		ID:     converter.itemID,
		Type:   currentType,
		Status: "in_progress",
	}

	switch currentType {
	case types.InputTypeFunctionCall:
		if len(choice.Delta.ToolCalls) > 0 && choice.Delta.ToolCalls[0].Function != nil {
			converter.item.Arguments = &choice.Delta.ToolCalls[0].Function.Arguments
			converter.item.CallID = choice.Delta.ToolCalls[0].Id
			converter.item.Name = choice.Delta.ToolCalls[0].Function.Name
		}
	case types.InputTypeReasoning:
		converter.item.Role = choice.Delta.Role
		converter.item.Summary = []types.SummaryResponses{}
	default:
		converter.item.Role = choice.Delta.Role
		converter.item.Content = []types.ContentResponses{}
	}

	response.Item = converter.item

	converter.sendStreamEvent(response, "response.output_item.added")
}

// 结束
func (converter *OpenAIResponsesStreamConverter) done() {

	switch converter.lastResponseType {
	case types.InputTypeMessage:
		if converter.part != nil {
			converter.doneMessagePart()
		}
	case types.InputTypeReasoning:
		if converter.part != nil {
			converter.doneReasoningPart()
		}
	case types.InputTypeFunctionCall:
		converter.doneFunctionCall()
	}

	response := converter.buildStreamResponse("response.output_item.done")
	response.OutputIndex = &converter.outputIndex

	converter.item.Status = converter.nowStatus
	converter.item.Content = converter.content
	response.Item = converter.item

	if converter.item.Status == "" {
		converter.item.Status = types.ResponseStatusCompleted
	}

	converter.responses.Output = append(converter.responses.Output, *converter.item)

	converter.sendStreamEvent(response, "response.output_item.done")
	// 清空 item
	converter.item = nil
	// 清空 content
	converter.content = nil

	converter.outputIndex++
}

// 处理message类型的内容
func (converter *OpenAIResponsesStreamConverter) processMessage(choice types.ChatCompletionStreamChoice) {
	// 检查是否需要创建content_part.added
	if converter.lastChoiceIndex != choice.Index {
		// 先结束掉上一个part
		if converter.part != nil {
			converter.doneMessagePart()
		}

	}

	if converter.part == nil {
		// 创建新的part
		converter.part = &types.ContentResponses{
			Type: types.ContentTypeOutputText,
			Text: "",
		}

		response := converter.buildStreamResponseWithItemID("response.content_part.added")
		response.ContentIndex = &converter.contentIndex
		response.Part = converter.part
		converter.sendStreamEvent(response, "response.content_part.added")
	}

	// 处理文本内容
	response := converter.buildStreamResponseWithItemID("response.output_text.delta")
	response.ContentIndex = &converter.contentIndex
	response.Delta = choice.Delta.Content
	converter.sendStreamEvent(response, "response.output_text.delta")

	// 处理文本增量
	converter.part.Text += choice.Delta.Content
}

// 结束message part
func (converter *OpenAIResponsesStreamConverter) doneMessagePart() {

	// 先结束掉 response.output_text.done
	response := converter.buildStreamResponseWithItemID("response.output_text.done")
	response.ContentIndex = &converter.contentIndex
	text := converter.part.Text
	response.Text = &text
	converter.sendStreamEvent(response, "response.output_text.done")

	// 结束 part
	response = converter.buildStreamResponseWithItemID("response.content_part.done")
	response.ContentIndex = &converter.contentIndex
	part := *converter.part
	response.Part = &part
	converter.sendStreamEvent(response, "response.content_part.done")

	// contentIndex 递增
	converter.contentIndex++
	// 需要将数据添加到content中
	converter.addContent()
	// 清空 part
	converter.part = nil
}

// 处理reasoning类型的内容
func (converter *OpenAIResponsesStreamConverter) processReasoning(choice types.ChatCompletionStreamChoice) {
	// 检查是否需要创建reasoning_summary_part.added
	if converter.lastChoiceIndex != choice.Index {
		// 先结束掉上一个part
		if converter.part != nil {
			converter.doneReasoningPart()
		}

	}

	if converter.part == nil {
		// 创建新的part
		converter.part = &types.ContentResponses{
			Type: types.ContentTypeSummaryText,
			Text: "",
		}

		response := converter.buildStreamResponseWithItemID("response.reasoning_summary_part.added")
		response.ContentIndex = &converter.contentIndex
		response.Part = converter.part
		converter.sendStreamEvent(response, "response.reasoning_summary_part.added")
	}

	// 处理推理内容
	response := converter.buildStreamResponseWithItemID("response.reasoning_summary_text.delta")
	response.ContentIndex = &converter.contentIndex
	response.Delta = choice.Delta.ReasoningContent
	converter.sendStreamEvent(response, "response.reasoning_summary_text.delta")

	// 处理文本增量
	converter.part.Text += choice.Delta.ReasoningContent
}

// 结束reasoning part
func (converter *OpenAIResponsesStreamConverter) doneReasoningPart() {
	// 先结束掉 response.reasoning_summary_text.done
	response := converter.buildStreamResponseWithItemID("response.reasoning_summary_text.done")
	response.SummaryIndex = &converter.summaryIndex
	text := converter.part.Text
	response.Text = &text
	converter.sendStreamEvent(response, "response.reasoning_summary_text.done")

	// 结束 part
	response = converter.buildStreamResponseWithItemID("response.reasoning_summary_part.done")
	response.SummaryIndex = &converter.summaryIndex
	part := *converter.part
	response.Part = &part
	converter.sendStreamEvent(response, "response.reasoning_summary_part.done")

	// contentIndex 递增
	converter.summaryIndex++
	// 需要将数据添加到content中
	converter.addContent()
	// 清空 part
	converter.part = nil
}

// 处理function call类型的内容
func (converter *OpenAIResponsesStreamConverter) processFunctionCall(choice types.ChatCompletionStreamChoice) {
	response := converter.buildStreamResponseWithItemID("response.function_call_arguments.delta")

	if len(choice.Delta.ToolCalls) > 0 && choice.Delta.ToolCalls[0].Function != nil {
		tool := choice.Delta.ToolCalls[0]
		response.Delta = tool.Function.Arguments

		arguments := ""
		if converter.item.Arguments != nil {
			arguments = *converter.item.Arguments
		}

		arguments += tool.Function.Arguments
		converter.item.Arguments = &arguments
	}

	converter.sendStreamEvent(response, "response.function_call_arguments.delta")
}

// 结束function call
func (converter *OpenAIResponsesStreamConverter) doneFunctionCall() {
	response := converter.buildStreamResponseWithItemID("response.function_call_arguments.done")
	response.Arguments = converter.item.Arguments

	converter.sendStreamEvent(response, "response.function_call_arguments.done")
}

func (converter *OpenAIResponsesStreamConverter) addContent() {
	if converter.part == nil {
		return
	}

	if converter.content == nil {
		converter.content = make([]types.ContentResponses, 0)
	}

	converter.content = append(converter.content, *converter.part)
}

// 输出最终的数据
func (converter *OpenAIResponsesStreamConverter) finalizeStream() {
	if converter.item != nil {
		converter.done()
	}

	respType := "response.completed"

	switch converter.nowStatus {
	case types.ResponseStatusFailed:
		respType = "response.failed"
	case types.ResponseStatusIncomplete:
		respType = "response.incomplete"
	}

	response := converter.buildStreamResponse(respType)
	response.Response = converter.responses
	response.Response.Status = converter.nowStatus

	response.Response.Usage = converter.usage.ToResponsesUsage()

	converter.sendStreamEvent(response, respType)
}

// 获取响应流字符串
func (converter *OpenAIResponsesStreamConverter) sendStreamEvent(resp any, responseType string) {
	respStr, _ := json.Marshal(resp)

	fmt.Fprintf(converter.c.Writer, "event: %s\ndata: %s\n\n", responseType, string(respStr))
	converter.c.Writer.Flush()
}

// 错误响应
func (converter *OpenAIResponsesStreamConverter) sendError(msg string) {
	respErr := map[string]interface{}{
		"type":    "error",
		"code":    "error",
		"message": msg,
	}

	converter.sendStreamEvent(respErr, "error")
}

func (converter *OpenAIResponsesStreamConverter) generateResponseItemID(responseType string) {
	prefix := ""
	switch responseType {
	case types.InputTypeFunctionCall:
		prefix = "fc"
	case types.InputTypeReasoning:
		prefix = "rs"
	default:
		prefix = "msg"
	}

	converter.itemID = fmt.Sprintf("%s_%s", prefix, utils.GetRandomString(48))
}

func (converter *OpenAIResponsesStreamConverter) buildStreamResponse(responseType string) *types.OpenAIResponsesStreamResponses {
	response := &types.OpenAIResponsesStreamResponses{
		Type:           responseType,
		SequenceNumber: converter.sequenceNumber,
	}

	converter.sequenceNumber++

	return response
}

func (converter *OpenAIResponsesStreamConverter) buildStreamResponseWithItemID(responseType string) *types.OpenAIResponsesStreamResponses {
	response := converter.buildStreamResponse(responseType)
	response.ItemID = converter.itemID
	response.OutputIndex = &converter.outputIndex
	return response
}

func (converter *OpenAIResponsesStreamConverter) sendStreamResponse(responseType string, fn responsesHandler) {
	response := converter.buildStreamResponse(responseType)
	if fn != nil {
		fn(response)
	}

	converter.sendStreamEvent(response, responseType)
}

func (converter *OpenAIResponsesStreamConverter) populateResponseData(response *types.OpenAIResponsesStreamResponses) {
	response.Response = converter.responses
}

func (converter *OpenAIResponsesStreamConverter) GetResponseType(choice *types.ChatCompletionStreamChoice) string {
	if len(choice.Delta.ToolCalls) > 0 {
		return types.InputTypeFunctionCall
	}

	if choice.Delta.ReasoningContent != "" {
		return types.InputTypeReasoning
	}

	return types.InputTypeMessage
}
