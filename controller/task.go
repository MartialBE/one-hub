package controller

import (
	"net/http"
	"one-api/common"
	"one-api/model"
	"regexp"

	"github.com/gin-gonic/gin"
	"gorm.io/datatypes"
)

func GetAllTask(c *gin.Context) {
	var params model.TaskQueryParams
	if err := c.ShouldBindQuery(&params); err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	tasks, err := model.GetAllTasks(&params)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    tasks,
	})
}

func GetUserAllTask(c *gin.Context) {
	userId := c.GetInt("id")

	var params model.TaskQueryParams
	if err := c.ShouldBindQuery(&params); err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	tasks, err := model.GetAllUserTasks(userId, &params)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	re := regexp.MustCompile(`"user_id":\s*"[^"]*",?\s*`)

	for _, task := range *tasks.Data {
		if task.Platform == model.TaskPlatformSuno && task.Action == "MUSIC" {
			data := task.Data.String()
			if data != "" {
				data = re.ReplaceAllString(data, "")
				task.Data = datatypes.JSON(data)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    tasks,
	})
}
