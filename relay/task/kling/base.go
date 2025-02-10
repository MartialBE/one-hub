package kling

import (
	"encoding/json"
	"one-api/model"
	"one-api/types"

	KlingProvider "one-api/providers/kling"

	"github.com/gin-gonic/gin"
)

func StringError(c *gin.Context, httpCode int, code, message string) {
	err := &types.TaskResponse[any]{
		Code:    code,
		Message: message,
	}

	c.JSON(httpCode, err)
}

func TaskModel2Dto(task *model.Task) *KlingProvider.KlingResponse[*KlingProvider.KlingTaskData] {
	data := &KlingProvider.KlingResponse[*KlingProvider.KlingTaskData]{}
	json.Unmarshal(task.Data, data)

	return data
}
