package keyword

import (
	"fmt"
	"one-api/common/config"
	"one-api/common/logger"
	"one-api/safty/types"
	"strings"
)

// KeywordChecker 基于关键词的内容安全检查器
// 通过检查内容中是否包含预定义的关键词来判断内容是否安全
type KeywordChecker struct {
	// keywords 预定义的关键词列表
	keywords []string
	// config 检查器配置
	config *types.CheckConfig
}

// NewKeywordChecker 创建新的关键词检查器实例
// 参数:
//   - keywords: 关键词列表
//   - config: 检查器配置
//
// 返回值:
//   - *KeywordChecker: 关键词检查器实例
func NewKeywordChecker() *KeywordChecker {
	return &KeywordChecker{
		keywords: make([]string, 0),
		config: &types.CheckConfig{
			Threshold: 0.8,
			Options:   make(map[string]interface{}),
		},
	}
}

// Name 返回检查器名称
func (k *KeywordChecker) Name() string {
	return "Keyword"
}

// Init 初始化关键词检查器
// 从配置文件或数据库加载关键词列表
// 返回值:
//   - error: 初始化过程中发生的错误
func (k *KeywordChecker) Init() error {
	// 特殊供应商可以在这里进行相关配置初始化
	k.keywords = config.SafeKeyWords
	logger.SysLog(fmt.Sprintf("SafeTools %s loda keyword：%d pcs", k.Name(), len(k.keywords)))
	return nil
}

// Check 执行关键词检查
// 检查内容中是否包含预定义的关键词
// 参数:
//   - data: 要检查的内容
//
// 返回值:
//   - bool: 如果内容不包含任何关键词则返回 true，否则返回 false
//   - error: 检查过程中发生的错误
func (k *KeywordChecker) Check(data string) (types.CheckResult, error) {
	result := types.CheckResult{
		IsSafe:    false,
		RiskLevel: 1,
		Code:      types.SafeDefaultErrorCode,
		Reason:    types.SafeDefaultErrorMessage,
		Details:   make([]string, 0),
	}

	for _, keyword := range config.SafeKeyWords {
		if strings.Contains(strings.ToLower(data), strings.ToLower(keyword)) {
			result.IsSafe = false
			result.Details = append(result.Details, types.SafeDefaultErrorMessage)
			result.Code = types.SafeDefaultErrorCode
			result.Reason = types.SafeDefaultErrorMessage
			result.RiskLevel = 10
			return result, nil
		}
	}
	result.Code = types.SafeDefaultSuccessCode
	result.Reason = types.SafeDefaultSuccessMessage
	result.RiskLevel = 0
	result.IsSafe = true
	return result, nil
}
