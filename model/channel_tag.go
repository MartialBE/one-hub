package model

import (
	"one-api/common/config"
	"strings"
)

type SearchChannelsTagParams struct {
	Tag string `json:"tag" form:"tag"`
	PaginationParams
}

type ChannelTag struct {
	ID  int    `json:"id" gorm:"column:id"`
	Tag string `json:"tag" gorm:"column:tag"`
}

func GetChannelsTagList(params *SearchChannelsTagParams) (*DataResult[Channel], error) {
	var channels []*Channel
	// 子查询：为每个tag选择最小的id
	subQuery := DB.Model(&Channel{}).
		Select("MIN(id) as id").
		Where("tag != ''").
		Group("tag")

	db := DB.Select("tag, type, models, " + quotePostgresField("group"))
	if params.Tag != "" {
		subQuery = subQuery.Where("tag = ?", params.Tag)
	}

	db = db.Model(&Channel{}).Where("id IN (?)", subQuery)

	return PaginateAndOrder(db, &params.PaginationParams, &channels, allowedChannelOrderFields)
}

func GetChannelsTagAllList() ([]*ChannelTag, error) {
	var channelTags []*ChannelTag
	err := DB.Model(&Channel{}).
		Select("tag").
		Where("tag != ''").
		Group("tag").
		Find(&channelTags).Error

	return channelTags, err
}

func GetChannelsTag(tag string) (*Channel, error) {
	var channel Channel
	err := DB.Where("tag = ?", tag).First(&channel).Error
	return &channel, err
}

func UpdateChannelsTag(tag string, channel *Channel) error {
	channelTag, err := GetChannelsTag(tag)
	if err != nil {
		return err
	}

	tx := DB.Begin()
	err = tx.Model(Channel{}).Where("tag = ?", tag).Updates(
		Channel{
			Other:        channel.Other,
			Models:       channel.Models,
			Group:        channel.Group,
			Tag:          channel.Tag,
			ModelMapping: channel.ModelMapping,
			Proxy:        channel.Proxy,
			TestModel:    channel.TestModel,
			OnlyChat:     channel.OnlyChat,
			Plugin:       channel.Plugin,
		}).Error

	if err != nil {
		tx.Rollback()
		return err
	}

	// 判断模型和分组是否有变化
	if channelTag.Models == channel.Models && channelTag.Group == channel.Group {
		tx.Commit()
		return nil
	}

	channelList, err := GetChannelsByTag(tag)
	if err != nil {
		tx.Rollback()
		return err
	}

	channelIds := make([]int, 0, len(channelList))
	for _, c := range channelList {
		channelIds = append(channelIds, c.Id)
	}

	models_ := strings.Split(channel.Models, ",")
	groups_ := strings.Split(channel.Group, ",")

	// 如果模型有变化，更新
	abilities := make([]*Ability, 0)
	for _, c := range channelList {
		enabled := c.Status == config.ChannelStatusEnabled
		priority := c.Priority
		weight := c.Weight
		for _, model := range models_ {
			for _, group := range groups_ {
				ability := &Ability{
					Group:     group,
					Model:     model,
					ChannelId: c.Id,
					Enabled:   enabled,
					Priority:  priority,
					Weight:    weight,
				}
				abilities = append(abilities, ability)
			}
		}
	}

	// 删除旧的
	err = tx.Where("channel_id IN (?)", channelIds).Delete(&Ability{}).Error
	if err != nil {
		tx.Rollback()
		return err
	}

	// 添加新的
	err = BatchInsert(tx, abilities)
	if err != nil {
		tx.Rollback()
		return err
	}

	tx.Commit()

	go ChannelGroup.Load()

	return err
}

func DeleteChannelsTag(tag string) error {
	if tag == "" {
		return nil
	}

	tx := DB.Begin()
	channelList, err := GetChannelsByTag(tag)
	if err != nil {
		return err
	}

	channelIds := make([]int, 0, len(channelList))
	for _, c := range channelList {
		channelIds = append(channelIds, c.Id)
	}

	err = tx.Where("channel_id IN (?)", channelIds).Delete(&Ability{}).Error
	if err != nil {
		tx.Rollback()
		return err
	}

	err = tx.Where("tag = ?", tag).Delete(&Channel{}).Error
	if err != nil {
		tx.Rollback()
		return err
	}

	tx.Commit()
	go ChannelGroup.Load()

	return err
}
