package gemini

import (
	"one-api/common/requester"
	"one-api/providers/base"
)

type GeminiChatInterface interface {
	base.ProviderInterface
	CreateGeminiChat(request *GeminiChatRequest) (*GeminiChatResponse, *GeminiErrorWithStatusCode)
	CreateGeminiChatStream(request *GeminiChatRequest) (requester.StreamReaderInterface[string], *GeminiErrorWithStatusCode)
}
