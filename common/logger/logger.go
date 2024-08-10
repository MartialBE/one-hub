package logger

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"one-api/common/utils"

	"github.com/spf13/viper"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

const (
	loggerINFO  = "INFO"
	loggerWarn  = "WARN"
	loggerError = "ERR"
)
const (
	RequestIdKey = "X-Oneapi-Request-Id"
)

var Logger *zap.Logger

var defaultLogDir = "./logs"

func SetupLogger() {
	logDir := getLogDir()
	if logDir == "" {
		return
	}

	writeSyncer := getLogWriter(logDir)

	encoder := getEncoder()

	core := zapcore.NewCore(
		encoder,
		writeSyncer,
		zap.NewAtomicLevelAt(getLogLevel()),
	)
	Logger = zap.New(core, zap.AddCaller())
}

func getEncoder() zapcore.Encoder {
	encodeConfig := zap.NewProductionEncoderConfig()

	encodeConfig.EncodeTime = zapcore.TimeEncoderOfLayout("2006/01/02 - 15:04:05")
	encodeConfig.TimeKey = "time"
	encodeConfig.EncodeLevel = zapcore.CapitalLevelEncoder
	encodeConfig.EncodeCaller = zapcore.ShortCallerEncoder

	encodeConfig.EncodeDuration = zapcore.StringDurationEncoder

	return zapcore.NewConsoleEncoder(encodeConfig)
}

func getLogWriter(logDir string) zapcore.WriteSyncer {
	filename := utils.GetOrDefault("logs.filename", "one-hub.log")
	logPath := filepath.Join(logDir, filename)

	maxsize := utils.GetOrDefault("logs.max_size", 100)
	maxAge := utils.GetOrDefault("logs.max_age", 7)
	maxBackup := utils.GetOrDefault("logs.max_backup", 10)
	compress := utils.GetOrDefault("logs.compress", false)

	lumberJackLogger := &lumberjack.Logger{
		Filename:   logPath,   // 文件位置
		MaxSize:    maxsize,   // 进行切割之前,日志文件的最大大小(MB为单位)
		MaxAge:     maxAge,    // 保留旧文件的最大天数
		MaxBackups: maxBackup, // 保留旧文件的最大个数
		Compress:   compress,  // 是否压缩/归档旧文件
	}

	return zapcore.NewMultiWriteSyncer(zapcore.AddSync(lumberJackLogger), zapcore.AddSync(os.Stderr))
}

func getLogLevel() zapcore.Level {
	logLevel := viper.GetString("log_level")
	switch logLevel {
	case "debug":
		return zap.DebugLevel
	case "info":
		return zap.InfoLevel
	case "warn":
		return zap.WarnLevel
	case "error":
		return zap.ErrorLevel
	case "panic":
		return zap.PanicLevel
	case "fatal":
		return zap.FatalLevel
	default:
		return zap.InfoLevel
	}

}

func getLogDir() string {
	logDir := viper.GetString("log_dir")
	if logDir == "" {
		logDir = defaultLogDir
	}

	var err error
	logDir, err = filepath.Abs(logDir)
	if err != nil {
		log.Fatal(err)
		return ""
	}

	if !utils.IsFileExist(logDir) {
		err = os.Mkdir(logDir, 0777)
		if err != nil {
			log.Fatal(err)
			return ""
		}
	}

	return logDir
}

func SysLog(s string) {
	entry := zapcore.Entry{
		Level:   zapcore.InfoLevel,
		Time:    time.Now(),
		Message: "[SYS] | " + s,
	}

	// 使用 Logger 的核心来直接写入日志，绕过等级检查
	if ce := Logger.Core().With([]zapcore.Field{}); ce != nil {
		ce.Write(entry, nil)
	}
}

func SysError(s string) {
	Logger.Error("[SYS] | " + s)
}

func LogInfo(ctx context.Context, msg string) {
	logHelper(ctx, loggerINFO, msg)
}

func LogWarn(ctx context.Context, msg string) {
	logHelper(ctx, loggerWarn, msg)
}

func LogError(ctx context.Context, msg string) {
	logHelper(ctx, loggerError, msg)
}

func logHelper(ctx context.Context, level string, msg string) {

	id, ok := ctx.Value(RequestIdKey).(string)
	if !ok {
		id = "unknown"
	}

	logMsg := fmt.Sprintf("%s | %s \n", id, msg)

	switch level {
	case loggerINFO:
		Logger.Info(logMsg)
	case loggerWarn:
		Logger.Warn(logMsg)
	case loggerError:
		Logger.Error(logMsg)
	default:
		Logger.Info(logMsg)
	}

}

func FatalLog(v ...any) {

	Logger.Fatal(fmt.Sprintf("[FATAL] %v | %v \n", time.Now().Format("2006/01/02 - 15:04:05"), v))
	// t := time.Now()
	// _, _ = fmt.Fprintf(gin.DefaultErrorWriter, "[FATAL] %v | %v \n", t.Format("2006/01/02 - 15:04:05"), v)
	os.Exit(1)
}
