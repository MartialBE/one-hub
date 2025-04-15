package safty

import (
	"fmt"
	"one-api/common/logger"
	"one-api/safty/providers/keyword"
	"one-api/safty/types"
)

// SaftyTool 定义了内容安全检查器的接口
// 所有具体的安全检查器都需要实现这个接口
type SaftyTool interface {
	// Name 返回检查器的名称
	Name() string
	// Init 初始化检查器
	// 返回值:
	//   - error: 初始化过程中发生的错误
	Init() error
	// Check 执行内容安全检查
	// 参数:
	//   - data: 要检查的内容
	// 返回值:
	//   - bool: 内容是否安全
	//   - types.CheckResult: 检查结果
	//   - error: 检查过程中发生的错误
	Check(data string) (types.CheckResult, error)
}

// Tools 存储所有注册的安全检查器
// key: 检查器名称
// value: 检查器实例
var Tools = make(map[string]SaftyTool)

// InitSaftyTools 初始化所有安全检查器
// 在系统启动时调用此函数来注册所有可用的安全检查器
func InitSaftyTools() error {
	// 注册关键词检查器
	keywordChecker := keyword.NewKeywordChecker()
	RegisterTool("Keyword", keywordChecker)

	// 初始化所有已注册的检查器
	for name, tool := range Tools {
		if err := tool.Init(); err != nil {
			logger.SysError(fmt.Sprintf("Failed to initialize safety tool %s: %v", name, err))
			return err
		}
		logger.SysLog(fmt.Sprintf("Safety tool %s initialized successfully", name))
	}

	return nil
}
