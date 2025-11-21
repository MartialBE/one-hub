package model

import (
	"one-api/common/logger"
	"one-api/common/utils"
)

type ModelInfo struct {
	Id               int    `json:"id" gorm:"index"`
	Model            string `json:"model" gorm:"type:varchar(100);index"`
	Name             string `json:"name" gorm:"type:varchar(100)"`
	Description      string `json:"description" gorm:"type:text"`
	ContextLength    int    `json:"context_length"`
	MaxTokens        int    `json:"max_tokens"`
	InputModalities  string `json:"input_modalities" gorm:"type:text"`
	OutputModalities string `json:"output_modalities" gorm:"type:text"`
	Tags             string `json:"tags" gorm:"type:text"`
	SupportUrl       string `json:"support_url" gorm:"type:text"`
	CreatedAt        int64  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt        int64  `json:"updated_at" gorm:"autoUpdateTime"`
}

type ModelInfoResponse struct {
	Model            string   `json:"model"`
	Name             string   `json:"name"`
	Description      string   `json:"description"`
	ContextLength    int      `json:"context_length"`
	MaxTokens        int      `json:"max_tokens"`
	InputModalities  []string `json:"input_modalities"`
	OutputModalities []string `json:"output_modalities"`
	Tags             []string `json:"tags"`
	SupportUrl       []string `json:"support_url"`
	CreatedAt        int64    `json:"created_at"`
	UpdatedAt        int64    `json:"updated_at"`
}

func (m *ModelInfo) ToResponse() *ModelInfoResponse {
	res := &ModelInfoResponse{
		Model:         m.Model,
		Name:          m.Name,
		Description:   m.Description,
		ContextLength: m.ContextLength,
		MaxTokens:     m.MaxTokens,
		CreatedAt:     m.CreatedAt,
		UpdatedAt:     m.UpdatedAt,
	}

	res.InputModalities, _ = utils.UnmarshalString[[]string](m.InputModalities)
	res.OutputModalities, _ = utils.UnmarshalString[[]string](m.OutputModalities)
	res.Tags, _ = utils.UnmarshalString[[]string](m.Tags)

	var err error
	res.SupportUrl, err = utils.UnmarshalString[[]string](m.SupportUrl)
	if err != nil {
		if m.SupportUrl != "" {
			res.SupportUrl = []string{m.SupportUrl}
		} else {
			res.SupportUrl = []string{}
		}
	}

	return res
}

func (m *ModelInfo) TableName() string {
	return "model_info"
}

func CreateModelInfo(modelInfo *ModelInfo) error {
	err := DB.Create(modelInfo).Error
	if err != nil {
		return err
	}
	return nil
}

func UpdateModelInfo(modelInfo *ModelInfo) error {
	err := DB.Omit("id", "created_at").Save(modelInfo).Error
	if err != nil {
		return err
	}
	return nil
}

func GetModelInfo(id int) (*ModelInfo, error) {
	modelInfo := &ModelInfo{}
	err := DB.Where("id = ?", id).First(modelInfo).Error
	if err != nil {
		return nil, err
	}
	return modelInfo, nil
}

func GetModelInfoByModel(model string) (*ModelInfo, error) {
	modelInfo := &ModelInfo{}
	err := DB.Where("model = ?", model).First(modelInfo).Error
	if err != nil {
		return nil, err
	}
	return modelInfo, nil
}

func GetAllModelInfo() ([]*ModelInfo, error) {
	var modelInfos []*ModelInfo
	err := DB.Order("id desc").Find(&modelInfos).Error
	if err != nil {
		return nil, err
	}
	return modelInfos, nil
}

func DeleteModelInfo(id int) error {
	err := DB.Delete(&ModelInfo{}, id).Error
	if err != nil {
		return err
	}
	return nil
}

func InitModelInfo() {
	// Auto migrate logic is handled centrally usually, but if needed here:
	err := DB.AutoMigrate(&ModelInfo{})
	if err != nil {
		logger.SysError("Failed to auto migrate ModelInfo: " + err.Error())
	}
}
