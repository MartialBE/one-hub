package config

// ClickHouse 相关配置
var ClickHouseEnabled = false  // 运行时标记，由 InitClickHouseClient 设置
var LogToMySQLEnabled = true          // 是否写入 MySQL（默认开启）
var LogToClickHouseEnabled = false    // 是否写入 ClickHouse（默认关闭）
var ClickHouseLogTTLDays = 0   // 日志保留天数，0 表示不自动删除
