package safty

import (
	"errors"
	"fmt"
	"one-api/common/config"
	"one-api/common/logger"
	"one-api/safty/types"
)

// RegisterTool 注册一个新的安全检查器
// 参数:
//   - name: 检查器名称
//   - tool: 检查器实例
func RegisterTool(name string, tool SaftyTool) {
	Tools[name] = tool
	logger.SysLog(fmt.Sprintf("Safety tool %s registered", name))
}

// GetTool 根据名称获取安全检查器
// 参数:
//   - name: 检查器名称
//
// 返回值:
//   - SaftyTool: 检查器实例
//   - error: 如果检查器不存在则返回错误
func getTool(name string) (SaftyTool, error) {
	tool, ok := Tools[name]
	if !ok {
		return nil, errors.New("safety tool not found")
	}
	return tool, nil
}

// convertToString 将任意类型转换为字符串
func convertToString(data interface{}) (string, error) {
	if data == nil {
		return "", nil
	}

	switch v := data.(type) {
	case string:
		return v, nil
	case []interface{}:
		// 处理数组类型的内容
		for _, item := range v {
			if text, ok := item.(map[string]interface{}); ok {
				if textType, ok := text["type"].(string); ok && textType == "text" {
					if textContent, ok := text["content"].(string); ok {
						return textContent, nil
					}
				}
			}
		}
		return "", nil
	default:
		// 尝试使用反射获取字符串表示
		return fmt.Sprintf("%v", v), nil
	}
}

// GetAllSafeToolsName 获取所有可用的安全检查器的名称
func GetAllSafeToolsName() []string {
	var toolsName = make([]string, 0)
	for name, _ := range Tools {
		toolsName = append(toolsName, name)
	}
	return toolsName
}

// CheckContentByToolName 使用指定的检查器检查内容
// 参数:
//   - toolName: 要使用的检查器名称
//   - content: 要检查的内容，可以是任意类型
//
// 返回值:
//   - bool: 内容是否安全
//   - CheckResult: 检查结果，包括是否安全、风险级别、原因和详细信息
//   - error: 检查过程中发生的错误
func CheckContentByToolName(toolName string, content interface{}) (types.CheckResult, error) {
	if config.EnableSafe == false {
		result := types.CheckResult{
			IsSafe:    true,
			RiskLevel: 0,
			Reason:    "",
			Details:   make([]string, 0),
		}
		return result, nil
	}
	result := types.CheckResult{}
	result.RiskLevel = 0
	result.IsSafe = false
	result.Reason = "not safe"
	result.Details = make([]string, 0)
	tool, err := getTool(toolName)
	if err != nil {
		result.Reason = "tool not found"
		logger.SysLog(fmt.Sprintf("Safety tool %s not found", toolName))
		return result, err
	}

	// 将内容转换为字符串
	contentStr, err := convertToString(content)
	if err != nil {
		result.Reason = "convert to string failed"
		logger.SysLog(fmt.Sprintf("Safety tool %s convert to string failed", toolName))
		return result, err
	}

	// 如果内容为空，直接返回安全
	if contentStr == "" {
		result.RiskLevel = 0
		result.IsSafe = true
		result.Reason = ""
		return result, nil
	}

	return tool.Check(contentStr)
}

// CheckContent 使用指定的检查器检查内容
// 参数:
//   - content: 要检查的内容，可以是任意类型
//
// 返回值:
//   - bool: 内容是否安全
//   - CheckResult: 检查结果，包括是否安全、风险级别、原因和详细信息
//   - error: 检查过程中发生的错误
func CheckContent(content interface{}) (types.CheckResult, error) {
	if config.EnableSafe == false {
		result := types.CheckResult{
			IsSafe:    true,
			RiskLevel: 0,
			Code:      types.SafeDefaultSuccessCode,
			Reason:    types.SafeDefaultSuccessMessage,
			Details:   make([]string, 0),
		}
		return result, nil
	}
	result := types.CheckResult{}
	result.RiskLevel = 1
	result.IsSafe = false
	result.Code = types.SafeDefaultSuccessCode
	result.Reason = types.SafeDefaultErrorMessage
	result.Details = make([]string, 0)
	tool, err := getTool(config.SafeToolName)
	if err != nil {
		result.RiskLevel = 1
		result.Code = types.SafeDefaultErrorCode
		result.Reason = types.SafeDefaultErrorMessage
		logger.SysLog(fmt.Sprintf("Safety tool %s not found", config.SafeToolName))
		return result, err
	}

	// 将内容转换为字符串
	contentStr, err := convertToString(content)
	if err != nil {
		result.RiskLevel = 1
		result.Code = types.SafeDefaultErrorCode
		result.Reason = types.SafeDefaultErrorMessage
		logger.SysLog(fmt.Sprintf("Safety tool %s convert to string failed", config.SafeToolName))
		return result, err
	}

	// 如果内容为空，直接返回安全
	if contentStr == "" {
		result.RiskLevel = 0
		result.IsSafe = true
		result.Code = types.SafeDefaultSuccessCode
		result.Reason = types.SafeDefaultSuccessMessage
		return result, nil
	}

	return tool.Check(contentStr)
}
