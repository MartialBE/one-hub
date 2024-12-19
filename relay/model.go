package relay

import (
	"fmt"
	"net/http"
	"one-api/common"
	"one-api/common/utils"
	"one-api/model"
	"one-api/types"
	"sort"

	"github.com/gin-gonic/gin"
)

// https://platform.openai.com/docs/api-reference/models/list
type OpenAIModels struct {
	Id      string  `json:"id"`
	Object  string  `json:"object"`
	Created int     `json:"created"`
	OwnedBy *string `json:"owned_by"`
}

func ListModelsByToken(c *gin.Context) {
	groupName := c.GetString("token_group")
	if groupName == "" {
		groupName = c.GetString("group")
	}

	if groupName == "" {
		common.AbortWithMessage(c, http.StatusServiceUnavailable, "分组不存在")
		return
	}

	models, err := model.ChannelGroup.GetGroupModels(groupName)
	if err != nil {
		c.JSON(200, gin.H{
			"object": "list",
			"data":   []string{},
		})
		return
	}
	sort.Strings(models)

	var groupOpenAIModels []*OpenAIModels
	for _, modelName := range models {
		groupOpenAIModels = append(groupOpenAIModels, getOpenAIModelWithName(modelName))
	}

	// 根据 OwnedBy 排序
	sort.Slice(groupOpenAIModels, func(i, j int) bool {
		if groupOpenAIModels[i].OwnedBy == nil {
			return true // 假设 nil 值小于任何非 nil 值
		}
		if groupOpenAIModels[j].OwnedBy == nil {
			return false // 假设任何非 nil 值大于 nil 值
		}
		return *groupOpenAIModels[i].OwnedBy < *groupOpenAIModels[j].OwnedBy
	})

	c.JSON(200, gin.H{
		"object": "list",
		"data":   groupOpenAIModels,
	})
}

func ListModelsForAdmin(c *gin.Context) {
	prices := model.PricingInstance.GetAllPrices()
	var openAIModels []OpenAIModels
	for modelId, price := range prices {
		openAIModels = append(openAIModels, OpenAIModels{
			Id:      modelId,
			Object:  "model",
			Created: 1677649963,
			OwnedBy: getModelOwnedBy(price.ChannelType),
		})
	}
	// 根据 OwnedBy 排序
	sort.Slice(openAIModels, func(i, j int) bool {
		if openAIModels[i].OwnedBy == nil {
			return true // 假设 nil 值小于任何非 nil 值
		}
		if openAIModels[j].OwnedBy == nil {
			return false // 假设任何非 nil 值大于 nil 值
		}
		return *openAIModels[i].OwnedBy < *openAIModels[j].OwnedBy
	})

	c.JSON(200, gin.H{
		"object": "list",
		"data":   openAIModels,
	})
}

func RetrieveModel(c *gin.Context) {
	modelName := c.Param("model")
	openaiModel := getOpenAIModelWithName(modelName)
	if *openaiModel.OwnedBy != model.UnknownOwnedBy {
		c.JSON(200, openaiModel)
	} else {
		openAIError := types.OpenAIError{
			Message: fmt.Sprintf("The model '%s' does not exist", modelName),
			Type:    "invalid_request_error",
			Param:   "model",
			Code:    "model_not_found",
		}
		c.JSON(200, gin.H{
			"error": openAIError,
		})
	}
}

func getModelOwnedBy(channelType int) (ownedBy *string) {
	ownedByName := model.ModelOwnedBysInstance.GetName(channelType)
	if ownedByName != "" {
		return &ownedByName
	}

	return &model.UnknownOwnedBy
}

func getOpenAIModelWithName(modelName string) *OpenAIModels {
	price := model.PricingInstance.GetPrice(modelName)

	return &OpenAIModels{
		Id:      modelName,
		Object:  "model",
		Created: 1677649963,
		OwnedBy: getModelOwnedBy(price.ChannelType),
	}
}

func GetModelOwnedBy(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    model.ModelOwnedBysInstance.GetAll(),
	})
}

type ModelPrice struct {
	Type   string  `json:"type"`
	Input  float64 `json:"input"`
	Output float64 `json:"output"`
}

type AvailableModelResponse struct {
	Groups  []string     `json:"groups"`
	OwnedBy string       `json:"owned_by"`
	Price   *model.Price `json:"price"`
}

func AvailableModel(c *gin.Context) {
	groupName := c.GetString("group")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    getAvailableModels(groupName),
	})
}

func getAvailableModels(groupName string) map[string]*AvailableModelResponse {
	publicModels := model.ChannelGroup.GetModelsGroups()
	publicGroups := model.GlobalUserGroupRatio.GetPublicGroupList()
	if groupName != "" && !utils.Contains(groupName, publicGroups) {
		publicGroups = append(publicGroups, groupName)
	}

	availableModels := make(map[string]*AvailableModelResponse, len(publicModels))

	for modelName, group := range publicModels {
		groups := []string{}
		for _, publicGroup := range publicGroups {
			if group[publicGroup] {
				groups = append(groups, publicGroup)
			}
		}

		if len(groups) == 0 {
			continue
		}

		if _, ok := availableModels[modelName]; !ok {
			price := model.PricingInstance.GetPrice(modelName)
			availableModels[modelName] = &AvailableModelResponse{
				Groups:  groups,
				OwnedBy: *getModelOwnedBy(price.ChannelType),
				Price:   price,
			}
		}
	}

	return availableModels
}
