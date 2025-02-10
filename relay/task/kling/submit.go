package kling

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"one-api/common"
	"one-api/common/logger"
	"one-api/model"
	"one-api/providers"
	KlingProvider "one-api/providers/kling"
	"one-api/relay/task/base"
	"one-api/types"
	"sort"

	"github.com/gin-gonic/gin"
	"github.com/samber/lo"
)

type KlingTask struct {
	base.TaskBase
	TaskId   string
	Request  *KlingProvider.KlingTask
	Provider *KlingProvider.KlingProvider

	Class  string
	Action string
}

func (t *KlingTask) HandleError(err *base.TaskError) {
	StringError(t.C, err.StatusCode, err.Code, err.Message)
}

func (t *KlingTask) Init() *base.TaskError {
	// 解析
	if err := common.UnmarshalBodyReusable(t.C, &t.Request); err != nil {
		return base.StringTaskError(http.StatusBadRequest, "invalid_request", err.Error(), true)
	}

	err := t.actionValidate()
	if err != nil {
		return base.StringTaskError(http.StatusBadRequest, "invalid_request", err.Error(), true)
	}

	err = t.HandleOriginTaskID()
	if err != nil {
		return base.StringTaskError(http.StatusInternalServerError, "get_origin_task_failed", err.Error(), true)
	}

	return nil
}

func (t *KlingTask) SetProvider() *base.TaskError {
	// 开始通过模型查询渠道
	provider, err := t.GetProviderByModel()
	if err != nil {
		return base.StringTaskError(http.StatusServiceUnavailable, "provider_not_found", err.Error(), true)
	}

	KlingProvider, ok := provider.(*KlingProvider.KlingProvider)
	if !ok {
		return base.StringTaskError(http.StatusServiceUnavailable, "provider_not_found", "provider not found", true)
	}

	t.Provider = KlingProvider
	t.BaseProvider = provider

	return nil
}

func (t *KlingTask) Relay() *base.TaskError {
	resp, err := t.Provider.Submit(t.Class, t.Action, t.Request)
	if err != nil {
		return base.OpenAIErrToTaskErr(err)
	}

	t.Response = resp

	t.InitTask()
	t.Task.TaskID = resp.Data.TaskID
	t.Task.ChannelId = t.Provider.Channel.Id
	t.Task.Action = t.Action

	return nil
}

func (t *KlingTask) actionValidate() (err error) {
	class := t.C.Param("class")
	action := t.C.Param("action")

	if class != "videos" {
		err = fmt.Errorf("class is not videos")
		return
	}

	if action != "text2video" && action != "image2video" {
		err = fmt.Errorf("action is not text2video or image2video")
		return
	}

	if t.Request.Duration == "" {
		t.Request.Duration = "5"
	}

	if t.Request.Duration != "5" && t.Request.Duration != "10" {
		err = fmt.Errorf("duration is not 5 or 10")
		return
	}

	t.Class = class
	t.Action = action

	if t.Request.ModelName == "" {
		t.Request.ModelName = "kling-v1"
	}

	if t.Request.Mode == "" {
		t.Request.Mode = "std"
	}

	t.OriginalModel = fmt.Sprintf("kling-video_%s_%s_%s", t.Request.ModelName, t.Request.Mode, t.Request.Duration)

	return
}

func (t *KlingTask) ShouldRetry(c *gin.Context, err *base.TaskError) bool {
	return false

}

func (t *KlingTask) UpdateTaskStatus(ctx context.Context, taskChannelM map[int][]string, taskM map[string]*model.Task) error {
	for channelId, taskIds := range taskChannelM {
		err := updateKlingTaskAll(ctx, channelId, taskIds, taskM)
		if err != nil {
			logger.LogError(ctx, fmt.Sprintf("渠道 #%d 更新异步任务失败: %s", channelId, err.Error()))
		}
	}
	return nil
}

func updateKlingTaskAll(ctx context.Context, channelId int, taskIds []string, taskM map[string]*model.Task) error {
	logger.LogWarn(ctx, fmt.Sprintf("渠道 #%d 未完成的任务有: %d", channelId, len(taskIds)))
	if len(taskIds) == 0 {
		return nil
	}

	channel := model.ChannelGroup.GetChannel(channelId)
	if channel == nil {
		err := model.TaskBulkUpdate(taskIds, map[string]any{
			"fail_reason": fmt.Sprintf("获取渠道信息失败，请联系管理员，渠道ID：%d", channelId),
			"status":      "FAILURE",
			"progress":    100,
		})
		if err != nil {
			logger.SysError(fmt.Sprintf("UpdateTask error: %v", err))
		}
		return fmt.Errorf("channel not found")
	}

	providers := providers.GetProvider(channel, nil)
	KlingProvider, ok := providers.(*KlingProvider.KlingProvider)
	if !ok {
		err := model.TaskBulkUpdate(taskIds, map[string]any{
			"fail_reason": "获取供应商失败，请联系管理员",
			"status":      "FAILURE",
			"progress":    100,
		})
		if err != nil {
			logger.SysError(fmt.Sprintf("UpdateTask error: %v", err))
		}
		return fmt.Errorf("provider not found")
	}

	taskActions, err := model.GetTaskActionByTaskIds("Kling", taskIds)
	if err != nil {
		return fmt.Errorf("get task action failed: %v", err)
	}

	for _, taskAction := range taskActions {
		resp, errWithCode := KlingProvider.GetFetch("videos", taskAction.Action, taskAction.TaskID)
		if errWithCode != nil {
			logger.SysError(fmt.Sprintf("Get Task %s Do req error: %v", taskAction.TaskID, errWithCode))
			continue
		}

		if !resp.IsSuccess() || resp.Data == nil {
			logger.SysError(fmt.Sprintf("Get Task %s Fetch error: %v", taskAction.TaskID, resp.Message))
			continue
		}

		responseItem := resp.Data
		task := taskM[responseItem.TaskID]
		if !checkTaskNeedUpdate(task, responseItem) {
			continue
		}

		task.Status = lo.If(model.TaskStatus(responseItem.Status) != "", model.TaskStatus(responseItem.Status)).Else(task.Status)
		task.FailReason = lo.If(responseItem.FailReason != "", responseItem.FailReason).Else(task.FailReason)
		task.SubmitTime = lo.If(responseItem.SubmitTime != 0, responseItem.SubmitTime).Else(task.SubmitTime)
		task.StartTime = lo.If(responseItem.StartTime != 0, responseItem.StartTime).Else(task.StartTime)
		task.FinishTime = lo.If(responseItem.FinishTime != 0, responseItem.FinishTime).Else(task.FinishTime)

		if responseItem.FailReason != "" || task.Status == model.TaskStatusFailure {
			logger.LogError(ctx, task.TaskID+" 构建失败，"+task.FailReason)
			task.Progress = 100
			quota := task.Quota
			if quota > 0 {
				err := model.IncreaseUserQuota(task.UserId, quota)
				if err != nil {
					logger.LogError(ctx, "fail to increase user quota: "+err.Error())
				}
				logContent := fmt.Sprintf("异步任务执行失败 %s，补偿 %s", task.TaskID, common.LogQuota(quota))
				model.RecordLog(task.UserId, model.LogTypeSystem, logContent)
			}
		}

		if responseItem.Status == model.TaskStatusSuccess {
			task.Progress = 100
		}

		task.Data = responseItem.Data
		err := task.Update()
		if err != nil {
			logger.SysError("UpdateTask task error: " + err.Error())
		}
	}

	return nil
}

func checkTaskNeedUpdate(oldTask *model.Task, newTask *types.TaskDto) bool {

	if oldTask.SubmitTime != newTask.SubmitTime {
		return true
	}
	if oldTask.StartTime != newTask.StartTime {
		return true
	}
	if oldTask.FinishTime != newTask.FinishTime {
		return true
	}
	if string(oldTask.Status) != newTask.Status {
		return true
	}
	if oldTask.FailReason != newTask.FailReason {
		return true
	}
	if oldTask.FinishTime != newTask.FinishTime {
		return true
	}

	if (oldTask.Status == model.TaskStatusFailure || oldTask.Status == model.TaskStatusSuccess) && oldTask.Progress != 100 {
		return true
	}

	oldData, _ := json.Marshal(oldTask.Data)
	newData, _ := json.Marshal(newTask.Data)

	sort.Slice(oldData, func(i, j int) bool {
		return oldData[i] < oldData[j]
	})
	sort.Slice(newData, func(i, j int) bool {
		return newData[i] < newData[j]
	})

	return string(oldData) != string(newData)
}
