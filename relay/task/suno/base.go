package suno

import (
	"fmt"
	"one-api/model"
	"one-api/types"
	"regexp"

	"github.com/gin-gonic/gin"
	"gorm.io/datatypes"
)

func StringError(c *gin.Context, httpCode int, code, message string) {
	err := &types.TaskResponse[any]{
		Code:    code,
		Message: message,
	}

	c.JSON(httpCode, err)
}

func TaskModel2Dto(task *model.Task) *types.TaskDto {
	progress := fmt.Sprintf("%d%%", task.Progress)

	taskDto := &types.TaskDto{
		TaskID:     task.TaskID,
		Action:     task.Action,
		Status:     string(task.Status),
		FailReason: task.FailReason,
		SubmitTime: task.SubmitTime,
		StartTime:  task.StartTime,
		FinishTime: task.FinishTime,
		Progress:   progress,
		Data:       task.Data,
	}

	if taskDto.Action == "MUSIC" {
		data := taskDto.Data.String()
		if data != "" {
			re := regexp.MustCompile(`"user_id":\s*"[^"]*",?\s*`)
			data = re.ReplaceAllString(data, "")
			taskDto.Data = datatypes.JSON(data)
		}
	}

	return taskDto
}
