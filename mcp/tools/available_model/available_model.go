package available_model

import (
	"context"
	"errors"
	"fmt"
	"github.com/ThinkInAIXYZ/go-mcp/protocol"
	"one-api/common/logger"
	"one-api/model"
	"one-api/relay"
)

const NAME = "available_model"

type AvailableModel struct{}

type modelQueryParam struct {
	GroupName string `json:"groupName" description:"分组名称,默认为空" default:"" required:"false"`
}

// GetTool 返回模型查询工具的定义
func (c *AvailableModel) GetTool() *protocol.Tool {
	availableTool, _ := protocol.NewTool(
		NAME,
		"查询可用模型的模型供应商、名称、输入价格、输出价格",
		modelQueryParam{},
	)
	return availableTool
}

func (c *AvailableModel) HandleRequest(ctx context.Context, req *protocol.CallToolRequest) (*protocol.CallToolResult, error) {
	id := ctx.Value("id")
	if id == nil {
		logger.SysLog("用户不存在，获取ctx id失败")
		return nil, errors.New("用户不存在")
	}
	userId, ok := id.(int)
	user, err := model.GetUserById(userId, false)
	if err != nil {
		logger.SysLog("获取用户信息失败")
		return nil, errors.New("用户不存在")
	}
	if !ok {
		logger.SysLog("用户不存在，id类型错误")
		return nil, errors.New("用户不存在")
	}
	query := modelQueryParam{}
	if err := protocol.VerifyAndUnmarshal(req.RawArguments, &query); err != nil {
		logger.SysLog(fmt.Sprintf("错误：%s", err.Error()))
		return nil, err
	}
	if query.GroupName == "" {
		query.GroupName = user.Group
	}
	models := relay.GetAvailableModels(query.GroupName)
	// 转成字符串
	modelsStr := fmt.Sprintf("分组[%s]模型列表\n", query.GroupName)
	for _, m := range models {
		modelsStr += fmt.Sprintf("供应商:%s 名称:%s 输入价格:$%f/1K 输出价格:$%f/1K \n", m.OwnedBy, m.Price.Model, m.Price.Input*0.002, m.Price.Output*0.002)
	}
	// 返回查询结果
	return &protocol.CallToolResult{
		Content: []protocol.Content{
			protocol.TextContent{
				Type: "text",
				Text: fmt.Sprintf("%s", modelsStr),
			},
		},
	}, nil
}
