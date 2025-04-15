package types

const SafeDefaultErrorCode = "content_security_policy_blocking"
const SafeDefaultErrorMessage = "content contains sensitive information"

const SafeDefaultSuccessCode = "content_security_policy_through"
const SafeDefaultSuccessMessage = "content safe"

// CheckResult 定义了内容安全检查的结果
type CheckResult struct {
	// IsSafe 表示内容是否安全
	IsSafe bool `json:"is_safe"`
	// 安全原因代码
	Code string `json:"code"`
	// Reason 如果不安全，说明原因
	Reason string `json:"reason,omitempty"`
	// Details 详细的检查结果，可能包含多个违规项
	Details []string `json:"details,omitempty"`
	// RiskLevel 风险等级，数值越大风险越高
	RiskLevel int `json:"risk_level,omitempty"`
}

// CheckConfig 定义了安全检查器的配置
type CheckConfig struct {
	// Threshold 检查阈值，用于判断内容是否安全
	Threshold float64 `json:"threshold"`
	// Options 其他配置选项，具体含义由检查器自行定义
	Options map[string]interface{} `json:"options,omitempty"`
}
