package claude

import (
	"one-api/common/requester"
	"one-api/providers/base"
	"one-api/types"
)

type ClaudeChatInterface interface {
	base.ProviderInterface
	CreateClaudeChat(request *ClaudeRequest) (*ClaudeResponse, *types.OpenAIErrorWithStatusCode)
	CreateClaudeChatStream(request *ClaudeRequest) (requester.StreamReaderInterface[string], *types.OpenAIErrorWithStatusCode)
}
