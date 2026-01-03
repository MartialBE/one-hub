package model

import (
	"encoding/json"
	"fmt"
	"one-api/common/clickhouse"
	"one-api/common/config"
	"one-api/common/logger"
	"sync"
	"time"

	"gorm.io/gorm"
)

const (
	BatchUpdateTypeUserQuota = iota
	BatchUpdateTypeTokenQuota
	BatchUpdateTypeUsedQuota
	BatchUpdateTypeChannelUsedQuota
	BatchUpdateTypeRequestCount
	BatchUpdateTypeCount // if you add a new type, you need to add a new map and a new lock
)

var batchUpdateStores []map[int]int
var batchUpdateLocks []sync.Mutex

var batchLogStore []*Log
var batchLogLock sync.Mutex

// ClickHouse 专用缓存
var batchLogStoreClick []*Log
var batchLogLockClick sync.Mutex

func init() {
	for i := 0; i < BatchUpdateTypeCount; i++ {
		batchUpdateStores = append(batchUpdateStores, make(map[int]int))
		batchUpdateLocks = append(batchUpdateLocks, sync.Mutex{})
	}
}

func InitBatchUpdater() {
	go func() {
		for {
			time.Sleep(time.Duration(config.BatchUpdateInterval) * time.Second)
			batchUpdate()
			flushBatchLogs()
			flushBatchLogsClick()
		}
	}()
}

// InitClickHouseBatchUpdater 初始化 ClickHouse 独立批量刷新器
// 这个函数独立于 MySQL 的批量更新机制，确保 ClickHouse 日志即使没有启用 MySQL 批量更新也能正常刷新
func InitClickHouseBatchUpdater(interval int) {
	go func() {
		for {
			time.Sleep(time.Duration(interval) * time.Second)
			flushBatchLogsClick()
		}
	}()
}

func AddLogToBatch(log *Log) {
	batchLogLock.Lock()
	defer batchLogLock.Unlock()
	batchLogStore = append(batchLogStore, log)
}

func flushBatchLogs() {
	batchLogLock.Lock()
	logs := batchLogStore
	batchLogStore = nil
	batchLogLock.Unlock()

	if len(logs) == 0 {
		return
	}

	logger.SysLog(fmt.Sprintf("batch inserting %d logs", len(logs)))
	err := BatchInsert(DB, logs)
	if err != nil {
		logger.SysError("failed to batch insert logs: " + err.Error())
	}
}

// AddLogToBatchClick 添加日志到 ClickHouse 批量缓存（独立于 MySQL）
func AddLogToBatchClick(log *Log) {
	if !config.ClickHouseEnabled {
		return
	}
	batchLogLockClick.Lock()
	defer batchLogLockClick.Unlock()
	batchLogStoreClick = append(batchLogStoreClick, log)
}

// flushBatchLogsClick 批量刷新日志到 ClickHouse
func flushBatchLogsClick() {
	if !config.ClickHouseEnabled {
		return
	}

	batchLogLockClick.Lock()
	logs := batchLogStoreClick
	batchLogStoreClick = nil
	batchLogLockClick.Unlock()

	if len(logs) == 0 {
		return
	}

	// 转换为 ClickHouse LogEntry
	entries := make([]*clickhouse.LogEntry, 0, len(logs))
	for _, log := range logs {
		metadataStr := ""
		if log.Metadata.Data() != nil {
			if data, err := json.Marshal(log.Metadata.Data()); err == nil {
				metadataStr = string(data)
			}
		}

		entry := &clickhouse.LogEntry{
			UserId:           int32(log.UserId),
			CreatedAt:        log.CreatedAt,
			Type:             int8(log.Type),
			Content:          log.Content,
			Username:         log.Username,
			TokenName:        log.TokenName,
			ModelName:        log.ModelName,
			Quota:            int32(log.Quota),
			PromptTokens:     int32(log.PromptTokens),
			CompletionTokens: int32(log.CompletionTokens),
			ChannelId:        int32(log.ChannelId),
			RequestTime:      int32(log.RequestTime),
			IsStream:         log.IsStream,
			SourceIp:         log.SourceIp,
			Metadata:         metadataStr,
		}
		entries = append(entries, entry)
	}

	logger.SysLog(fmt.Sprintf("batch inserting %d logs to ClickHouse", len(entries)))
	if err := clickhouse.BatchInsert(entries); err != nil {
		logger.SysError("failed to batch insert logs to ClickHouse: " + err.Error())
	}
}

func addNewRecord(type_ int, id int, value int) {
	batchUpdateLocks[type_].Lock()
	defer batchUpdateLocks[type_].Unlock()
	if _, ok := batchUpdateStores[type_][id]; !ok {
		batchUpdateStores[type_][id] = value
	} else {
		batchUpdateStores[type_][id] += value
	}
}

func batchUpdate() {
	logger.SysLog("batch update started")
	for i := 0; i < BatchUpdateTypeCount; i++ {
		batchUpdateLocks[i].Lock()
		store := batchUpdateStores[i]
		batchUpdateStores[i] = make(map[int]int)
		batchUpdateLocks[i].Unlock()
		// TODO: maybe we can combine updates with same key?
		for key, value := range store {
			switch i {
			case BatchUpdateTypeUserQuota:
				err := increaseUserQuota(key, value)
				if err != nil {
					logger.SysError("failed to batch update user quota: " + err.Error())
				}
			case BatchUpdateTypeTokenQuota:
				err := increaseTokenQuota(key, value)
				if err != nil {
					logger.SysError("failed to batch update token quota: " + err.Error())
				}
			case BatchUpdateTypeUsedQuota:
				updateUserUsedQuota(key, value)
			case BatchUpdateTypeRequestCount:
				updateUserRequestCount(key, value)
			case BatchUpdateTypeChannelUsedQuota:
				updateChannelUsedQuota(key, value)
			}
		}
	}
	logger.SysLog("batch update finished")
}

func BatchInsert[T any](db *gorm.DB, data []T) error {
	batchSize := 200
	for i := 0; i < len(data); i += batchSize {
		end := i + batchSize
		if end > len(data) {
			end = len(data)
		}
		if err := batchInsertWithRetry(db, data[i:end]); err != nil {
			logger.SysError(fmt.Sprintf("batch insert failed after retry, lost %d records: %s", end-i, err.Error()))
		}
	}
	return nil
}

// batchInsertWithRetry 使用二分法进行容错插入
// 当批量插入失败时，将数据二分后分别尝试插入，递归直到单条记录
func batchInsertWithRetry[T any](db *gorm.DB, data []T) error {
	if len(data) == 0 {
		return nil
	}

	// 尝试批量插入
	err := db.Create(data).Error
	if err == nil {
		return nil
	}

	// 如果只有一条记录且失败，记录错误并跳过这条记录
	if len(data) == 1 {
		logger.SysError(fmt.Sprintf("failed to insert single record: %s", err.Error()))
		return err
	}

	// 二分继续尝试
	mid := len(data) / 2
	logger.SysLog(fmt.Sprintf("batch insert failed, splitting %d records into two halves", len(data)))

	// 分别插入两半，即使一半失败也继续插入另一半
	err1 := batchInsertWithRetry(db, data[:mid])
	err2 := batchInsertWithRetry(db, data[mid:])

	// 返回第一个错误（如果有的话）
	if err1 != nil {
		return err1
	}
	return err2
}
