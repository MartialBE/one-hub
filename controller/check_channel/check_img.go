package check_channel

import (
	_ "embed"
	"fmt"
	"net/http"
	"one-api/common/cache"
	"one-api/common/config"
	"one-api/common/utils"
	"one-api/types"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const checkKey = "check_img:%s"

var (
	//go:embed check.png
	checkImage []byte
)

type AccessRecord struct {
	UserAgent string `json:"user_agent"`
	IP        string `json:"ip"`
	Remark    string `json:"remark"`
}

type CheckImgProcess struct {
	ModelName string
	ImageUrl  string
	ID        string
}

func CreateCheckImgProcess(modelName string) *CheckImgProcess {
	c := &CheckImgProcess{
		ModelName: modelName,
	}
	id := utils.GetRandomString(10)
	c.ImageUrl = fmt.Sprintf("%s/api/image/%s", config.ServerAddress, id)
	c.ID = id
	accessRecord := make([]*AccessRecord, 0)
	err := cache.SetCache(fmt.Sprintf(checkKey, id), accessRecord, 10*time.Minute)
	if err != nil {
		return nil
	}
	return c
}

func (c *CheckImgProcess) GetName() string {
	return "根据图片判断中转"
}

func (c *CheckImgProcess) GetRequest() *types.ChatCompletionRequest {
	return &types.ChatCompletionRequest{
		Model: c.ModelName,
		Messages: []types.ChatCompletionMessage{
			{
				Role: types.ChatMessageRoleUser,
				Content: []types.ChatMessagePart{
					{
						Type: types.ContentTypeImageURL,
						ImageURL: &types.ChatMessageImageURL{
							URL: c.ImageUrl,
						},
					},
					{
						Type: types.ContentTypeText,
						Text: "Can you see my picture? Please answer 1 or 0. Do not output irrelevant content.",
					},
				},
			},
		},
	}
}

func (c *CheckImgProcess) Check(_ *types.ChatCompletionRequest, resp *types.ChatCompletionResponse, openaiErr *types.OpenAIError) []*CheckResult {
	checkResults := make([]*CheckResult, 0)
	if openaiErr != nil {
		checkResults = append(checkResults, &CheckResult{
			Name:   "响应",
			Status: CheckStatusFailed,
			Remark: openaiErr.Message,
		})

		return checkResults
	}

	// 响应检测
	if len(resp.Choices) > 0 {
		result := &CheckResult{
			Name:   "响应",
			Status: CheckStatusFailed,
			Remark: "获取响应数据失败",
		}
		if content, ok := resp.Choices[0].Message.Content.(string); ok {
			switch content {
			case "1":
				result.Status = CheckStatusSuccess
				result.Remark = "gpt检测到图片"
			case "0":
				result.Status = CheckStatusFailed
				result.Remark = "gpt未检测到图片"
			default:
				result.Status = CheckStatusFailed
				result.Remark = fmt.Sprintf("gpt响应内容不符合要求: %s", content)
			}
			checkResults = append(checkResults, result)
		}
	} else {
		checkResults = append(checkResults, &CheckResult{
			Name:   "响应",
			Status: CheckStatusFailed,
			Remark: "未返回响应数据",
		})
	}

	// 图片请求检测
	accessRecord, err := GetAccessRecord(c.ID)
	if err != nil {
		checkResults = append(checkResults, &CheckResult{
			Name:   "图片请求检测",
			Status: CheckStatusFailed,
			Remark: fmt.Sprintf("获取请求记录失败：%s", err.Error()),
		})
		return checkResults
	}

	if len(accessRecord) == 0 {
		checkResults = append(checkResults, &CheckResult{
			Name:   "图片请求检测",
			Status: CheckStatusFailed,
			Remark: "没有任何请求记录",
		})
		return checkResults
	} else {
		result := &CheckResult{
			Name:   "图片请求检测",
			Status: CheckStatusFailed,
			Remark: "没有任何请求记录",
		}
		remark := []string{}
		accessRecordLen := len(accessRecord)
		if accessRecordLen > 0 {
			remark = append(remark, fmt.Sprintf("经过: %d 次中转", accessRecordLen))

			for index, record := range accessRecord {
				checkChannelImg(record)
				remark = append(remark, fmt.Sprintf("第 %d 次中转: IP(%s), 请求头(%s), 判断结果(%s)", index+1, record.IP, record.UserAgent, record.Remark))
			}
			result.Remark = strings.Join(remark, "\n")
			result.Status = CheckStatusSuccess
		}
		checkResults = append(checkResults, result)
	}

	return checkResults
}

func AppendAccessRecord(id string, c *gin.Context) error {
	accessRecord, err := GetAccessRecord(id)

	if err != nil {
		return err
	}

	record := &AccessRecord{
		UserAgent: c.Request.UserAgent(),
		IP:        c.ClientIP(),
	}

	checkChannelImg(record)

	accessRecord = append(accessRecord, record)
	return cache.SetCache(fmt.Sprintf(checkKey, id), accessRecord, 10*time.Minute)
}

func GetAccessRecord(id string) ([]*AccessRecord, error) {
	return cache.GetCache[[]*AccessRecord](fmt.Sprintf(checkKey, id))
}

func CheckImageResponse(c *gin.Context) {
	c.Header("Content-Type", "image/png")
	c.Header("Content-Disposition", "inline")

	c.Data(http.StatusOK, "image/png", checkImage)
}

func checkChannelImg(record *AccessRecord) {
	if strings.Contains(record.UserAgent, "OpenAI Image Downloader") {
		record.Remark = "OpenAI"
		return
	}

	if strings.Contains(record.UserAgent, "IPS/1.0") {
		record.Remark = "Azure"
		return
	}

	if strings.Contains(record.UserAgent, "Go-http-client") {
		record.Remark = "Go中转"
		return
	}

	record.Remark = "未知"
}
