package model

import (
	"errors"
	"fmt"
	"math/rand"
	"one-api/common/config"
	"one-api/common/logger"
	"one-api/common/utils"
	"strings"
	"sync"
	"time"
)

type ChannelChoice struct {
	Channel       *Channel
	CooldownsTime int64
	Disable       bool
}

type ChannelsChooser struct {
	sync.RWMutex
	Channels  map[int]*ChannelChoice
	Rule      map[string]map[string][][]int // group -> model -> priority -> channelIds
	Match     []string
	Cooldowns sync.Map

	ModelGroup map[string]map[string]bool
}

type ChannelsFilterFunc func(channelId int, choice *ChannelChoice) bool

func FilterChannelId(skipChannelIds []int) ChannelsFilterFunc {
	return func(channelId int, _ *ChannelChoice) bool {
		return utils.Contains(channelId, skipChannelIds)
	}
}

func FilterChannelTypes(channelTypes []int) ChannelsFilterFunc {
	return func(_ int, choice *ChannelChoice) bool {
		return !utils.Contains(choice.Channel.Type, channelTypes)
	}
}

func FilterOnlyChat() ChannelsFilterFunc {
	return func(channelId int, choice *ChannelChoice) bool {
		return choice.Channel.OnlyChat
	}
}

func init() {
	// 每小时清理一次过期的冷却时间
	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		for range ticker.C {
			ChannelGroup.CleanupExpiredCooldowns()
		}
	}()
}

func (cc *ChannelsChooser) SetCooldowns(channelId int, modelName string) bool {
	if channelId == 0 || modelName == "" || config.RetryCooldownSeconds == 0 {
		return false
	}

	key := fmt.Sprintf("%d:%s", channelId, modelName)
	nowTime := time.Now().Unix()

	cooldownTime, exists := cc.Cooldowns.Load(key)
	if exists && nowTime < cooldownTime.(int64) {
		return true
	}

	cc.Cooldowns.LoadOrStore(key, nowTime+int64(config.RetryCooldownSeconds))
	return true
}

func (cc *ChannelsChooser) IsInCooldown(channelId int, modelName string) bool {
	key := fmt.Sprintf("%d:%s", channelId, modelName)

	cooldownTime, exists := cc.Cooldowns.Load(key)
	if !exists {
		return false
	}

	return time.Now().Unix() < cooldownTime.(int64)
}

func (cc *ChannelsChooser) CleanupExpiredCooldowns() {
	now := time.Now().Unix()
	cc.Cooldowns.Range(func(key, value interface{}) bool {
		if now >= value.(int64) {
			cc.Cooldowns.Delete(key)
		}
		return true
	})
}

func (cc *ChannelsChooser) Disable(channelId int) {
	cc.Lock()
	defer cc.Unlock()
	if _, ok := cc.Channels[channelId]; !ok {
		return
	}

	cc.Channels[channelId].Disable = true
}

func (cc *ChannelsChooser) Enable(channelId int) {
	cc.Lock()
	defer cc.Unlock()
	if _, ok := cc.Channels[channelId]; !ok {
		return
	}

	cc.Channels[channelId].Disable = false
}

func (cc *ChannelsChooser) ChangeStatus(channelId int, status bool) {
	if status {
		cc.Enable(channelId)
	} else {
		cc.Disable(channelId)
	}
}

func (cc *ChannelsChooser) balancer(channelIds []int, filters []ChannelsFilterFunc, modelName string) *Channel {
	totalWeight := 0

	validChannels := make([]*ChannelChoice, 0, len(channelIds))
	for _, channelId := range channelIds {
		choice, ok := cc.Channels[channelId]
		if !ok || choice.Disable {
			continue
		}

		if cc.IsInCooldown(channelId, modelName) {
			continue
		}

		isSkip := false
		for _, filter := range filters {
			if filter(channelId, choice) {
				isSkip = true
				break
			}
		}
		if isSkip {
			continue
		}

		weight := int(*choice.Channel.Weight)
		totalWeight += weight
		validChannels = append(validChannels, choice)
	}

	if len(validChannels) == 0 {
		return nil
	}

	if len(validChannels) == 1 {
		return validChannels[0].Channel
	}

	choiceWeight := rand.Intn(totalWeight)
	for _, choice := range validChannels {
		weight := int(*choice.Channel.Weight)
		choiceWeight -= weight
		if choiceWeight < 0 {
			return choice.Channel
		}
	}

	return nil
}

func (cc *ChannelsChooser) Next(group, modelName string, filters ...ChannelsFilterFunc) (*Channel, error) {
	cc.RLock()
	defer cc.RUnlock()
	if _, ok := cc.Rule[group]; !ok {
		return nil, errors.New("group not found")
	}

	channelsPriority, ok := cc.Rule[group][modelName]
	if !ok {
		matchModel := utils.GetModelsWithMatch(&cc.Match, modelName)
		channelsPriority, ok = cc.Rule[group][matchModel]
		if !ok {
			return nil, errors.New("model not found")
		}
	}

	if len(channelsPriority) == 0 {
		return nil, errors.New("channel not found")
	}

	for _, priority := range channelsPriority {
		channel := cc.balancer(priority, filters, modelName)
		if channel != nil {
			return channel, nil
		}
	}

	return nil, errors.New("channel not found")
}

func (cc *ChannelsChooser) GetGroupModels(group string) ([]string, error) {
	cc.RLock()
	defer cc.RUnlock()

	if _, ok := cc.Rule[group]; !ok {
		return nil, errors.New("group not found")
	}

	models := make([]string, 0, len(cc.Rule[group]))
	for model := range cc.Rule[group] {
		models = append(models, model)
	}

	return models, nil
}

func (cc *ChannelsChooser) GetModelsGroups() map[string]map[string]bool {
	cc.RLock()
	defer cc.RUnlock()

	return cc.ModelGroup
}

func (cc *ChannelsChooser) GetChannel(channelId int) *Channel {
	cc.RLock()
	defer cc.RUnlock()

	if choice, ok := cc.Channels[channelId]; ok {
		return choice.Channel
	}

	return nil
}

var ChannelGroup = ChannelsChooser{}

func (cc *ChannelsChooser) Load() {
	var channels []*Channel
	DB.Where("status = ?", config.ChannelStatusEnabled).Find(&channels)

	abilities, err := GetAbilityChannelGroup()
	if err != nil {
		logger.SysError("get enabled abilities failed: " + err.Error())
		return
	}

	newGroup := make(map[string]map[string][][]int)
	newChannels := make(map[int]*ChannelChoice)
	newMatch := make(map[string]bool)
	newModelGroup := make(map[string]map[string]bool)

	for _, channel := range channels {
		if *channel.Weight == 0 {
			channel.Weight = &config.DefaultChannelWeight
		}
		newChannels[channel.Id] = &ChannelChoice{
			Channel:       channel,
			CooldownsTime: 0,
			Disable:       false,
		}
	}

	for _, ability := range abilities {
		if _, ok := newGroup[ability.Group]; !ok {
			newGroup[ability.Group] = make(map[string][][]int)
		}

		if _, ok := newModelGroup[ability.Model]; !ok {
			newModelGroup[ability.Model] = make(map[string]bool)
		}

		if _, ok := newGroup[ability.Group][ability.Model]; !ok {
			newGroup[ability.Group][ability.Model] = make([][]int, 0)
		}

		// 如果是以 *结尾的 model名称
		if strings.HasSuffix(ability.Model, "*") {
			if _, ok := newMatch[ability.Model]; !ok {
				newMatch[ability.Model] = true
			}
		}

		var priorityIds []int
		// 逗号分割 ability.ChannelId
		channelIds := strings.Split(ability.ChannelIds, ",")
		for _, channelId := range channelIds {
			priorityIds = append(priorityIds, utils.String2Int(channelId))
		}

		newGroup[ability.Group][ability.Model] = append(newGroup[ability.Group][ability.Model], priorityIds)
		newModelGroup[ability.Model][ability.Group] = true
	}

	newMatchList := make([]string, 0, len(newMatch))
	for match := range newMatch {
		newMatchList = append(newMatchList, match)
	}

	cc.Lock()
	cc.Rule = newGroup
	cc.Channels = newChannels
	cc.Match = newMatchList
	cc.ModelGroup = newModelGroup
	cc.Unlock()
	logger.SysLog("channels Load success")
}
