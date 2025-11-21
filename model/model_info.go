package model

import (
	"one-api/common/logger"
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
