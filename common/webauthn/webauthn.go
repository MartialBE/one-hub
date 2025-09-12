package webauthn

import (
	"log"
	"net/url"
	"one-api/common/config"
	"strings"
	"sync"

	"github.com/go-webauthn/webauthn/webauthn"
)

var w *webauthn.WebAuthn

// InitWebAuthn 初始化 WebAuthn 配置，用于在服务中启用 WebAuthn 身份验证功能。
// 如果初始化失败，将会记录致命错误，并终止程序运行。
func InitWebAuthn() error {
	rpID := extractRPID(config.ServerAddress)
	var err error
	w, err = webauthn.New(&webauthn.Config{
		RPDisplayName: config.SystemName, // 显示名称
		RPID:          rpID,              // FQDN
		RPOrigins: []string{
			config.ServerAddress,
		}, // 添加允许的源地址列表
	})
	if err != nil {
		log.Fatal("无法配置和创建WebAuthn:", err)
		return err
	}
	return nil
}

// 确保线程安全
var mu sync.Mutex

// GetWebAuthn 返回 WebAuthn 实例，如果尚未初始化，则初始化并返回。
// 如果初始化失败，返回错误。
func GetWebAuthn() (*webauthn.WebAuthn, error) {
	mu.Lock()
	defer mu.Unlock()
	if w == nil {
		err := InitWebAuthn()
		if err != nil {
			return nil, err
		}
	}
	return w, nil
}

// extractRPID 从服务器地址提取有效的 RPID
func extractRPID(serverAddress string) string {
	// 如果是 localhost，直接返回 localhost
	if strings.Contains(serverAddress, "localhost") {
		return "localhost"
	}

	// 解析URL获取主机名
	if !strings.HasPrefix(serverAddress, "http://") && !strings.HasPrefix(serverAddress, "https://") {
		serverAddress = "http://" + serverAddress
	}

	u, err := url.Parse(serverAddress)
	if err != nil {
		log.Printf("解析服务器地址失败: %v, 使用默认 localhost", err)
		return "localhost"
	}

	// 移除端口号，只保留主机名
	host := u.Hostname()
	if host == "" {
		return "localhost"
	}

	return host
}
