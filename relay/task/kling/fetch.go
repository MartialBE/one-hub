package kling

import (
	"net/http"
	"one-api/model"

	"github.com/gin-gonic/gin"
)

func GetFetchByID(c *gin.Context) {
	taskId := c.Param("id")
	userId := c.GetInt("id")

	task, err := model.GetTaskByTaskId(model.TaskPlatformKling, userId, taskId)
	if err != nil {
		StringError(c, http.StatusInternalServerError, "get_task_failed", err.Error())
		return
	}

	if task == nil {
		StringError(c, http.StatusNotFound, "task_not_exist", "")
		return
	}

	data := TaskModel2Dto(task)

	c.JSON(http.StatusOK, data)
}
