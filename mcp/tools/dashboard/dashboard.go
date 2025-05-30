package dashboard

import (
	"context"
	"errors"
	"fmt"
	"github.com/ThinkInAIXYZ/go-mcp/protocol"
	"one-api/common/logger"
	"one-api/model"
	"time"
)

const NAME = "dashboard"

// Dashboar
// Dashboard
type Dashboard struct{}

type dashboardQueryParam struct {
	StartOfDay string `json:"startOfDay" description:"开始时间，格式2025-01-01,默认空字符串" default:"" required:"false"`
	EndOfDay   string `json:"endOfDay" description:"结束时间，格式2025-01-01,默认空字符串" default:"" required:"false"`
}

// GetTool 返回模型查询工具的定义
func (c *Dashboard) GetTool() *protocol.Tool {
	dashboardTool, _ := protocol.NewTool(
		NAME,
		"账单查询，查询指定时间模型使用情况，可以传入开始和结束时间，如果不指定时间的话系统将会返回当前时间近七天的数据",
		dashboardQueryParam{},
	)
	return dashboardTool
}

func (c *Dashboard) HandleRequest(ctx context.Context, req *protocol.CallToolRequest) (*protocol.CallToolResult, error) {
	id := ctx.Value("id")
	if id == nil {
		logger.SysLog("用户不存在，获取ctx id失败")
		return nil, errors.New("用户不存在")
	}
	userId, ok := id.(int)
	if !ok {
		logger.SysLog("用户不存在，id类型错误")
		return nil, errors.New("用户不存在")
	}
	query := dashboardQueryParam{}
	if err := protocol.VerifyAndUnmarshal(req.RawArguments, &query); err != nil {
		logger.SysLog(fmt.Sprintf("错误：%s", err.Error()))
		return nil, err
	}
	if query.StartOfDay == "" || query.EndOfDay == "" {
		query.StartOfDay = time.Now().AddDate(0, 0, -7).Format("2006-01-02")
		query.EndOfDay = time.Now().Format("2006-01-02")
	}

	dashboards, err := model.GetUserModelStatisticsByPeriod(userId, query.StartOfDay, query.EndOfDay)
	if err != nil {
		return nil, err
	}
	// 转成字符串
	result := fmt.Sprintf("%s-%s账单\n", query.StartOfDay, query.EndOfDay)
	for _, m := range dashboards {
		quotaCost := float64(m.Quota) * 0.002 / 1000
		result += fmt.Sprintf("Date:%v RequestCount:%d RequestTime(ms):%d Quota($):%.6f ModelName:%s InputToken:%d OutputToken:%d \n", m.Date, m.RequestCount, m.RequestTime, quotaCost, m.ModelName, m.PromptTokens, m.CompletionTokens)
	}
	// 返回查询结果
	return &protocol.CallToolResult{
		Content: []protocol.Content{
			&protocol.TextContent{
				Type: "text",
				Text: fmt.Sprintf("%v", result),
			},
		},
	}, nil
}
