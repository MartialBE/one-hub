package controller

import (
	"net/http"
	"one-api/model"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetAllModelInfo(c *gin.Context) {
	modelInfos, err := model.GetAllModelInfo()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    modelInfos,
	})
}

func GetModelInfo(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	modelInfo, err := model.GetModelInfo(id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    modelInfo,
	})
}

func CreateModelInfo(c *gin.Context) {
	modelInfo := model.ModelInfo{}
	err := c.ShouldBindJSON(&modelInfo)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	existingModel, _ := model.GetModelInfoByModel(modelInfo.Model)
	if existingModel != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "model identifier already exists",
		})
		return
	}
	err = model.CreateModelInfo(&modelInfo)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
}

func UpdateModelInfo(c *gin.Context) {
	modelInfo := model.ModelInfo{}
	err := c.ShouldBindJSON(&modelInfo)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	existingModel, _ := model.GetModelInfoByModel(modelInfo.Model)
	if existingModel != nil && existingModel.Id != modelInfo.Id {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "model identifier already exists",
		})
		return
	}
	err = model.UpdateModelInfo(&modelInfo)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
}

func DeleteModelInfo(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	err = model.DeleteModelInfo(id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
}
