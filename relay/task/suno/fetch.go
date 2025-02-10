package suno

import (
	"net/http"
	"one-api/model"
	sunoProvider "one-api/providers/suno"
	"one-api/types"

	"github.com/gin-gonic/gin"
)

func GetFetch(c *gin.Context) {
	userId := c.GetInt("id")
	var params sunoProvider.FetchReq
	if err := c.ShouldBindJSON(&params); err != nil {
		StringError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	taskResponse := types.TaskResponse[[]any]{
		Code:    "success",
		Message: "",
	}

	var tasks []any
	if len(params.IDs) == 0 {
		tasks = make([]any, 0)
		taskResponse.Data = &tasks
		c.JSON(http.StatusOK, taskResponse)
		return
	}

	taskModels, err := model.GetTaskByTaskIds(model.TaskPlatformSuno, userId, params.IDs)
	if err != nil {
		StringError(c, http.StatusInternalServerError, "get_tasks_failed", err.Error())
		return
	}

	for _, task := range taskModels {
		tasks = append(tasks, TaskModel2Dto(task))
	}

	taskResponse.Data = &tasks
	c.JSON(http.StatusOK, taskResponse)
}

func GetFetchByID(c *gin.Context) {
	taskId := c.Param("id")
	userId := c.GetInt("id")

	task, err := model.GetTaskByTaskId(model.TaskPlatformSuno, userId, taskId)
	if err != nil {
		StringError(c, http.StatusInternalServerError, "get_task_failed", err.Error())
		return
	}

	if task == nil {
		StringError(c, http.StatusNotFound, "task_not_exist", "")
		return
	}

	data := TaskModel2Dto(task)

	c.JSON(http.StatusOK, types.TaskResponse[types.TaskDto]{
		Code: "success",
		Data: data,
	})

}
