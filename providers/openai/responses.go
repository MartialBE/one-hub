package openai

import (
	"bytes"
	"encoding/json"
	"one-api/common"
	"one-api/common/config"
	"one-api/common/requester"
	"one-api/types"
	"strings"
)

type OpenAIResponsesStreamHandler struct {
	Usage  *types.Usage
	Prefix string
	Model  string
}

func (p *OpenAIProvider) CreateResponses(request *types.OpenAIResponsesRequest) (openaiResponse *types.OpenAIResponsesResponses, errWithCode *types.OpenAIErrorWithStatusCode) {
	req, errWithCode := p.GetRequestTextBody(config.RelayModeResponses, request.Model, request)
	if errWithCode != nil {
		return nil, errWithCode
	}
	defer req.Body.Close()

	response := &types.OpenAIResponsesResponses{}
	// 发送请求
	_, errWithCode = p.Requester.SendRequest(req, response, false)
	if errWithCode != nil {
		return nil, errWithCode
	}

	if response.Usage == nil || response.Usage.OutputTokens == 0 {
		response.Usage = &types.ResponsesUsage{
			InputTokens:  p.Usage.PromptTokens,
			OutputTokens: 0,
			TotalTokens:  0,
		}
		// // 那么需要计算
		response.Usage.OutputTokens = common.CountTokenText(response.GetContent(), request.Model)
		response.Usage.TotalTokens = response.Usage.InputTokens + response.Usage.OutputTokens
	}

	*p.Usage = *response.Usage.ToOpenAIUsage()

	getResponsesExtraBilling(request.Tools, p.Usage)

	return response, nil
}

func (p *OpenAIProvider) CreateResponsesStream(request *types.OpenAIResponsesRequest) (requester.StreamReaderInterface[string], *types.OpenAIErrorWithStatusCode) {
	req, errWithCode := p.GetRequestTextBody(config.RelayModeResponses, request.Model, request)
	if errWithCode != nil {
		return nil, errWithCode
	}
	defer req.Body.Close()

	// 发送请求
	resp, errWithCode := p.Requester.SendRequestRaw(req)
	if errWithCode != nil {
		return nil, errWithCode
	}

	chatHandler := OpenAIResponsesStreamHandler{
		Usage:  p.Usage,
		Prefix: `data: {"type"`,
		Model:  request.Model,
	}

	return requester.RequestNoTrimStream(p.Requester, resp, chatHandler.HandlerChatStream)
}

func (h *OpenAIResponsesStreamHandler) HandlerChatStream(rawLine *[]byte, dataChan chan string, errChan chan error) {
	rawStr := string(*rawLine)

	// 如果rawLine 前缀不为data:，则直接返回
	if !strings.HasPrefix(rawStr, h.Prefix) {
		dataChan <- rawStr
		return
	}

	noSpaceLine := bytes.TrimSpace(*rawLine)
	if strings.HasPrefix(string(noSpaceLine), "data: ") {
		// 去除前缀
		noSpaceLine = noSpaceLine[6:]
	}

	var openaiResponse types.OpenAIResponsesStreamResponses
	err := json.Unmarshal(noSpaceLine, &openaiResponse)
	if err != nil {
		errChan <- common.ErrorToOpenAIError(err)
		return
	}

	switch openaiResponse.Type {
	case "response.output_text.delta":
		delta, ok := openaiResponse.Delta.(string)
		if ok {
			h.Usage.TextBuilder.WriteString(delta)
		}
	case "response.completed":
		if openaiResponse.Response != nil {
			usage := openaiResponse.Response.Usage
			*h.Usage = *usage.ToOpenAIUsage()
			getResponsesExtraBilling(openaiResponse.Response.Tools, h.Usage)
		}
	}

	dataChan <- rawStr
}

func getResponsesExtraBilling(tools []types.ResponsesTools, usage *types.Usage) {
	if len(tools) == 0 || usage == nil {
		return
	}

	for _, tool := range tools {
		switch tool.Type {
		case types.APITollTypeWebSearchPreview:
			searchType := "medium"
			if tool.SearchContextSize != "" {
				searchType = tool.SearchContextSize
			}
			usage.IncExtraBilling(types.APITollTypeWebSearchPreview, searchType)
		case types.APITollTypeCodeInterpreter:
			usage.IncExtraBilling(types.APITollTypeCodeInterpreter, "")
		case types.APITollTypeFileSearch:
			usage.IncExtraBilling(types.APITollTypeFileSearch, "")
		}
	}
}
