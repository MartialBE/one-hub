package task

import (
	"fmt"
	"net/http"
	"one-api/common/config"
	"one-api/common/logger"
	"one-api/model"
	"one-api/relay/relay_util"
	"one-api/relay/task/base"
	"one-api/types"
	"strings"

	"github.com/gin-gonic/gin"
)

func RelayTaskSubmit(c *gin.Context) {
	var taskErr *base.TaskError
	taskAdaptor, err := GetTaskAdaptor(GetRelayMode(c), c)
	if err != nil {
		taskErr = base.StringTaskError(http.StatusBadRequest, "adaptor_not_found", "adaptor not found", true)
		c.JSON(http.StatusBadRequest, taskErr)
		return
	}

	taskErr = taskAdaptor.Init()
	if taskErr != nil {
		taskAdaptor.HandleError(taskErr)
		return
	}

	taskErr = taskAdaptor.SetProvider()
	if taskErr != nil {
		taskAdaptor.HandleError(taskErr)
		return
	}

	quotaInstance := relay_util.NewQuota(c, taskAdaptor.GetModelName(), 1000)
	if errWithOA := quotaInstance.PreQuotaConsumption(); errWithOA != nil {
		taskAdaptor.HandleError(base.OpenAIErrToTaskErr(errWithOA))
		return
	}

	taskErr = taskAdaptor.Relay()
	if taskErr == nil {
		go CompletedTask(quotaInstance, taskAdaptor, c)
		return
	}

	quotaInstance.Undo(c)

	retryTimes := config.RetryTimes

	if !taskAdaptor.ShouldRetry(taskErr) {
		logger.LogError(c.Request.Context(), fmt.Sprintf("relay error happen, status code is %d, won't retry in this case", taskErr.StatusCode))
		retryTimes = 0
	}

	channel := taskAdaptor.GetProvider().GetChannel()
	for i := retryTimes; i > 0; i-- {
		model.ChannelGroup.Cooldowns(channel.Id)
		taskErr = taskAdaptor.SetProvider()
		if taskErr != nil {
			continue
		}

		channel = taskAdaptor.GetProvider().GetChannel()
		logger.LogError(c.Request.Context(), fmt.Sprintf("using channel #%d(%s) to retry (remain times %d)", channel.Id, channel.Name, i))

		taskErr = taskAdaptor.Relay()
		if taskErr == nil {
			go CompletedTask(quotaInstance, taskAdaptor, c)
			return
		}

		quotaInstance.Undo(c)
		if !taskAdaptor.ShouldRetry(taskErr) {
			break
		}

	}

	if taskErr != nil {
		taskAdaptor.HandleError(taskErr)
	}

}

func CompletedTask(quotaInstance *relay_util.Quota, taskAdaptor base.TaskInterface, c *gin.Context) {
	quotaInstance.Consume(c, &types.Usage{CompletionTokens: 0, PromptTokens: 1, TotalTokens: 1}, false)

	task := taskAdaptor.GetTask()
	task.Quota = int(quotaInstance.GetInputRatio() * 1000)

	err := task.Insert()
	if err != nil {
		logger.SysError(fmt.Sprintf("task error: %s", err.Error()))
	}

	// 激活任务
	ActivateUpdateTaskBulk()
}

func GetRelayMode(c *gin.Context) int {
	relayMode := config.RelayModeUnknown
	path := c.Request.URL.Path
	if strings.HasPrefix(path, "/suno") {
		relayMode = config.RelayModeSuno
	}

	return relayMode
}
