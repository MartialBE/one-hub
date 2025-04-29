package model

import (
	"crypto/md5"
	"encoding/hex"
	"one-api/common/config"
	"one-api/common/logger"
	"one-api/common/utils"
	"slices"
	"strings"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type Channel struct {
	Id                 int     `json:"id"`
	Type               int     `json:"type" form:"type" gorm:"default:0"`
	Key                string  `json:"key" form:"key" gorm:"type:text"`
	Status             int     `json:"status" form:"status" gorm:"default:1"`
	Name               string  `json:"name" form:"name" gorm:"index"`
	Weight             *uint   `json:"weight" gorm:"default:1"`
	CreatedTime        int64   `json:"created_time" gorm:"bigint"`
	TestTime           int64   `json:"test_time" gorm:"bigint"`
	ResponseTime       int     `json:"response_time"` // in milliseconds
	BaseURL            *string `json:"base_url" gorm:"column:base_url;default:''"`
	Other              string  `json:"other" form:"other"`
	Balance            float64 `json:"balance"` // in USD
	BalanceUpdatedTime int64   `json:"balance_updated_time" gorm:"bigint"`
	Models             string  `json:"models" form:"models"`
	Group              string  `json:"group" form:"group" gorm:"type:varchar(32);default:'default'"`
	Tag                string  `json:"tag" form:"tag" gorm:"type:varchar(32);default:''"`
	UsedQuota          int64   `json:"used_quota" gorm:"bigint;default:0"`
	ModelMapping       *string `json:"model_mapping" gorm:"type:text"`
	ModelHeaders       *string `json:"model_headers" gorm:"type:varchar(1024);default:''"`
	CustomParameter    *string `json:"custom_parameter" gorm:"type:varchar(1024);default:''"`
	Priority           *int64  `json:"priority" gorm:"bigint;default:0"`
	Proxy              *string `json:"proxy" gorm:"type:varchar(255);default:''"`
	TestModel          string  `json:"test_model" form:"test_model" gorm:"type:varchar(50);default:''"`
	OnlyChat           bool    `json:"only_chat" form:"only_chat" gorm:"default:false"`
	PreCost            int     `json:"pre_cost" form:"pre_cost" gorm:"default:1"`

	DisabledStream *datatypes.JSONSlice[string] `json:"disabled_stream,omitempty" gorm:"type:json"`

	Plugin    *datatypes.JSONType[PluginType] `json:"plugin" form:"plugin" gorm:"type:json"`
	DeletedAt gorm.DeletedAt                  `json:"-" gorm:"index"`
}

func (c *Channel) AllowStream(modelName string) bool {
	if c.DisabledStream == nil {
		return true
	}

	return !slices.Contains(*c.DisabledStream, modelName)
}

type PluginType map[string]map[string]interface{}

var allowedChannelOrderFields = map[string]bool{
	"id":            true,
	"name":          true,
	"group":         true,
	"type":          true,
	"status":        true,
	"response_time": true,
	"balance":       true,
	"priority":      true,
	"weight":        true,
}

type SearchChannelsParams struct {
	Channel
	PaginationParams
	FilterTag int `json:"filter_tag" form:"filter_tag"`
}

func GetChannelsList(params *SearchChannelsParams) (*DataResult[Channel], error) {
	var channels []*Channel

	db := DB.Omit("key")
	tagDB := DB.Model(&Channel{}).Select("Max(id) as id").Where("tag != ''").Group("tag")

	if params.Type != 0 {
		db = db.Where("type = ?", params.Type)
		tagDB = tagDB.Where("type = ?", params.Type)
	}

	if params.Status != 0 {
		db = db.Where("status = ?", params.Status)
		tagDB = tagDB.Where("status = ?", params.Status)
	}

	if params.Name != "" {
		db = db.Where("name LIKE ?", "%"+params.Name+"%")
		tagDB = tagDB.Where("tag LIKE ?", "%"+params.Name+"%")
	}

	if params.Group != "" {
		groupKey := quotePostgresField("group")
		db = db.Where("( "+groupKey+" LIKE ? OR "+groupKey+" LIKE ? OR "+groupKey+" LIKE ? OR "+groupKey+" = ?)",
			"%,"+params.Group+",%", params.Group+",%", "%,"+params.Group, params.Group)
		tagDB = tagDB.Where("( "+groupKey+" LIKE ? OR "+groupKey+" LIKE ? OR "+groupKey+" LIKE ? OR "+groupKey+" = ?)",
			"%,"+params.Group+",%", params.Group+",%", "%,"+params.Group, params.Group)
	}

	if params.Models != "" {
		db = db.Where("models LIKE ?", "%"+params.Models+"%")
		tagDB = tagDB.Where("models LIKE ?", "%"+params.Models+"%")
	}

	if params.Other != "" {
		db = db.Where("other LIKE ?", params.Other+"%")
		tagDB = tagDB.Where("other LIKE ?", params.Other+"%")
	}

	if params.Key != "" {
		db = db.Where(quotePostgresField("key")+" = ?", params.Key)
		tagDB = tagDB.Where(quotePostgresField("key")+" = ?", params.Key)
	}

	if params.TestModel != "" {
		db = db.Where("test_model LIKE ?", params.TestModel+"%")
		tagDB = tagDB.Where("test_model LIKE ?", params.TestModel+"%")
	}

	if params.Tag != "" {
		db = db.Where("tag = ?", params.Tag)
		tagDB = tagDB.Where("tag = ?", params.Tag)
	}

	switch params.FilterTag {
	case 1:
		db = db.Where("tag = ''")
	case 2:
		db = db.Where("id IN (?)", tagDB)
	default:
		db = db.Where("tag = '' OR id IN (?)", tagDB)
	}

	return PaginateAndOrder(db, &params.PaginationParams, &channels, allowedChannelOrderFields)
}

func GetAllChannels() ([]*Channel, error) {
	var channels []*Channel
	err := DB.Order("id desc").Find(&channels).Error
	return channels, err
}

func GetChannelById(id int) (*Channel, error) {
	channel := Channel{Id: id}
	err := DB.First(&channel, "id = ?", id).Error

	return &channel, err
}

func GetChannelsByTag(tag string) ([]*Channel, error) {
	var channels []*Channel
	err := DB.Where("tag = ?", tag).Find(&channels).Error
	return channels, err
}

func DeleteChannelTag(channelId int) error {
	err := DB.Model(&Channel{}).Where("id = ?", channelId).Update("tag", "").Error
	return err
}

func BatchDeleteChannel(ids []int) (int64, error) {
	result := DB.Where("id IN ?", ids).Delete(&Channel{})
	return result.RowsAffected, result.Error
}

func BatchInsertChannels(channels []Channel) error {
	err := DB.Omit("UsedQuota").Create(&channels).Error
	if err != nil {
		return err
	}

	ChannelGroup.Load()
	return nil
}

type BatchChannelsParams struct {
	Value string `json:"value" form:"value" binding:"required"`
	Ids   []int  `json:"ids" form:"ids" binding:"required"`
}

func BatchUpdateChannelsAzureApi(params *BatchChannelsParams) (int64, error) {
	db := DB.Model(&Channel{}).Where("id IN ?", params.Ids).Update("other", params.Value)
	if db.Error != nil {
		return 0, db.Error
	}

	if db.RowsAffected > 0 {
		ChannelGroup.Load()
	}
	return db.RowsAffected, nil
}

func BatchDelModelChannels(params *BatchChannelsParams) (int64, error) {
	var count int64

	var channels []*Channel
	err := DB.Select("id, models, "+quotePostgresField("group")).Find(&channels, "id IN ?", params.Ids).Error
	if err != nil {
		return 0, err
	}

	for _, channel := range channels {
		modelsSlice := strings.Split(channel.Models, ",")
		for i, m := range modelsSlice {
			if m == params.Value {
				modelsSlice = append(modelsSlice[:i], modelsSlice[i+1:]...)
				break
			}
		}

		channel.Models = strings.Join(modelsSlice, ",")
		channel.UpdateRaw(false)
		count++
	}

	if count > 0 {
		ChannelGroup.Load()
	}

	return count, nil
}

func (c *Channel) SetProxy() {
	if c.Proxy == nil {
		return
	}

	if strings.Contains(*c.Proxy, "%s") {
		md5Str := md5.Sum([]byte(c.Key))
		idStr := hex.EncodeToString(md5Str[:])
		*c.Proxy = strings.Replace(*c.Proxy, "%s", idStr, 1)
	}

}

func (channel *Channel) GetPriority() int64 {
	if channel.Priority == nil {
		return 0
	}
	return *channel.Priority
}

func (channel *Channel) GetBaseURL() string {
	if channel.BaseURL == nil {
		return ""
	}
	return *channel.BaseURL
}

func (channel *Channel) GetModelMapping() string {
	if channel.ModelMapping == nil {
		return ""
	}
	return *channel.ModelMapping
}

func (channel *Channel) GetCustomParameter() string {
	if channel.CustomParameter == nil {
		return ""
	}
	return *channel.CustomParameter
}

func (channel *Channel) Insert() error {
	err := DB.Omit("UsedQuota").Create(channel).Error
	if err == nil {
		ChannelGroup.Load()
	}

	return err
}

func (channel *Channel) Update(overwrite bool) error {

	err := channel.UpdateRaw(overwrite)

	if err == nil {
		ChannelGroup.Load()
	}

	return err
}

func (channel *Channel) UpdateRaw(overwrite bool) error {
	var err error

	if overwrite {
		err = DB.Model(channel).Select("*").Omit("UsedQuota").Updates(channel).Error
	} else {
		err = DB.Model(channel).Omit("UsedQuota").Updates(channel).Error
	}
	if err != nil {
		return err
	}
	DB.Model(channel).First(channel, "id = ?", channel.Id)
	return err
}

func (channel *Channel) UpdateResponseTime(responseTime int64) {
	err := DB.Model(channel).Select("response_time", "test_time").Updates(Channel{
		TestTime:     utils.GetTimestamp(),
		ResponseTime: int(responseTime),
	}).Error
	if err != nil {
		logger.SysError("failed to update response time: " + err.Error())
	}
}

func (channel *Channel) UpdateBalance(balance float64) {
	err := DB.Model(channel).Select("balance_updated_time", "balance").Updates(Channel{
		BalanceUpdatedTime: utils.GetTimestamp(),
		Balance:            balance,
	}).Error
	if err != nil {
		logger.SysError("failed to update balance: " + err.Error())
	}
}

func (channel *Channel) Delete() error {
	err := DB.Delete(channel).Error
	if err == nil {
		ChannelGroup.Load()
	}
	return err
}

func (channel *Channel) StatusToStr() string {
	switch channel.Status {
	case config.ChannelStatusEnabled:
		return "启用"
	case config.ChannelStatusAutoDisabled:
		return "自动禁用"
	case config.ChannelStatusManuallyDisabled:
		return "手动禁用"
	}

	return "禁用"
}

func UpdateChannelStatusById(id int, status int) {
	tx := DB.Begin()
	err := tx.Model(&Channel{}).Where("id = ?", id).Update("status", status).Error
	if err != nil {
		logger.SysError("failed to update channel status: " + err.Error())
		tx.Rollback()
		return
	}

	tx.Commit()

	go ChannelGroup.ChangeStatus(id, status == config.ChannelStatusEnabled)
}

func UpdateChannelUsedQuota(id int, quota int) {
	if config.BatchUpdateEnabled {
		addNewRecord(BatchUpdateTypeChannelUsedQuota, id, quota)
		return
	}
	updateChannelUsedQuota(id, quota)
}

func updateChannelUsedQuota(id int, quota int) {
	err := DB.Model(&Channel{}).Where("id = ?", id).Update("used_quota", gorm.Expr("used_quota + ?", quota)).Error
	if err != nil {
		logger.SysError("failed to update channel used quota: " + err.Error())
	}
}

func DeleteDisabledChannel() (int64, error) {
	result := DB.Where("status = ? or status = ?", config.ChannelStatusAutoDisabled, config.ChannelStatusManuallyDisabled).Delete(&Channel{})
	return result.RowsAffected, result.Error
}

type ChannelStatistics struct {
	TotalChannels int `json:"total_channels"`
	Status        int `json:"status"`
}

func GetStatisticsChannel() (statistics []*ChannelStatistics, err error) {
	err = DB.Model(&Channel{}).Select("count(*) as total_channels, status").Group("status").Scan(&statistics).Error
	return statistics, err
}
