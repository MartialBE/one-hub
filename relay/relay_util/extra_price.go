package relay_util

import (
	"one-api/types"
	"strings"
)

// 暂时先放这里，简单处理
type ExtraServicePriceConfig struct {
	// Web Search 价格配置
	WebSearch map[string]float64 `json:"web_search"` // tier -> price
	// File Search 价格
	FileSearch float64 `json:"file_search"`
	// Code Interpreter 价格
	CodeInterpreter float64 `json:"code_interpreter"`
}

var defaultExtraServicePrices = ExtraServicePriceConfig{
	WebSearch: map[string]float64{
		"high_tier": 0.025,
		"standard":  0.01,
	},
	FileSearch:      0.0025,
	CodeInterpreter: 0.03,
}

func getModelTier(modelName string) string {
	// 高级模型：gpt-4.1, gpt-4o(包含 mini)
	if strings.HasPrefix(modelName, "gpt-4.1") || strings.HasPrefix(modelName, "gpt-4o") {
		return "high_tier"
	}
	return "standard"
}

// 获取默认的额外服务价格
func getDefaultExtraServicePrice(serviceType, modelName, extraType string) float64 {
	switch serviceType {
	case types.APITollTypeWebSearchPreview:
		tier := getModelTier(modelName)
		return defaultExtraServicePrices.WebSearch[tier]
	case types.APITollTypeFileSearch:
		return defaultExtraServicePrices.FileSearch
	case types.APITollTypeCodeInterpreter:
		return defaultExtraServicePrices.CodeInterpreter
	default:
		return 0
	}
}
