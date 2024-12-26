package check_channel

import (
	"fmt"
	"one-api/types"
	"strings"
)

type CheckErrorProcess struct {
	ModelName string
}

func CreateCheckErrorProcess(modelName string) *CheckErrorProcess {
	return &CheckErrorProcess{
		ModelName: modelName,
	}
}

func (c *CheckErrorProcess) GetName() string {
	return "错误检测"
}

func (c *CheckErrorProcess) GetRequest() *types.ChatCompletionRequest {
	return &types.ChatCompletionRequest{
		Model: c.ModelName,
		Messages: []types.ChatCompletionMessage{
			{
				Role:    types.ChatMessageRoleUser,
				Content: "hi",
			},
			{
				Role:    "user11",
				Content: "hi",
			},
		},
	}
}

func (c *CheckErrorProcess) Check(req *types.ChatCompletionRequest, resp *types.ChatCompletionResponse, openaiErr *types.OpenAIError) []*CheckResult {
	checkResults := make([]*CheckResult, 0)
	if openaiErr == nil {
		checkResults = append(checkResults, &CheckResult{
			Name:   "响应",
			Status: CheckStatusFailed,
			Remark: "应该有报错，但是没有报错（不是绝对的，自行判断）",
		})
		return checkResults
	}

	// 判断错误中存在多少个 request id:
	requestIDCount := strings.Count(openaiErr.Message, "request id:")

	checkResults = append(checkResults, &CheckResult{
		Name:   "错误",
		Status: CheckStatusSuccess,
		Remark: fmt.Sprintf("错误中存在 %d 个 request id(此指标表示经过多少个类oneapi程序)", requestIDCount),
	})
	return checkResults
}
