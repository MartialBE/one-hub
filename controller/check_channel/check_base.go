package check_channel

import (
	"one-api/common/config"
	"one-api/types"
	"regexp"
	"strings"
)

type CheckBaseProcess struct {
	ModelName string
}

func CreateCheckBaseProcess(modelName string) *CheckBaseProcess {
	return &CheckBaseProcess{
		ModelName: modelName,
	}
}

func (c *CheckBaseProcess) GetName() string {
	return "基础检测"
}

func (c *CheckBaseProcess) GetRequest() *types.ChatCompletionRequest {
	req := &types.ChatCompletionRequest{
		Model: c.ModelName,
		Messages: []types.ChatCompletionMessage{
			{
				Role:    types.ChatMessageRoleUser,
				Content: "hi",
			},
		},
	}

	if strings.Contains(c.ModelName, "o1") {
		req.MaxCompletionTokens = 1
	} else {
		req.MaxTokens = 1
	}
	return req
}

func (c *CheckBaseProcess) Check(req *types.ChatCompletionRequest, resp *types.ChatCompletionResponse, openaiErr *types.OpenAIError) []*CheckResult {
	checkResults := make([]*CheckResult, 0)
	if openaiErr != nil {
		checkResults = append(checkResults, &CheckResult{
			Name:   "响应",
			Status: CheckStatusFailed,
			Remark: openaiErr.Message,
		})

		return checkResults
	}

	if resp.Usage == nil || resp.Usage.CompletionTokens <= 0 || resp.Usage.PromptTokens <= 0 {
		checkResults = append(checkResults, &CheckResult{
			Name:   "响应",
			Status: CheckStatusFailed,
			Remark: "用量数据为空",
		})
	}

	channelType := getChannelTypeByModelName(c.ModelName)

	modelCheckResult := &CheckResult{
		Name:   "模型检测",
		Status: CheckStatusFailed,
		Remark: "模型检测失败",
	}

	if resp.Model == "" {
		modelCheckResult.Remark = "返回模型为空"
	} else {
		switch channelType {
		case config.ChannelTypeOpenAI:
			// 正则 检查是否是4个数字结尾的格式 (如 gpt-4-0613)
			numberEndingPattern := regexp.MustCompile(`\d{4}$`)
			// 正则 检查是否是年月日结尾的格式 (如 gpt-4o-mini-2024-07-18)
			dateEndingPattern := regexp.MustCompile(`\d{4}-\d{2}-\d{2}$`)

			isVersioned := numberEndingPattern.MatchString(c.ModelName) || dateEndingPattern.MatchString(c.ModelName)

			// 如果是带版本的模型，那么请求模型应该等于响应模型
			if isVersioned {
				if req.Model != resp.Model {
					modelCheckResult.Remark = "请求模型与响应模型应该一致(azure除外)"
				} else {
					modelCheckResult.Status = CheckStatusSuccess
					modelCheckResult.Remark = "SUCCESS"
				}
			} else {
				// 否则，请求模型一定不等于响应模型
				if req.Model == resp.Model {
					modelCheckResult.Remark = "请求模型与响应模型不应该一致(azure除外)"
				} else {
					// 响应模型的前缀应该等于请求模型的前缀
					if strings.HasPrefix(resp.Model, req.Model) {
						modelCheckResult.Status = CheckStatusSuccess
						modelCheckResult.Remark = "SUCCESS"
					} else {
						modelCheckResult.Remark = "响应模型的前缀应该等于请求模型(azure除外)"
					}
				}
			}
		default:
			if resp.Model != req.Model {
				modelCheckResult.Remark = "请求模型与响应模型应该一致(不是绝对的，自行判断)"
			} else {
				modelCheckResult.Status = CheckStatusSuccess
				modelCheckResult.Remark = "SUCCESS"
			}
		}
	}

	checkResults = append(checkResults, modelCheckResult)

	IDCheckResult := &CheckResult{
		Name:   "ID检测",
		Status: CheckStatusFailed,
		Remark: "ID检测失败",
	}

	if resp.ID == "" {
		IDCheckResult.Remark = "ID为空(不是绝对的，比如gemini没有ID)"
	} else {
		switch channelType {
		case config.ChannelTypeOpenAI:
			if strings.HasPrefix(resp.ID, "chatcmpl-") {
				IDCheckResult.Status = CheckStatusSuccess
				IDCheckResult.Remark = "SUCCESS"
			} else {
				IDCheckResult.Remark = "ID应该以chatcmpl开头"
			}

		case config.ChannelTypeAnthropic:
			if strings.HasPrefix(resp.ID, "msg_") {
				IDCheckResult.Status = CheckStatusSuccess
				IDCheckResult.Remark = "SUCCESS"
			} else {
				IDCheckResult.Remark = "ID应该以msg_开头"
			}
		default:
			IDCheckResult.Status = CheckStatusSuccess
			IDCheckResult.Remark = "SUCCESS"
		}
	}

	checkResults = append(checkResults, IDCheckResult)

	return checkResults
}
