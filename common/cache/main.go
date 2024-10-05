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
	"golang.org/x/sync/singleflight"
)

var (
	kvCache       *marshaler.Marshaler
	ctx           = context.Background()
	sfGroup       singleflight.Group
	CacheTimeout  = 500 * time.Millisecond
	CacheNotFound = errors.New("cache not found")
)

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
			return *new(T), CacheNotFound
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

func GetOrSetCache[T any](key string, expiration time.Duration, fn func() (T, error), timeout time.Duration) (T, error) {
	v, err := GetCache[T](key)
	if err == nil {
		return v, nil
	}

	if !errors.Is(err, CacheNotFound) {
		return *new(T), err
	}

	result := sfGroup.DoChan(key, func() (interface{}, error) {
		v, err := fn()
		if err != nil {
			return nil, err
		}

		SetCache(key, v, expiration)

		return v, nil
	})

	t := time.After(timeout)

	select {
	case r := <-result:
		v, ok := r.Val.(T)
		if !ok {
			return *new(T), errors.New("类型断言失败")
		}
		return v, r.Err
	case <-t:
		return *new(T), errors.New("超时")
	}
}
