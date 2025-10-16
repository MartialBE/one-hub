package model

import (
	"encoding/json"
	"one-api/common/config"
	"one-api/common/logger"
	"strconv"
	"strings"

	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

func removeKeyIndexMigration() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202405152141",
		Migrate: func(tx *gorm.DB) error {
			dialect := tx.Dialector.Name()
			if dialect == "sqlite" {
				return nil
			}

			if !tx.Migrator().HasIndex(&Channel{}, "idx_channels_key") {
				return nil
			}

			err := tx.Migrator().DropIndex(&Channel{}, "idx_channels_key")
			if err != nil {
				logger.SysLog("remove idx_channels_key  Failure: " + err.Error())
			}
			return nil
		},
		Rollback: func(tx *gorm.DB) error {
			return nil
		},
	}
}

func changeTokenKeyColumnType() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202411300001",
		Migrate: func(tx *gorm.DB) error {
			// 如果表不存在，说明是新数据库，直接跳过
			if !tx.Migrator().HasTable("tokens") {
				return nil
			}

			dialect := tx.Dialector.Name()
			var err error

			switch dialect {
			case "mysql":
				err = tx.Exec("ALTER TABLE tokens MODIFY COLUMN `key` varchar(59)").Error
			case "postgres":
				err = tx.Exec("ALTER TABLE tokens ALTER COLUMN key TYPE varchar(59)").Error
			case "sqlite":
				return nil
			}

			if err != nil {
				logger.SysLog("修改 tokens.key 字段类型失败: " + err.Error())
				return err
			}
			return nil
		},
		Rollback: func(tx *gorm.DB) error {
			if !tx.Migrator().HasTable("tokens") {
				return nil
			}

			dialect := tx.Dialector.Name()
			var err error

			switch dialect {
			case "mysql":
				err = tx.Exec("ALTER TABLE tokens MODIFY COLUMN `key` char(48)").Error
			case "postgres":
				err = tx.Exec("ALTER TABLE tokens ALTER COLUMN key TYPE char(48)").Error
			}
			return err
		},
	}
}

func migrationBefore(db *gorm.DB) error {
	// 从库不执行
	if !config.IsMasterNode {
		logger.SysLog("从库不执行迁移前操作")
		return nil
	}

	// 如果是第一次运行 直接跳过
	if !db.Migrator().HasTable("channels") {
		return nil
	}

	m := gormigrate.New(db, gormigrate.DefaultOptions, []*gormigrate.Migration{
		removeKeyIndexMigration(),
		changeTokenKeyColumnType(),
	})
	return m.Migrate()
}

func addStatistics() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202408100001",
		Migrate: func(tx *gorm.DB) error {
			go UpdateStatistics(StatisticsUpdateTypeALL)
			return nil
		},
		Rollback: func(tx *gorm.DB) error {
			return nil
		},
	}
}

func changeChannelApiVersion() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202408190001",
		Migrate: func(tx *gorm.DB) error {
			plugin := `{"customize": {"1": "{version}/chat/completions", "2": "{version}/completions", "3": "{version}/embeddings", "4": "{version}/moderations", "5": "{version}/images/generations", "6": "{version}/images/edits", "7": "{version}/images/variations", "9": "{version}/audio/speech", "10": "{version}/audio/transcriptions", "11": "{version}/audio/translations"}}`

			// 查询 channel 表中的type 为 8，且 other = disable 的数据,直接更新
			var jsonMap map[string]map[string]interface{}
			err := json.Unmarshal([]byte(strings.Replace(plugin, "{version}", "", -1)), &jsonMap)
			if err != nil {
				logger.SysLog("changeChannelApiVersion Failure: " + err.Error())
				return err
			}
			disableApi := map[string]interface{}{
				"other":  "",
				"plugin": datatypes.NewJSONType(jsonMap),
			}

			err = tx.Model(&Channel{}).Where("type = ? AND other = ?", 8, "disable").Updates(disableApi).Error
			if err != nil {
				logger.SysLog("changeChannelApiVersion Failure: " + err.Error())
				return err
			}

			// 查询 channel 表中的type 为 8，且 other != disable 并且不为空 的数据,直接更新
			var channels []*Channel
			err = tx.Model(&Channel{}).Where("type = ? AND other != ? AND other != ?", 8, "disable", "").Find(&channels).Error
			if err != nil {
				logger.SysLog("changeChannelApiVersion Failure: " + err.Error())
				return err
			}

			for _, channel := range channels {
				var jsonMap map[string]map[string]interface{}
				err := json.Unmarshal([]byte(strings.Replace(plugin, "{version}", "/"+channel.Other, -1)), &jsonMap)
				if err != nil {
					logger.SysLog("changeChannelApiVersion Failure: " + err.Error())
					return err
				}
				changeApi := map[string]interface{}{
					"other":  "",
					"plugin": datatypes.NewJSONType(jsonMap),
				}
				err = tx.Model(&Channel{}).Where("id = ?", channel.Id).Updates(changeApi).Error
				if err != nil {
					logger.SysLog("changeChannelApiVersion Failure: " + err.Error())
					return err
				}
			}

			return nil
		},
		Rollback: func(tx *gorm.DB) error {
			return tx.Rollback().Error
		},
	}
}

func initUserGroup() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202410300001",
		Migrate: func(tx *gorm.DB) error {
			userGroups := map[string]*UserGroup{
				"default": {
					Symbol: "default",
					Name:   "默认分组",
					Ratio:  1,
					Public: true,
				},
				"vip": {
					Symbol: "vip",
					Name:   "vip分组",
					Ratio:  1,
					Public: false,
				},
				"svip": {
					Symbol: "svip",
					Name:   "svip分组",
					Ratio:  1,
					Public: false,
				},
			}
			option, err := GetOption("GroupRatio")
			if err == nil && option.Value != "" {
				oldGroup := make(map[string]float64)
				err = json.Unmarshal([]byte(option.Value), &oldGroup)
				if err != nil {
					return err
				}

				for k, v := range oldGroup {
					isPublic := false
					if k == "default" {
						isPublic = true
					}
					userGroups[k] = &UserGroup{
						Symbol: k,
						Name:   k,
						Ratio:  v,
						Public: isPublic,
					}
				}
			}

			for k, v := range userGroups {
				err := tx.Where("symbol = ?", k).FirstOrCreate(v).Error
				if err != nil {
					return err
				}
			}

			return nil
		},
		Rollback: func(tx *gorm.DB) error {
			return tx.Rollback().Error
		},
	}
}

func addOldTokenMaxId() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202411300002",
		Migrate: func(tx *gorm.DB) error {
			var token Token
			tx.Last(&token)
			tokenMaxId := token.Id
			option := Option{
				Key: "OldTokenMaxId",
			}

			DB.FirstOrCreate(&option, Option{Key: "OldTokenMaxId"})
			option.Value = strconv.Itoa(tokenMaxId)
			return DB.Save(&option).Error
		},
		Rollback: func(tx *gorm.DB) error {
			return tx.Rollback().Error
		},
	}
}

func addExtraRatios() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202504300001",
		Migrate: func(tx *gorm.DB) error {
			extraTokenPriceJson := ""
			extraRatios := make(map[string]map[string]float64)
			// 先查询数据库中是否存在extra_ratios
			option, err := GetOption("ExtraTokenPriceJson")
			if err == nil {
				extraTokenPriceJson = option.Value

			} else {
				extraTokenPriceJson = GetDefaultExtraRatio()
			}

			err = json.Unmarshal([]byte(extraTokenPriceJson), &extraRatios)
			if err != nil {
				return err
			}

			if len(extraRatios) == 0 {
				return nil
			}

			models := make([]string, 0)
			for model := range extraRatios {
				models = append(models, model)
			}

			// 查询数据库中是否存在
			var prices []*Price
			err = tx.Where("model IN (?)", models).Find(&prices).Error
			if err != nil {
				return err
			}

			for _, price := range prices {
				extraRatios := extraRatios[price.Model]
				jsonData := datatypes.NewJSONType(extraRatios)
				price.ExtraRatios = &jsonData
				err = tx.Model(&Price{}).Where("model = ?", price.Model).Updates(map[string]interface{}{
					"extra_ratios": jsonData,
				}).Error
				if err != nil {
					return err
				}
			}

			return nil
		},
		Rollback: func(tx *gorm.DB) error {
			return tx.Rollback().Error
		},
	}
}

func migrateTokenLimitsStructure() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202510160002",
		Migrate: func(tx *gorm.DB) error {
			// 直接查询原始JSON字符串，避免GORM自动转换
			type TokenRaw struct {
				Id      int    `gorm:"column:id"`
				Name    string `gorm:"column:name"`
				Setting string `gorm:"column:setting;type:json"`
			}

			var tokens []TokenRaw
			err := tx.Table("tokens").Select("id, name, setting").Find(&tokens).Error
			if err != nil {
				logger.SysLog("查询token列表失败: " + err.Error())
				return err
			}

			// 遍历每个 token，转换 limits 结构
			for _, token := range tokens {
				// 解析为 map 以便灵活处理
				var settingMap map[string]interface{}
				err = json.Unmarshal([]byte(token.Setting), &settingMap)
				if err != nil || settingMap == nil {
					// 如果解析失败或为空，跳过
					continue
				}

				// 检查是否有 limits 字段
				limitsRaw, exists := settingMap["limits"]
				if !exists || limitsRaw == nil {
					continue
				}

				// 将 limits 转换为 map
				limitsMap, ok := limitsRaw.(map[string]interface{})
				if !ok {
					continue
				}

				// 检查是否已经是新结构（包含 limit_model_setting）
				if _, hasNew := limitsMap["limit_model_setting"]; hasNew {
					// 已经是新结构，跳过
					continue
				}

				// 检查是否是旧结构（包含 enabled 或 models 字段，说明是直接在 limits 下的旧结构）
				_, hasEnabled := limitsMap["enabled"]
				_, hasModels := limitsMap["models"]
				if !hasEnabled && !hasModels {
					// 既没有 enabled 也没有 models，说明不是旧结构，跳过
					continue
				}

				// 转换为新结构：将旧的 limits 内容移到 limit_model_setting 下
				newLimits := map[string]interface{}{
					"limit_model_setting": limitsMap,
					"limits_ip_setting":   LimitsIPSetting{},
				}

				// 更新 settingMap
				settingMap["limits"] = newLimits

				// 序列化回 JSON
				newSettingBytes, err := json.Marshal(settingMap)
				if err != nil {
					logger.SysLog("token setting序列化失败: " + err.Error())
					continue
				}

				// 更新数据库
				err = tx.Model(&Token{}).Where("id = ?", token.Id).Update("setting", datatypes.JSON(newSettingBytes)).Error
				if err != nil {
					logger.SysLog("更新token setting失败: " + err.Error())
					continue
				}
			}

			logger.SysLog("Token表setting字段limits结构升级完成")
			return nil
		},
		Rollback: func(tx *gorm.DB) error {
			// 回滚：将新结构转回旧结构
			var tokens []Token
			err := tx.Find(&tokens).Error
			if err != nil {
				return err
			}

			for _, token := range tokens {
				settingBytes, err := token.Setting.MarshalJSON()
				if err != nil {
					continue
				}

				var settingMap map[string]interface{}
				err = json.Unmarshal(settingBytes, &settingMap)
				if err != nil || settingMap == nil {
					continue
				}

				limitsRaw, exists := settingMap["limits"]
				if !exists || limitsRaw == nil {
					continue
				}

				limitsMap, ok := limitsRaw.(map[string]interface{})
				if !ok {
					continue
				}

				// 检查是否有 limit_model_setting
				modelSettingRaw, hasModelSetting := limitsMap["limit_model_setting"]
				if !hasModelSetting {
					continue
				}

				// 将 limit_model_setting 的内容提升到 limits 层级
				settingMap["limits"] = modelSettingRaw

				newSettingBytes, err := json.Marshal(settingMap)
				if err != nil {
					continue
				}

				tx.Model(&Token{}).Where("id = ?", token.Id).Update("setting", datatypes.JSON(newSettingBytes))
			}

			return nil
		},
	}
}
func migrationAfter(db *gorm.DB) error {
	// 从库不执行
	if !config.IsMasterNode {
		logger.SysLog("从库不执行迁移后操作")
		return nil
	}
	m := gormigrate.New(db, gormigrate.DefaultOptions, []*gormigrate.Migration{
		addStatistics(),
		changeChannelApiVersion(),
		initUserGroup(),
		addOldTokenMaxId(),
		addExtraRatios(),
		migrateTokenLimitsStructure(),
	})
	return m.Migrate()
}
