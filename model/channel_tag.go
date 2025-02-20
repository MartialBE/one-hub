package model

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

	tx := DB.Begin()
	err := tx.Model(Channel{}).Where("tag = ?", tag).Updates(
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
			PreCost:      channel.PreCost,
		}).Error

	if err != nil {
		tx.Rollback()
		return err
	}

	tx.Commit()

	ChannelGroup.Load()

	return err
}

func DeleteChannelsTag(tag string) error {
	if tag == "" {
		return nil
	}

	tx := DB.Begin()

	err := tx.Where("tag = ?", tag).Delete(&Channel{}).Error
	if err != nil {
		tx.Rollback()
		return err
	}

	tx.Commit()
	ChannelGroup.Load()

	return err
}
