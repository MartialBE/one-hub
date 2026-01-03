package clickhouse

import (
	"context"
	"fmt"
	"one-api/common/config"
	"one-api/common/logger"
	"time"

	"github.com/ClickHouse/clickhouse-go/v2"
	"github.com/ClickHouse/clickhouse-go/v2/lib/driver"
	"github.com/spf13/viper"
)

var Conn driver.Conn

// LogEntry ClickHouse 日志结构（与 model.Log 字段对应）
type LogEntry struct {
	UserId           int32
	CreatedAt        int64
	Type             int8
	Content          string
	Username         string
	TokenName        string
	ModelName        string
	Quota            int32
	PromptTokens     int32
	CompletionTokens int32
	ChannelId        int32
	RequestTime      int32
	IsStream         bool
	SourceIp         string
	Metadata         string // JSON 字符串
}

// InitClickHouseClient 初始化 ClickHouse 连接
func InitClickHouseClient() error {
	connString := viper.GetString("clickhouse_conn_string")

	if connString == "" {
		logger.SysLog("CLICKHOUSE_CONN_STRING not set, ClickHouse is not enabled")
		return nil
	}

	logger.SysLog("ClickHouse is enabled, connecting...")

	// 解析连接字符串
	// 格式: clickhouse://user:password@host:9000/database?dial_timeout=10s
	options, err := clickhouse.ParseDSN(connString)
	if err != nil {
		logger.SysError("failed to parse ClickHouse connection string: " + err.Error())
		return err
	}

	// 设置连接参数
	options.MaxOpenConns = 10
	options.MaxIdleConns = 5
	options.ConnMaxLifetime = time.Hour

	conn, err := clickhouse.Open(options)
	if err != nil {
		logger.SysError("failed to connect to ClickHouse: " + err.Error())
		return err
	}

	// 测试连接
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := conn.Ping(ctx); err != nil {
		logger.SysError("ClickHouse ping test failed: " + err.Error())
		return err
	}

	Conn = conn
	config.ClickHouseEnabled = true
	logger.SysLog("ClickHouse connection established successfully")

	// 初始化表结构
	if err := initTable(); err != nil {
		logger.SysError("failed to initialize ClickHouse table: " + err.Error())
		return err
	}

	return nil
}

// initTable 初始化日志表（带 TTL）
func initTable() error {
	ctx := context.Background()

	ttlClause := ""
	if config.ClickHouseLogTTLDays > 0 {
		ttlClause = fmt.Sprintf("TTL parseDateTimeBestEffort(created_time) + INTERVAL %d DAY", config.ClickHouseLogTTLDays)
	}

	createTableSQL := fmt.Sprintf(`
		CREATE TABLE IF NOT EXISTS logs (
			user_id           Int32,
			created_at        Int64,
			type              Int8,
			content           String,
			username          String,
			token_name        String,
			model_name        String,
			quota             Int32,
			prompt_tokens     Int32,
			completion_tokens Int32,
			channel_id        Int32,
			request_time      Int32,
			is_stream         Bool,
			source_ip         String,
			metadata          String,

			created_time      String DEFAULT formatDate(toDateTime(created_at), '%Y-%m-%d')
		) ENGINE = MergeTree()
		ORDER BY (created_time, created_at, user_id)
		PARTITION BY created_time
		%s
	`, ttlClause)

	if err := Conn.Exec(ctx, createTableSQL); err != nil {
		return err
	}

	logger.SysLog("ClickHouse logs table initialized successfully")
	return nil
}

// BatchInsert 批量插入日志到 ClickHouse
func BatchInsert(logs []*LogEntry) error {
	if len(logs) == 0 {
		return nil
	}

	ctx := context.Background()

	batch, err := Conn.PrepareBatch(ctx, `
		INSERT INTO logs (
			user_id, created_at, type, content, username,
			token_name, model_name, quota, prompt_tokens,
			completion_tokens, channel_id, request_time,
			is_stream, source_ip, metadata
		)
	`)
	if err != nil {
		return err
	}

	for _, log := range logs {
		err := batch.Append(
			log.UserId,
			log.CreatedAt,
			log.Type,
			log.Content,
			log.Username,
			log.TokenName,
			log.ModelName,
			log.Quota,
			log.PromptTokens,
			log.CompletionTokens,
			log.ChannelId,
			log.RequestTime,
			log.IsStream,
			log.SourceIp,
			log.Metadata,
		)
		if err != nil {
			logger.SysError(fmt.Sprintf("failed to append log entry to ClickHouse batch: %v", err))
			continue
		}
	}

	return batch.Send()
}

// CloseClickHouse 关闭连接
func CloseClickHouse() error {
	if Conn != nil {
		return Conn.Close()
	}
	return nil
}
