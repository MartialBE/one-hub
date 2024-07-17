package logger

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"

	"one-api/common/utils"

	"github.com/spf13/viper"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

const (
	loggerINFO  = "INFO"
	loggerWarn  = "WARN"
	loggerError = "ERR"
)
const (
	RequestIdKey = "X-Oneapi-Request-Id"
)

// const maxLogCount = 1000000

// var logCount int
var setupLogLock sync.Mutex
var setupLogWorking bool
var Logger *zap.Logger

// var logLevel       zap.AtomicLevel

var defaultLogDir = "./logs"

func SetupLogger() {
	logDir := getLogDir()
	if logDir == "" {
		return
	}

	setupLogLock.Lock()
	defer setupLogLock.Unlock()

	if setupLogWorking {
		log.Println("setup log is already working")
		return
	}
	setupLogWorking = true
	defer func() { setupLogWorking = false }()

	logPath := filepath.Join(logDir, fmt.Sprintf("oneapi-%s.log", time.Now().Format("20060102")))
	fd, err := os.OpenFile(logPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Fatal("failed to open log file: ", err)
	}

	encoderConfig := zapcore.EncoderConfig{
		TimeKey:        "time",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "caller",
		MessageKey:     "msg",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.CapitalLevelEncoder,
		EncodeTime:     zapcore.TimeEncoderOfLayout("2006/01/02 - 15:04:05"),
		EncodeDuration: zapcore.StringDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}

	core := zapcore.NewCore(
		zapcore.NewConsoleEncoder(encoderConfig),
		zapcore.NewMultiWriteSyncer(zapcore.AddSync(os.Stdout), zapcore.AddSync(fd)),
		zap.NewAtomicLevelAt(getLogLevel()),
	)
	Logger = zap.New(core)
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
