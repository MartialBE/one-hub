package model

import (
	"fmt"
	"one-api/common/cache"
	"one-api/common/config"
	"one-api/common/logger"
	"one-api/common/redis"
	"strconv"
	"time"
)

var (
	TokenCacheSeconds = 0
)

func CacheGetTokenByKey(key string) (*Token, error) {
	if !config.RedisEnabled {
		return GetTokenByKey(key)
	}

	token, err := cache.GetOrSetCache(
		fmt.Sprintf("token:%s", key),
		time.Duration(TokenCacheSeconds)*time.Second,
		func() (*Token, error) {
			return GetTokenByKey(key)
		},
		cache.CacheTimeout)

	return token, err
}

func CacheGetUserGroup(id int) (group string, err error) {
	if !config.RedisEnabled {
		return GetUserGroup(id)
	}

	group, err = cache.GetOrSetCache(
		fmt.Sprintf("user_group:%d", id),
		time.Duration(TokenCacheSeconds)*time.Second,
		func() (string, error) {
			groupId, err := GetUserGroup(id)
			if err != nil {
				return "", err
			}
			return groupId, nil
		},
		cache.CacheTimeout)

	return group, err
}

func CacheGetUserQuota(id int) (quota int, err error) {
	if !config.RedisEnabled {
		return GetUserQuota(id)
	}
	quotaString, err := redis.RedisGet(fmt.Sprintf("user_quota:%d", id))
	if err != nil {
		quota, err = GetUserQuota(id)
		if err != nil {
			return 0, err
		}
		err = redis.RedisSet(fmt.Sprintf("user_quota:%d", id), fmt.Sprintf("%d", quota), time.Duration(TokenCacheSeconds)*time.Second)
		if err != nil {
			logger.SysError("Redis set user quota error: " + err.Error())
		}
		return quota, err
	}
	quota, err = strconv.Atoi(quotaString)
	return quota, err
}

func CacheUpdateUserQuota(id int) error {
	if !config.RedisEnabled {
		return nil
	}
	quota, err := GetUserQuota(id)
	if err != nil {
		return err
	}
	err = redis.RedisSet(fmt.Sprintf("user_quota:%d", id), fmt.Sprintf("%d", quota), time.Duration(TokenCacheSeconds)*time.Second)
	return err
}

func CacheDecreaseUserQuota(id int, quota int) error {
	if !config.RedisEnabled {
		return nil
	}
	err := redis.RedisDecrease(fmt.Sprintf("user_quota:%d", id), int64(quota))
	return err
}

func CacheIsUserEnabled(userId int) (bool, error) {
	if !config.RedisEnabled {
		return IsUserEnabled(userId)
	}

	enabled, err := cache.GetOrSetCache(
		fmt.Sprintf("user_enabled:%d", userId),
		time.Duration(TokenCacheSeconds)*time.Second,
		func() (bool, error) {
			enabled, err := IsUserEnabled(userId)
			if err != nil {
				return false, err
			}
			return enabled, nil
		},
		cache.CacheTimeout)

	return enabled, err
}

func CacheGetUsername(id int) (username string, err error) {
	if !config.RedisEnabled {
		return GetUsernameById(id), nil
	}

	username, err = cache.GetOrSetCache(
		fmt.Sprintf("user_name:%d", id),
		time.Duration(TokenCacheSeconds)*time.Second,
		func() (string, error) {
			username := GetUsernameById(id)
			if username == "" {
				return "", fmt.Errorf("user %d not found", id)
			}

			return username, nil
		},
		cache.CacheTimeout)

	return username, err
}
