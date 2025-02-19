package gemini

import (
	"bytes"
	"encoding/json"
	"one-api/common/requester"
	"one-api/types"
	"strings"
)

type GeminiRelayStreamHandler struct {
	Usage          *types.Usage
	LastCandidates int
	LastType       string
	Prefix         string
	ModelName      string

	key string
}

func (p *GeminiProvider) CreateGeminiChat(request *GeminiChatRequest) (*GeminiChatResponse, *types.OpenAIErrorWithStatusCode) {
	req, errWithCode := p.getChatRequest(request)
	if errWithCode != nil {
		return nil, errWithCode
	}
	defer req.Body.Close()

	geminiResponse := &GeminiChatResponse{}
	// 发送请求
	_, errWithCode = p.Requester.SendRequest(req, geminiResponse, false)
	if errWithCode != nil {
		return nil, errWithCode
	}

	usage := p.GetUsage()
	*usage = convertOpenAIUsage(request.Model, geminiResponse.UsageMetadata)

	return geminiResponse, nil
}

func (p *GeminiProvider) CreateGeminiChatStream(request *GeminiChatRequest) (requester.StreamReaderInterface[string], *types.OpenAIErrorWithStatusCode) {
	req, errWithCode := p.getChatRequest(request)
	if errWithCode != nil {
		return nil, errWithCode
	}
	defer req.Body.Close()

	channel := p.GetChannel()

	chatHandler := &GeminiRelayStreamHandler{
		Usage:          p.Usage,
		ModelName:      request.Model,
		Prefix:         `data: `,
		LastCandidates: 0,
		LastType:       "",

		key: channel.Key,
	}

	// 发送请求
	resp, errWithCode := p.Requester.SendRequestRaw(req)
	if errWithCode != nil {
		return nil, errWithCode
	}

	stream, errWithCode := requester.RequestNoTrimStream(p.Requester, resp, chatHandler.HandlerStream)
	if errWithCode != nil {
		return nil, errWithCode
	}

	return stream, nil
}

func (h *GeminiRelayStreamHandler) HandlerStream(rawLine *[]byte, dataChan chan string, errChan chan error) {
	rawStr := string(*rawLine)
	// 如果rawLine 前缀不为data:，则直接返回
	if !strings.HasPrefix(rawStr, h.Prefix) {
		dataChan <- rawStr
		return
	}

	noSpaceLine := bytes.TrimSpace(*rawLine)
	noSpaceLine = noSpaceLine[6:]

	var geminiResponse GeminiChatResponse
	err := json.Unmarshal(noSpaceLine, &geminiResponse)
	if err != nil {
		errChan <- ErrorToGeminiErr(err)
		return
	}

	if geminiResponse.ErrorInfo != nil {
		cleaningError(geminiResponse.ErrorInfo, h.key)
		errChan <- geminiResponse.ErrorInfo
		return
	}

	if geminiResponse.UsageMetadata == nil || geminiResponse.Candidates[0].Content.Parts[0].CodeExecutionResult != nil {
		dataChan <- rawStr
		return
	}

	lastType := "text"
	if geminiResponse.Candidates[0].Content.Parts[0].ExecutableCode != nil {
		lastType = "code"
	}
	if h.LastType != lastType {
		h.LastCandidates = 0
		h.LastType = lastType
	}

	adjustTokenCounts(h.ModelName, geminiResponse.UsageMetadata)

	h.Usage.PromptTokens = geminiResponse.UsageMetadata.PromptTokenCount
	h.Usage.CompletionTokens += geminiResponse.UsageMetadata.CandidatesTokenCount - h.LastCandidates
	h.Usage.TotalTokens = h.Usage.PromptTokens + h.Usage.CompletionTokens
	h.LastCandidates = geminiResponse.UsageMetadata.CandidatesTokenCount

	dataChan <- rawStr
}
