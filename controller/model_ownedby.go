package controller

import (
	"errors"
	"net/http"
	"one-api/common"
	"one-api/model"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetAllModelOwnedBy(c *gin.Context) {
	modelOwnedBies, err := model.GetAllModelOwnedBy()
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    modelOwnedBies,
	})
}

func GetModelOwnedBy(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	modelOwnedBy, err := model.GetModelOwnedBy(id)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    modelOwnedBy,
	})
}

func CreateModelOwnedBy(c *gin.Context) {
	var modelOwnedBy model.ModelOwnedBy
	if err := c.ShouldBindJSON(&modelOwnedBy); err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	if checkModelOwnedByReserveID(modelOwnedBy.Id) {
		common.APIRespondWithError(c, http.StatusOK, errors.New("invalid id"))
		return
	}

	if err := model.CreateModelOwnedBy(&modelOwnedBy); err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
}

func UpdateModelOwnedBy(c *gin.Context) {
	var modelOwnedBy model.ModelOwnedBy
	if err := c.ShouldBindJSON(&modelOwnedBy); err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	if err := model.UpdateModelOwnedBy(&modelOwnedBy); err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
}

func DeleteModelOwnedBy(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	if checkModelOwnedByReserveID(id) {
		common.APIRespondWithError(c, http.StatusOK, errors.New("invalid id"))
		return
	}

	if err := model.DeleteModelOwnedBy(id); err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
}

func checkModelOwnedByReserveID(id int) bool {
	return id <= model.ModelOwnedByReserveID
}
