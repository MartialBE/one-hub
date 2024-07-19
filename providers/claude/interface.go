package claude

import (
	"one-api/common/requester"
	"one-api/providers/base"
)

type ClaudeChatInterface interface {
	base.ProviderInterface
	CreateClaudeChat(request *ClaudeRequest) (*ClaudeResponse, *ClaudeErrorWithStatusCode)
	CreateClaudeChatStream(request *ClaudeRequest) (requester.StreamReaderInterface[string], *ClaudeErrorWithStatusCode)
}
