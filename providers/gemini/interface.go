package gemini

import (
	"one-api/common/requester"
	"one-api/providers/base"
	"one-api/types"
)

type GeminiChatInterface interface {
	base.ProviderInterface
	CreateGeminiChat(request *GeminiChatRequest) (*GeminiChatResponse, *types.OpenAIErrorWithStatusCode)
	CreateGeminiChatStream(request *GeminiChatRequest) (requester.StreamReaderInterface[string], *types.OpenAIErrorWithStatusCode)
}
