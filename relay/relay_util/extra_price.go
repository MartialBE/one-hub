package relay_util

import (
	"one-api/types"
	"strings"
)

// 暂时先放这里，简单处理
type ExtraServicePriceConfig struct {
	// Web Search 价格配置
	WebSearch map[string]map[string]float64 `json:"web_search"` // tier -> context_size -> price
	// File Search 价格
	FileSearch float64 `json:"file_search"`
	// Code Interpreter 价格
	CodeInterpreter float64 `json:"code_interpreter"`
}

var defaultExtraServicePrices = ExtraServicePriceConfig{
	WebSearch: map[string]map[string]float64{
		"high_tier": {
			"low":    0.030,
			"medium": 0.035,
			"high":   0.050,
		},
		"standard": {
			"low":    0.025,
			"medium": 0.0275,
			"high":   0.030,
		},
	},
	FileSearch:      0.0025,
	CodeInterpreter: 0.03,
}

func getModelTier(modelName string) string {
	// 高级模型：gpt-4.1, gpt-4o, gpt-4o-search-preview (但不包含 mini)
	if (strings.HasPrefix(modelName, "gpt-4.1") || strings.HasPrefix(modelName, "gpt-4o")) &&
		!strings.Contains(modelName, "mini") {
		return "high_tier"
	}
	return "standard"
}

// 获取默认的额外服务价格
func getDefaultExtraServicePrice(serviceType, modelName, extraType string) float64 {
	switch serviceType {
	case types.APITollTypeWebSearchPreview:
		tier := getModelTier(modelName)
		if extraType == "" {
			extraType = "medium"
		}
		if prices, ok := defaultExtraServicePrices.WebSearch[tier]; ok {
			if price, ok := prices[extraType]; ok {
				return price
			}
		}
		// 默认返回标准层级的 medium 价格
		return defaultExtraServicePrices.WebSearch["standard"]["medium"]
	case types.APITollTypeFileSearch:
		return defaultExtraServicePrices.FileSearch
	case types.APITollTypeCodeInterpreter:
		return defaultExtraServicePrices.CodeInterpreter
	default:
		return 0
	}
}
