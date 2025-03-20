package controller

import (
	"embed"
	"fmt"
	"github.com/spf13/viper"
	"io"
	"net/http"
	"one-api/common/logger"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// 缓存
var (
	faviconCache     []byte           // 缓存的favicon数据
	faviconCacheLock sync.RWMutex     // 读写锁保护缓存
	faviconCacheTime time.Time        // 缓存创建时间
	urlCacheDuration = 24 * time.Hour // URL favicon的缓存时间，可根据需要调整
)

func Favicon(buildFS embed.FS) gin.HandlerFunc {
	return func(context *gin.Context) {
		getFavicon(buildFS, context)
	}
}

func getFavicon(buildFS embed.FS, c *gin.Context) {
	var CustomFaviconPath = viper.GetString("favicon")

	// 检查缓存是否可用
	faviconCacheLock.RLock()
	hasCachedFavicon := len(faviconCache) > 0
	isURLFavicon := CustomFaviconPath != "" && (strings.HasPrefix(CustomFaviconPath, "http://") ||
		strings.HasPrefix(CustomFaviconPath, "https://"))
	isCacheExpired := isURLFavicon && time.Since(faviconCacheTime) > urlCacheDuration
	faviconCacheLock.RUnlock()

	// 如果有缓存且未过期，直接使用缓存
	if hasCachedFavicon && !isCacheExpired {
		logger.Logger.Debug("使用缓存的favicon")
		c.Header("Cache-Control", "public, max-age=3600")
		faviconCacheLock.RLock()
		c.Data(http.StatusOK, "image/x-icon", faviconCache)
		faviconCacheLock.RUnlock()
		return
	}

	// 需要加载或重新加载favicon
	if CustomFaviconPath != "" {
		logger.Logger.Debug(fmt.Sprintf("获取favicon：%s", CustomFaviconPath))
		var faviconData []byte
		var err error

		// 检查是否为URL
		if isURLFavicon {
			// 从URL获取favicon
			client := &http.Client{Timeout: 10 * time.Second}
			resp, err := client.Get(CustomFaviconPath)
			if err == nil && resp.StatusCode == http.StatusOK {
				defer resp.Body.Close()
				faviconData, err = io.ReadAll(resp.Body)
				if err != nil {
					logger.Logger.Error(fmt.Sprintf("读取URL favicon失败: %v", err))
				}
			} else {
				if resp != nil {
					logger.Logger.Error(fmt.Sprintf("获取URL favicon失败，状态码: %d", resp.StatusCode))
				} else {
					logger.Logger.Error(fmt.Sprintf("获取URL favicon失败: %v", err))
				}
			}
		} else {
			// 尝试读取本地文件
			faviconData, err = os.ReadFile(CustomFaviconPath)
			if err != nil {
				logger.Logger.Error(fmt.Sprintf("读取本地favicon失败: %v", err))
			}
		}

		// 如果成功获取到自定义favicon，更新缓存
		if err == nil && len(faviconData) > 0 {
			faviconCacheLock.Lock()
			faviconCache = faviconData
			faviconCacheTime = time.Now()
			faviconCacheLock.Unlock()

			c.Header("Cache-Control", "public, max-age=3600")
			c.Data(http.StatusOK, "image/x-icon", faviconData)
			return
		}
		logger.Logger.Debug(fmt.Sprintf("自定义favicon获取失败，将使用默认favicon"))
	}

	// 检查默认favicon是否已缓存
	if !hasCachedFavicon {
		// 使用嵌入在二进制文件中的默认favicon
		defaultFaviconBytes, err := buildFS.ReadFile("web/build/favicon.ico")
		if err != nil {
			logger.Logger.Error(fmt.Sprintf("读取默认favicon失败: %v", err))
			c.Status(http.StatusNotFound)
			return
		}

		// 缓存默认favicon
		faviconCacheLock.Lock()
		faviconCache = defaultFaviconBytes
		faviconCacheTime = time.Now()
		faviconCacheLock.Unlock()

		c.Header("Cache-Control", "public, max-age=3600")
		c.Data(http.StatusOK, "image/x-icon", defaultFaviconBytes)
	} else {
		// 使用缓存的默认favicon
		c.Header("Cache-Control", "public, max-age=3600")
		faviconCacheLock.RLock()
		c.Data(http.StatusOK, "image/x-icon", faviconCache)
		faviconCacheLock.RUnlock()
	}
}
