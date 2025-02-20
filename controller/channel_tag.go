package controller

import (
	"net/http"
	"one-api/common"
	"one-api/model"

	"github.com/gin-gonic/gin"
)

func GetChannelsTagList(c *gin.Context) {
	var params model.SearchChannelsTagParams
	if err := c.ShouldBindQuery(&params); err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	channelsTag, err := model.GetChannelsTagList(&params)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    channelsTag,
	})
}

func GetChannelsTagAllList(c *gin.Context) {
	channelTags, err := model.GetChannelsTagAllList()
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    channelTags,
	})
}

func GetChannelsTag(c *gin.Context) {
	tag := c.Param("tag")
	if tag == "" {
		common.AbortWithMessage(c, http.StatusOK, "tag is required")
		return
	}
	channel, err := model.GetChannelsTag(tag)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    channel,
	})
}

func UpdateChannelsTag(c *gin.Context) {
	tag := c.Param("tag")
	if tag == "" {
		common.AbortWithMessage(c, http.StatusOK, "tag is required")
		return
	}
	channel := model.Channel{}
	err := c.ShouldBindJSON(&channel)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	err = model.UpdateChannelsTag(tag, &channel)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
}

func DeleteChannelsTag(c *gin.Context) {
	tag := c.Param("tag")
	if tag == "" {
		common.AbortWithMessage(c, http.StatusOK, "tag is required")
		return
	}
	err := model.DeleteChannelsTag(tag, false)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
}

func DeleteDisabledChannelsTag(c *gin.Context) {
	tag := c.Param("tag")
	if tag == "" {
		common.AbortWithMessage(c, http.StatusOK, "tag is required")
		return
	}
	err := model.DeleteChannelsTag(tag, true)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}
}

type UpdateChannelsTagParams struct {
	Type  string `json:"type"`
	Value int    `json:"value"`
}

func UpdateChannelsTagPriority(c *gin.Context) {
	tag := c.Param("tag")
	if tag == "" {
		common.AbortWithMessage(c, http.StatusOK, "tag is required")
		return
	}

	var params UpdateChannelsTagParams
	err := c.ShouldBindJSON(&params)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	switch params.Type {
	case "priority":
		err = model.UpdateChannelsTagPriority(tag, params.Value)
		if err != nil {
			common.APIRespondWithError(c, http.StatusOK, err)
			return
		}
	default:
		common.AbortWithMessage(c, http.StatusOK, "invalid type")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
}
