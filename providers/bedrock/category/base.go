package category

import (
	"errors"
	"net/http"
	"one-api/common/requester"
	"one-api/providers/base"
	"one-api/types"
	"strings"
)

// 基础模型映射关系
var bedrockMap = map[string]string{
	//base model id
	"claude-3-7-sonnet-20250219": "anthropic.claude-3-7-sonnet-20250219-v1:0",
	"claude-3-5-sonnet-20240620": "anthropic.claude-3-5-sonnet-20240620-v1:0",
	"claude-3-5-sonnet-20241022": "anthropic.claude-3-5-sonnet-20241022-v2:0",
	"claude-3-opus-20240229":     "anthropic.claude-3-opus-20240229-v1:0",
	"claude-3-sonnet-20240229":   "anthropic.claude-3-sonnet-20240229-v1:0",
	"claude-3-haiku-20240307":    "anthropic.claude-3-haiku-20240307-v1:0",
	"claude-3-5-haiku-20241022":  "anthropic.claude-3-5-haiku-20241022-v1:0",
	"claude-2.1":                 "anthropic.claude-v2:1",
	"claude-2.0":                 "anthropic.claude-v2",
	"claude-instant-1.2":         "anthropic.claude-instant-v1",
	"claude-sonnet-4-20250514":   "anthropic.claude-sonnet-4-20250514-v1:0",
	"claude-opus-4-20250514":     "anthropic.claude-opus-4-20250514-v1:0",
	"claude-opus-4-1-20250805":   "anthropic.claude-opus-4-1-20250805-v1:0",
	"claude-sonnet-4-5-20250929": "anthropic.claude-sonnet-4-5-20250929-v1:0",
	"claude-haiku-4-5-20251001":  "anthropic.claude-haiku-4-5-20251001-v1:0",
}

// 支持的区域前缀
var regionPrefixes = []string{"global.", "us.", "eu.", "apac."}

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
	// 提取区域前缀
	regionPrefix := ""
	for _, region := range regionPrefixes {
		if strings.HasPrefix(modelName, region) {
			regionPrefix = region
			modelName = modelName[len(region):]
			break
		}
	}

	// 查找基础模型映射
	if mappedName, exists := bedrockMap[modelName]; exists {
		modelName = mappedName
	}

	// 如果有区域前缀，添加回去
	if regionPrefix != "" {
		modelName = regionPrefix + modelName
	}

	return modelName
}

type ChatCompletionConvert func(*types.ChatCompletionRequest) (any, *types.OpenAIErrorWithStatusCode)
type ChatCompletionResponse func(base.ProviderInterface, *http.Response, *types.ChatCompletionRequest) (*types.ChatCompletionResponse, *types.OpenAIErrorWithStatusCode)

type ChatCompletionStreamResponse func(base.ProviderInterface, *types.ChatCompletionRequest) requester.HandlerPrefix[string]
