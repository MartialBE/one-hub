package model

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"one-api/common/config"
	"one-api/common/logger"
	"one-api/common/utils"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/spf13/viper"
)

// PricingInstance is the Pricing instance
var PricingInstance *Pricing

type PriceUpdateMode string

const (
	PriceUpdateModeSystem    PriceUpdateMode = "system"
	PriceUpdateModeAdd       PriceUpdateMode = "add"
	PriceUpdateModeOverwrite PriceUpdateMode = "overwrite"
	PriceUpdateModeUpdate    PriceUpdateMode = "update"
)

// Pricing is a struct that contains the pricing data
type Pricing struct {
	sync.RWMutex
	Prices map[string]*Price `json:"models"`
	Match  []string          `json:"-"`
}

type BatchPrices struct {
	Models []string `json:"models" binding:"required"`
	Price  Price    `json:"price" binding:"required"`
}

// NewPricing creates a new Pricing instance
func NewPricing() {
	logger.SysLog("Initializing Pricing")
	logger.SysLog("Update Price Mode:" + viper.GetString("auto_price_updates_mode"))
	PricingInstance = &Pricing{
		Prices: make(map[string]*Price),
		Match:  make([]string, 0),
	}

	err := PricingInstance.Init()

	if err != nil {
		logger.SysError("Failed to initialize Pricing:" + err.Error())
		return
	}

	// 初始化时，需要检测是否有更新
	if viper.GetString("auto_price_updates_mode") == "system" && (viper.GetBool("auto_price_updates") || len(PricingInstance.Prices) == 0) {
		logger.SysLog("Checking for pricing updates")
		prices := GetDefaultPrice()
		PricingInstance.SyncPricing(prices, "system")
		logger.SysLog("Pricing initialized")
	}
}

// initializes the Pricing instance
func (p *Pricing) Init() error {
	prices, err := GetAllPrices()
	if err != nil {
		return err
	}

	if len(prices) == 0 {
		return nil
	}

	newPrices := make(map[string]*Price)
	newMatch := make(map[string]bool)

	for _, price := range prices {
		newPrices[price.Model] = price
		if strings.HasSuffix(price.Model, "*") {
			if _, ok := newMatch[price.Model]; !ok {
				newMatch[price.Model] = true
			}
		}
	}

	var newMatchList []string
	for match := range newMatch {
		newMatchList = append(newMatchList, match)
	}

	p.Lock()
	defer p.Unlock()

	p.Prices = newPrices
	p.Match = newMatchList

	return nil
}

// GetPrice returns the price of a model
func (p *Pricing) GetPrice(modelName string) *Price {
	p.RLock()
	defer p.RUnlock()

	if price, ok := p.Prices[modelName]; ok {
		return price
	}

	matchModel := utils.GetModelsWithMatch(&p.Match, modelName)
	if price, ok := p.Prices[matchModel]; ok {
		return price
	}

	return &Price{
		Type:        TokensPriceType,
		ChannelType: config.ChannelTypeUnknown,
		Input:       DefaultPrice,
		Output:      DefaultPrice,
	}
}

func (p *Pricing) GetAllPrices() map[string]*Price {
	return p.Prices
}

func (p *Pricing) GetAllPricesList() []*Price {
	var prices []*Price
	for _, price := range p.Prices {
		prices = append(prices, price)
	}

	return prices
}

func (p *Pricing) updateRawPrice(modelName string, price *Price) error {
	if _, ok := p.Prices[modelName]; !ok {
		return errors.New("model not found")
	}

	if _, ok := p.Prices[price.Model]; modelName != price.Model && ok {
		return errors.New("model names cannot be duplicated")
	}

	if err := p.deleteRawPrice(modelName); err != nil {
		return err
	}

	return price.Insert()
}

// UpdatePrice updates the price of a model
func (p *Pricing) UpdatePrice(modelName string, price *Price) error {

	if err := p.updateRawPrice(modelName, price); err != nil {
		return err
	}

	err := p.Init()

	return err
}

func (p *Pricing) addRawPrice(price *Price) error {
	if _, ok := p.Prices[price.Model]; ok {
		return errors.New("model already exists")
	}

	return price.Insert()
}

// AddPrice adds a new price to the Pricing instance
func (p *Pricing) AddPrice(price *Price) error {
	if err := p.addRawPrice(price); err != nil {
		return err
	}

	err := p.Init()

	return err
}

func (p *Pricing) deleteRawPrice(modelName string) error {
	item, ok := p.Prices[modelName]
	if !ok {
		return errors.New("model not found")
	}

	return item.Delete()
}

// DeletePrice deletes a price from the Pricing instance
func (p *Pricing) DeletePrice(modelName string) error {
	if err := p.deleteRawPrice(modelName); err != nil {
		return err
	}

	err := p.Init()

	return err
}

// SyncPricing syncs the pricing data
func (p *Pricing) SyncPricing(pricing []*Price, mode string) error {
	logger.SysLog("prices update mode：" + mode)
	var err error
	switch mode {
	case string(PriceUpdateModeSystem):
		err = p.SyncPriceWithoutOverwrite(pricing)
		return err
	case string(PriceUpdateModeUpdate):
		err = p.SyncPriceOnlyUpdate(pricing)
		return err
	case string(PriceUpdateModeOverwrite):
		err = p.SyncPriceWithOverwrite(pricing)
		return err
	case string(PriceUpdateModeAdd):
		err = p.SyncPriceWithoutOverwrite(pricing)
		return err
	default:
		err = p.SyncPriceWithoutOverwrite(pricing)
		return err
	}
}

func UpdatePriceByPriceService() error {
	updatePriceMode := viper.GetString("auto_price_updates_mode")
	if updatePriceMode == string(PriceUpdateModeSystem) {
		// 使用程序内置更新
		return nil
	}
	prices, err := GetPriceByPriceService()
	if err != nil {
		return err
	}
	if updatePriceMode == string(PriceUpdateModeAdd) {
		// 仅仅新增
		p := &Pricing{
			Prices: make(map[string]*Price),
			Match:  make([]string, 0),
		}
		err := p.Init()
		if err != nil {
			logger.SysError("Failed to initialize Pricing:" + err.Error())
			return err
		}
		err = p.SyncPriceWithoutOverwrite(prices)
		if err != nil {
			return err
		}
		return nil
	}
	if updatePriceMode == string(PriceUpdateModeOverwrite) {
		// 覆盖所有
		p := &Pricing{
			Prices: make(map[string]*Price),
			Match:  make([]string, 0),
		}
		err := p.Init()
		if err != nil {
			logger.SysError("Failed to initialize Pricing:" + err.Error())
			return err
		}
		err = p.SyncPriceWithOverwrite(prices)
		if err != nil {
			return err
		}
		return nil
	}
	if updatePriceMode == string(PriceUpdateModeUpdate) {
		// 只更新现有数据
		p := &Pricing{
			Prices: make(map[string]*Price),
			Match:  make([]string, 0),
		}
		err := p.Init()
		if err != nil {
			logger.SysError("Failed to initialize Pricing:" + err.Error())
			return err
		}
		err = p.SyncPriceOnlyUpdate(prices)
		if err != nil {
			return err
		}
		return nil
	}
	return errors.New("更新模式错误，更新模式仅能选择：add、overwrite、system，详见配置文件auto_price_updates_mode部分的说明")
}

// GetPriceByPriceService 只插入系统没有的数据
func GetPriceByPriceService() ([]*Price, error) {
	api := viper.GetString("update_price_service")
	if api == "" {
		return nil, errors.New("update_price_service is not configured")
	}
	logger.SysLog("Start Update Price,Prices Service URL：" + api)
	client := &http.Client{
		Timeout: 10 * time.Second,
	}
	resp, err := client.Get(api)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch prices from service: %v", err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}
	var result struct {
		Data []*Price `json:"data"`
	}
	// 尝试解析为带data字段的格式
	if err := json.Unmarshal(body, &result); err == nil && len(result.Data) > 0 {
		logger.SysLog(fmt.Sprintf("成功解析带data字段的数据，共获取到 %d 个价格配置", len(result.Data)))
		return result.Data, nil
	}
	// 如果不是带data字段的格式，尝试直接解析为数组
	var prices []*Price
	if err := json.Unmarshal(body, &prices); err != nil {
		return nil, fmt.Errorf("failed to parse price data: %v", err)
	}
	logger.SysLog(fmt.Sprintf("成功解析数组格式数据，共获取到 %d 个价格配置", len(prices)))
	return prices, nil
}

// SyncPriceWithOverwrite 删除系统所有数据并插入所有查询到的新数据 不含lock的数据
func (p *Pricing) SyncPriceWithOverwrite(pricing []*Price) error {
	tx := DB.Begin()
	logger.SysLog(fmt.Sprintf("系统内已有价格配置 %d 个(包含locked价格)", len(p.Prices)))
	err := DeleteAllPricesNotLock(tx)
	if err != nil {
		tx.Rollback()
		return err
	}
	var newPrices []*Price
	// 覆盖所有

	for _, price := range pricing {
		// 取出系统存在并且非lock的价格到new price
		if _, ok := p.Prices[price.Model]; !ok {
			newPrices = append(newPrices, price)
		} else {
			if !p.Prices[price.Model].Locked {
				newPrices = append(newPrices, price)
			}
		}
	}
	if len(newPrices) == 0 {
		return nil
	}

	err = InsertPrices(tx, newPrices)

	if err != nil {
		tx.Rollback()
		return err
	}

	tx.Commit()
	logger.SysLog(fmt.Sprintf("本次修改加新增 %d 个价格配置", len(newPrices)))
	return p.Init()
}

// SyncPriceOnlyUpdate 只更新系统现有的数据 不含lock的数据
func (p *Pricing) SyncPriceOnlyUpdate(pricing []*Price) error {
	tx := DB.Begin()
	logger.SysLog(fmt.Sprintf("系统内已有价格配置 %d 个(包含locked价格)", len(p.Prices)))
	var newPrices []*Price
	var newPricesName []string
	//系统内存在并且非lock的模型价格加入new price
	for _, price := range pricing {
		if p, ok := p.Prices[price.Model]; ok && !p.Locked {
			newPrices = append(newPrices, price)
			newPricesName = append(newPricesName, price.Model)
		}
	}
	if len(newPrices) == 0 {
		return nil
	}
	logger.SysLog(fmt.Sprintf("系统内需要更新 %d 个模型价格", len(newPrices)))
	// 删除需要更新的模型价格
	err := DeletePricesByModelNameAndNotLock(tx, newPricesName)
	if err != nil {
		tx.Rollback()
		return err
	}

	err = InsertPrices(tx, newPrices)

	if err != nil {
		tx.Rollback()
		return err
	}

	tx.Commit()
	logger.SysLog(fmt.Sprintf("本次更新修改 %d 个价格配置", len(newPrices)))
	return p.Init()
}

// SyncPriceWithoutOverwrite 只插入系统没有的数据
func (p *Pricing) SyncPriceWithoutOverwrite(pricing []*Price) error {
	var newPrices []*Price
	logger.SysLog(fmt.Sprintf("系统内已有价格配置 %d 个", len(p.Prices)))
	for _, price := range pricing {
		// 将系统内不存在的价格加入new prices
		if _, ok := p.Prices[price.Model]; !ok {
			newPrices = append(newPrices, price)
		}
	}

	if len(newPrices) == 0 {
		return nil
	}

	tx := DB.Begin()
	err := InsertPrices(tx, newPrices)

	if err != nil {
		tx.Rollback()
		return err
	}

	tx.Commit()
	logger.SysLog(fmt.Sprintf("本次新增 %d 个价格配置", len(newPrices)))
	return p.Init()
}

// BatchDeletePrices deletes the prices of multiple models
func (p *Pricing) BatchDeletePrices(models []string) error {
	tx := DB.Begin()

	err := DeletePrices(tx, models)
	if err != nil {
		tx.Rollback()
		return err
	}

	tx.Commit()

	p.Lock()
	defer p.Unlock()

	for _, model := range models {
		delete(p.Prices, model)
	}

	return nil
}

func (p *Pricing) BatchSetPrices(batchPrices *BatchPrices, originalModels []string) error {
	// 查找需要删除的model
	var deletePrices []string
	var addPrices []*Price
	var updatePrices []string

	for _, model := range originalModels {
		if !utils.Contains(model, batchPrices.Models) {
			deletePrices = append(deletePrices, model)
		} else {
			updatePrices = append(updatePrices, model)
		}
	}

	for _, model := range batchPrices.Models {
		if !utils.Contains(model, originalModels) {
			addPrice := batchPrices.Price
			addPrice.Model = model
			addPrices = append(addPrices, &addPrice)
		}
	}

	tx := DB.Begin()
	if len(addPrices) > 0 {
		err := InsertPrices(tx, addPrices)
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	if len(updatePrices) > 0 {
		err := UpdatePrices(tx, updatePrices, &batchPrices.Price)
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	if len(deletePrices) > 0 {
		err := DeletePrices(tx, deletePrices)
		if err != nil {
			tx.Rollback()
			return err
		}

	}
	tx.Commit()

	return p.Init()
}

func GetPricesList(pricingType string) []*Price {
	var prices []*Price

	switch pricingType {
	case "default":
		prices = GetDefaultPrice()
	case "db":
		prices = PricingInstance.GetAllPricesList()
	case "old":
		prices = GetOldPricesList()
	default:
		return nil
	}

	sort.Slice(prices, func(i, j int) bool {
		if prices[i].ChannelType == prices[j].ChannelType {
			return prices[i].Model < prices[j].Model
		}
		return prices[i].ChannelType < prices[j].ChannelType
	})

	return prices
}

func GetOldPricesList() []*Price {
	oldDataJson, err := GetOption("ModelRatio")
	if err != nil || oldDataJson.Value == "" {
		return nil
	}

	oldData := make(map[string][]float64)
	err = json.Unmarshal([]byte(oldDataJson.Value), &oldData)

	if err != nil {
		return nil
	}

	var prices []*Price
	for modelName, oldPrice := range oldData {
		price := PricingInstance.GetPrice(modelName)
		prices = append(prices, &Price{
			Model:       modelName,
			Type:        TokensPriceType,
			ChannelType: price.ChannelType,
			Input:       oldPrice[0],
			Output:      oldPrice[1],
		})
	}

	return prices
}

// func ConvertBatchPrices(prices []*Price) []*BatchPrices {
// 	batchPricesMap := make(map[string]*BatchPrices)
// 	for _, price := range prices {
// 		key := fmt.Sprintf("%s-%d-%g-%g", price.Type, price.ChannelType, price.Input, price.Output)
// 		batchPrice, exists := batchPricesMap[key]
// 		if exists {
// 			batchPrice.Models = append(batchPrice.Models, price.Model)
// 		} else {
// 			batchPricesMap[key] = &BatchPrices{
// 				Models: []string{price.Model},
// 				Price:  *price,
// 			}
// 		}
// 	}

// 	var batchPrices []*BatchPrices
// 	for _, batchPrice := range batchPricesMap {
// 		batchPrices = append(batchPrices, batchPrice)
// 	}

// 	return batchPrices
// }
