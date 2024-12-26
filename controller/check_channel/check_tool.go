package check_channel

import (
	"encoding/json"
	"fmt"
	"one-api/types"
)

type CheckToolProcess struct {
	ModelName string
}

func CreateCheckToolProcess(modelName string) *CheckToolProcess {
	return &CheckToolProcess{
		ModelName: modelName,
	}
}

func (c *CheckToolProcess) GetName() string {
	return "函数调用检测"
}

func (c *CheckToolProcess) GetRequest() *types.ChatCompletionRequest {
	addTool := map[string]interface{}{}
	multiplyTool := map[string]interface{}{}

	json.Unmarshal([]byte(`{"properties":{"a":{"type":"integer"},"b":{"type":"integer"}},"required":["a","b"],"type":"object"}`), &addTool)
	json.Unmarshal([]byte(`{"properties":{"a":{"type":"integer"},"b":{"type":"integer"}},"required":["a","b"],"type":"object"}`), &multiplyTool)

	return &types.ChatCompletionRequest{
		Model: c.ModelName,
		Messages: []types.ChatCompletionMessage{
			{
				Role:    types.ChatMessageRoleUser,
				Content: "3 * 12是多少?然后11 + 49又是多少? 请使用函数调用",
			},
		},
		Tools: []*types.ChatCompletionTool{
			{
				Type: "function",
				Function: types.ChatCompletionFunction{
					Name:        "add",
					Description: "Adds a and b.\n\n    Args:\n        a: first int\n        b: second int",
					Parameters:  addTool,
				},
			},
			{
				Type: "function",
				Function: types.ChatCompletionFunction{
					Name:        "multiply",
					Description: "Multiplies a and b.\n\n    Args:\n        a: first int\n        b: second int",
					Parameters:  multiplyTool,
				},
			},
		},
	}
}

func (c *CheckToolProcess) Check(req *types.ChatCompletionRequest, resp *types.ChatCompletionResponse, openaiErr *types.OpenAIError) []*CheckResult {
	checkResults := make([]*CheckResult, 0)

	if openaiErr != nil {
		checkResults = append(checkResults, &CheckResult{
			Name:   "响应",
			Status: CheckStatusFailed,
			Remark: openaiErr.Message,
		})
		return checkResults
	}

	if len(resp.Choices) == 0 {
		checkResults = append(checkResults, &CheckResult{
			Name:   "函数判断",
			Status: CheckStatusFailed,
			Remark: "获取响应数据失败",
		})
		return checkResults
	}

	result := &CheckResult{
		Name:   "函数判断",
		Status: CheckStatusFailed,
		Remark: "",
	}

	firstChoice := resp.Choices[0]

	if len(firstChoice.Message.ToolCalls) == 0 {
		result.Remark = "没有使用函数调用"
		checkResults = append(checkResults, result)
		return checkResults
	}

	result.Remark = fmt.Sprintf("使用了 %d 个函数调用 (如果是2个，说明模型理解能力强)", len(firstChoice.Message.ToolCalls))
	result.Status = CheckStatusSuccess
	checkResults = append(checkResults, result)

	return checkResults
}
