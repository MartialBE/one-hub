package redis

import (
	"context"
	"one-api/common/config"
	"one-api/common/logger"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/spf13/viper"
)

var RDB *redis.Client

const Nil = redis.Nil

// InitRedisClient This function is called after init()
func InitRedisClient() (err error) {
	redisConn := viper.GetString("redis_conn_string")

	if redisConn == "" {
		logger.SysLog("REDIS_CONN_STRING not set, Redis is not enabled")
		return nil
	}
	if viper.GetInt("sync_frequency") == 0 {
		logger.SysLog("SYNC_FREQUENCY not set, Redis is disabled")
		return nil
	}
	logger.SysLog("Redis is enabled")
	opt, err := redis.ParseURL(redisConn)
	if err != nil {
		logger.FatalLog("failed to parse Redis connection string: " + err.Error())
		return
	}

	opt.DB = viper.GetInt("redis_db")
	RDB = redis.NewClient(opt)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = RDB.Ping(ctx).Result()
	if err != nil {
		logger.FatalLog("Redis ping test failed: " + err.Error())
	} else {
		config.RedisEnabled = true
		// for compatibility with old versions
		config.MemoryCacheEnabled = true
	}

	return err
}

func ParseRedisOption() *redis.Options {
	opt, err := redis.ParseURL(viper.GetString("redis_conn_string"))
	if err != nil {
		logger.FatalLog("failed to parse Redis connection string: " + err.Error())
	}
	return opt
}

func RedisSet(key string, value string, expiration time.Duration) error {
	ctx := context.Background()
	return RDB.Set(ctx, key, value, expiration).Err()
}

func RedisGet(key string) (string, error) {
	ctx := context.Background()
	return RDB.Get(ctx, key).Result()
}

func RedisDel(key string) error {
	ctx := context.Background()
	return RDB.Del(ctx, key).Err()
}

func RedisDecrease(key string, value int64) error {
	ctx := context.Background()
	return RDB.DecrBy(ctx, key, value).Err()
}

func NewScript(script string) *redis.Script {
	return redis.NewScript(script)
}

func GetRedisClient() *redis.Client {
	return RDB
}

func ScriptRunCtx(ctx context.Context, script *redis.Script, keys []string, args ...interface{}) (interface{}, error) {
	return script.Run(ctx, RDB, keys, args...).Result()
}

func RedisExists(key string) (bool, error) {
	ctx := context.Background()
	exists, err := RDB.Exists(ctx, key).Result()
	return exists > 0, err
}

func RedisSAdd(key string, members ...interface{}) error {
	ctx := context.Background()
	return RDB.SAdd(ctx, key, members...).Err()
}

func RedisSIsMember(key string, member interface{}) (bool, error) {
	ctx := context.Background()
	return RDB.SIsMember(ctx, key, member).Result()
}
