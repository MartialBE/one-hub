package claude

import (
	"bytes"
	"encoding/json"
	"fmt"
	"one-api/common"
	"one-api/common/requester"
	"one-api/types"
	"strings"
)

type ClaudeRelayStreamHandler struct {
	Usage      *types.Usage
	ModelName  string
	Prefix     string
	StartUsage *Usage

	AddEvent bool
}

func (p *ClaudeProvider) CreateClaudeChat(request *ClaudeRequest) (*ClaudeResponse, *ClaudeErrorWithStatusCode) {
	req, errWithCode := p.getChatRequest(request)
	if errWithCode != nil {
		return nil, OpenaiErrToClaudeErr(errWithCode)
	}
	defer req.Body.Close()

	claudeResponse := &ClaudeResponse{}
	// 发送请求
	_, errWithCode = p.Requester.SendRequest(req, claudeResponse, false)
	if errWithCode != nil {
		return nil, OpenaiErrToClaudeErr(errWithCode)
	}

	usage := p.GetUsage()

	isOk := ClaudeUsageToOpenaiUsage(&claudeResponse.Usage, usage)
	if !isOk {
		usage.CompletionTokens = ClaudeOutputUsage(claudeResponse)
		usage.TotalTokens = usage.PromptTokens + usage.CompletionTokens
	}

	return claudeResponse, nil
}

func (p *ClaudeProvider) CreateClaudeChatStream(request *ClaudeRequest) (requester.StreamReaderInterface[string], *ClaudeErrorWithStatusCode) {
	req, errWithCode := p.getChatRequest(request)
	if errWithCode != nil {
		return nil, OpenaiErrToClaudeErr(errWithCode)
	}
	defer req.Body.Close()

	chatHandler := &ClaudeRelayStreamHandler{
		Usage:     p.Usage,
		ModelName: request.Model,
		Prefix:    `data: {"type"`,
	}

	// 发送请求
	resp, errWithCode := p.Requester.SendRequestRaw(req)
	if errWithCode != nil {
		return nil, OpenaiErrToClaudeErr(errWithCode)
	}

	stream, errWithCode := requester.RequestNoTrimStream(p.Requester, resp, chatHandler.HandlerStream)
	if errWithCode != nil {
		return nil, OpenaiErrToClaudeErr(errWithCode)
	}

	return stream, nil
}

func (h *ClaudeRelayStreamHandler) HandlerStream(rawLine *[]byte, dataChan chan string, errChan chan error) {
	rawStr := string(*rawLine)
	// 如果rawLine 前缀不为data:，则直接返回
	if !strings.HasPrefix(rawStr, h.Prefix) {
		dataChan <- rawStr
		return
	}

	if h.AddEvent {
		rawStr = fmt.Sprintf("data: %s\n", rawStr)
	}

	noSpaceLine := bytes.TrimSpace(*rawLine)
	if strings.HasPrefix(string(noSpaceLine), "data: ") {
		// 去除前缀
		noSpaceLine = noSpaceLine[6:]
	}

	var claudeResponse ClaudeStreamResponse
	err := json.Unmarshal(noSpaceLine, &claudeResponse)
	if err != nil {
		errChan <- ErrorToClaudeErr(err)
		return
	}

	if claudeResponse.Error != nil {
		if h.AddEvent {
			event := "event: error\n"
			dataChan <- event
		}

		errChan <- claudeResponse.Error
		return
	}

	if h.AddEvent {
		event := fmt.Sprintf("event: %s\n", claudeResponse.Type)
		dataChan <- event
	}

	switch claudeResponse.Type {
	case "message_start":
		ClaudeUsageToOpenaiUsage(&claudeResponse.Message.Usage, h.Usage)
		h.StartUsage = &claudeResponse.Message.Usage
	case "message_delta":
		ClaudeUsageToOpenaiUsage(&claudeResponse.Usage, h.Usage)
	case "content_block_delta":
		h.Usage.CompletionTokens += common.CountTokenText(claudeResponse.Delta.Text, h.ModelName)
		h.Usage.TotalTokens = h.Usage.PromptTokens + h.Usage.CompletionTokens
	}

	dataChan <- rawStr

	if h.AddEvent {
		event := "\n"
		dataChan <- event
	}
}
