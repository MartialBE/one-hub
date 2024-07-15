package cache

import (
	"context"
	"errors"
	"one-api/common/config"
	"one-api/common/redis"
	"time"

	"github.com/coocood/freecache"
	cacheM "github.com/eko/gocache/lib/v4/cache"
	"github.com/eko/gocache/lib/v4/marshaler"
	"github.com/eko/gocache/lib/v4/store"
	freecache_store "github.com/eko/gocache/store/freecache/v4"
	redis_store "github.com/eko/gocache/store/redis/v4"
)

var kvCache *marshaler.Marshaler
var ctx = context.Background()

func InitCacheManager() {
	var client *cacheM.Cache[any]
	if config.RedisEnabled {
		redisStore := redis_store.NewRedis(redis.RDB)
		client = cacheM.New[any](redisStore)
	} else {
		freecacheStore := freecache_store.NewFreecache(freecache.NewCache(1024 * 1024))
		client = cacheM.New[any](freecacheStore)
	}

	kvCache = marshaler.New(client)
}

func GetCache[T any](key string) (T, error) {
	var val T
	_, err := kvCache.Get(ctx, key, &val)
	if err != nil {
		if errors.Is(err, store.NotFound{}) {
			return val, nil
		}
		return *new(T), err
	}
	return val, nil
}

func SetCache(key string, value any, expiration time.Duration) error {
	return kvCache.Set(ctx, key, value, store.WithExpiration(expiration))
}

func DeleteCache(key string) error {
	return kvCache.Delete(ctx, key)
}
