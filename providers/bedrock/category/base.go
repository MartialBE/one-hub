package category

import (
	"errors"
	"net/http"
	"one-api/common/requester"
	"one-api/providers/base"
	"one-api/types"
	"strings"
)

var CategoryMap = map[string]Category{}

type Category struct {
	ModelName                 string
	ChatComplete              ChatCompletionConvert
	ResponseChatComplete      ChatCompletionResponse
	ResponseChatCompleteStrem ChatCompletionStreamResponse
}

func GetCategory(modelName string) (*Category, error) {
	modelName = GetModelName(modelName)
	// 获取provider
	provider := ""

	if strings.Contains(modelName, "anthropic") {
		provider = "anthropic"
	}

	if category, exists := CategoryMap[provider]; exists {
		category.ModelName = modelName
		return &category, nil
	}

	return nil, errors.New("category_not_found")
}

func GetModelName(modelName string) string {
	bedrockMap := map[string]string{
		//cross-region model id
		"us.claude-3-sonnet-20240229":   "us.anthropic.claude-3-sonnet-20240229-v1:0",
		"us.claude-3-opus-20240229":     "us.anthropic.claude-3-opus-20240229-v1:0",
		"us.claude-3-haiku-20240307":    "us.anthropic.claude-3-haiku-20240307-v1:0",
		"us.claude-3-5-sonnet-20240620": "us.anthropic.claude-3-5-sonnet-20240620-v1:0",
		"us.claude-3-5-sonnet-20241022": "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
		"us.claude-3-5-haiku-20241022":  "us.anthropic.claude-3-5-haiku-20241022-v1:0",

		"eu.claude-3-sonnet-20240229":   "eu.anthropic.claude-3-sonnet-20240229-v1:0",
		"eu.claude-3-5-sonnet-20240620": "eu.anthropic.claude-3-5-sonnet-20240620-v1:0",
		"eu.claude-3-haiku-20240307":    "eu.anthropic.claude-3-haiku-20240307-v1:0",

		"apac.claude-3-sonnet-20240229":   "apac.anthropic.claude-3-sonnet-20240229-v1:0",
		"apac.claude-3-5-sonnet-20240620": "apac.anthropic.claude-3-5-sonnet-20240620-v1:0",
		"apac.claude-3-haiku-20240307":    "apac.anthropic.claude-3-haiku-20240307-v1:0",
		//base model id
		"claude-3-5-sonnet-20240620": "anthropic.claude-3-5-sonnet-20240620-v1:0",
		"claude-3-5-sonnet-20241022": "anthropic.claude-3-5-sonnet-20241022-v2:0",
		"claude-3-opus-20240229":     "anthropic.claude-3-opus-20240229-v1:0",
		"claude-3-sonnet-20240229":   "anthropic.claude-3-sonnet-20240229-v1:0",
		"claude-3-haiku-20240307":    "anthropic.claude-3-haiku-20240307-v1:0",
		"claude-3-5-haiku-20241022":  "anthropic.claude-3-5-haiku-20241022-v1:0",
		"claude-2.1":                 "anthropic.claude-v2:1",
		"claude-2.0":                 "anthropic.claude-v2",
		"claude-instant-1.2":         "anthropic.claude-instant-v1",
	}

	if value, exists := bedrockMap[modelName]; exists {
		modelName = value
	}

	return modelName
}

type ChatCompletionConvert func(*types.ChatCompletionRequest) (any, *types.OpenAIErrorWithStatusCode)
type ChatCompletionResponse func(base.ProviderInterface, *http.Response, *types.ChatCompletionRequest) (*types.ChatCompletionResponse, *types.OpenAIErrorWithStatusCode)

type ChatCompletionStreamResponse func(base.ProviderInterface, *types.ChatCompletionRequest) requester.HandlerPrefix[string]
