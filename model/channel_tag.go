package model

import (
	"crypto/md5"
	"encoding/hex"
	"errors"
	"fmt"
	"one-api/common/config"
	"strings"
	"time"
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

type ChannelTagCollection struct {
	Channel
	KeyMap map[string]int
}

func GetChannelsTag(tag string) (*ChannelTagCollection, error) {
	var channelTag ChannelTagCollection

	var channels []Channel
	err := DB.Where("tag = ?", tag).Find(&channels).Error
	if err != nil {
		return nil, err
	}

	if len(channels) == 0 {
		return nil, errors.New("tag不存在")
	}

	channelTag.Channel = channels[0]
	channelTag.Key = ""

	channelTag.KeyMap = make(map[string]int)
	for _, c := range channels {
		keyMd5 := md5.Sum([]byte(c.Key))
		keyMd5Str := hex.EncodeToString(keyMd5[:])
		channelTag.KeyMap[keyMd5Str] = c.Id
		channelTag.Key += c.Key + "\n"
	}

	channelTag.Key = strings.TrimRight(channelTag.Key, "\n")
	return &channelTag, nil
}

func UpdateChannelsTag(tag string, channel *Channel) error {
	channelTag, err := GetChannelsTag(tag)
	if err != nil {
		return err
	}

	if channel.Key == "" {
		return errors.New("key不能为空")
	}

	addKeys := []string{}
	delIds := []int{}

	newKeysMap := make(map[string]bool)

	keys := strings.Split(channel.Key, "\n")
	for _, key := range keys {
		if key == "" {
			continue
		}
		keyMd5 := md5.Sum([]byte(key))
		keyMd5Str := hex.EncodeToString(keyMd5[:])
		newKeysMap[keyMd5Str] = true

		// 如果key不在现有的KeyMap中，则添加到addKeys
		if _, ok := channelTag.KeyMap[keyMd5Str]; !ok {
			addKeys = append(addKeys, key)
		}
	}

	// 检查现有的keys，如果不在新的keys中，则需要删除
	for keyMd5Str, id := range channelTag.KeyMap {
		if _, ok := newKeysMap[keyMd5Str]; !ok {
			delIds = append(delIds, id)
		}
	}

	tx := DB.Begin()
	// 先处理要删除的数据
	if len(delIds) > 0 {
		err = tx.Where("id IN (?)", delIds).Delete(&Channel{}).Error
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	// 处理要添加的数据
	if len(addKeys) > 0 {
		maxKey := len(channelTag.KeyMap)

		addChannels := make([]Channel, 0, len(addKeys))
		for _, key := range addKeys {
			addChannel := *channel
			addChannel.Name = fmt.Sprintf("%s_%d", channel.Name, maxKey)
			addChannel.Key = key
			addChannel.Balance = 0
			addChannel.BalanceUpdatedTime = 0
			addChannel.UsedQuota = 0
			addChannel.ResponseTime = 0
			addChannel.CreatedTime = time.Now().Unix()
			addChannel.TestTime = 0
			addChannels = append(addChannels, addChannel)
			maxKey++
		}
		err = BatchInsert(tx, addChannels)
		if err != nil {
			tx.Rollback()
			return err
		}
	}

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

func DeleteChannelsTag(tag string, delDisabled bool) error {
	if tag == "" {
		return nil
	}

	tx := DB.Begin()

	if delDisabled {
		tx = tx.Where("(status = ? or status = ?)", config.ChannelStatusAutoDisabled, config.ChannelStatusManuallyDisabled)
	}

	err := tx.Where("tag = ?", tag).Delete(&Channel{}).Error
	if err != nil {
		tx.Rollback()
		return err
	}

	tx.Commit()
	ChannelGroup.Load()

	return err
}

func UpdateChannelsTagPriority(tag string, value int) error {
	err := DB.Model(&Channel{}).Where("tag = ?", tag).Update("priority", value).Error
	if err != nil {
		return err
	}

	ChannelGroup.Load()
	return nil
}
