package bedrock

import "one-api/providers/claude"

const awsService = "bedrock"
const anthropicVersion = "bedrock-2023-05-31"

var bedrockMap = map[string]string{
	"claude-3-sonnet-20240229": "anthropic.claude-3-sonnet-20240229-v1:0",
	"claude-3-haiku-20240307":  "anthropic.claude-3-haiku-20240307-v1:0",
	"claude-2.1":               "anthropic.claude-v2:1",
	"claude-instant-1.2":       "anthropic.claude-instant-v1",
}

type ClaudeRequest struct {
	*claude.ClaudeRequest
	AnthropicVersion string `json:"anthropic_version"`
}

type BedrockError struct {
	Message string `json:"message"`
}
