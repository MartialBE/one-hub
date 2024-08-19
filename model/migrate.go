package model

import (
	"encoding/json"
	"one-api/common/config"
	"one-api/common/logger"
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

func migrationAfter(db *gorm.DB) error {
	// 从库不执行
	if !config.IsMasterNode {
		logger.SysLog("从库不执行迁移后操作")
		return nil
	}
	m := gormigrate.New(db, gormigrate.DefaultOptions, []*gormigrate.Migration{
		addStatistics(),
		changeChannelApiVersion(),
	})
	return m.Migrate()
}
