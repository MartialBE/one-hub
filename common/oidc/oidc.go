package oidc

import (
	"context"
	"github.com/coreos/go-oidc"
	"golang.org/x/oauth2"
	"one-api/common/config"
	"one-api/common/logger"
	"strings"
	"sync"
)

type OIDCConfig struct {
	Provider     *oidc.Provider
	OAuth2Config *oauth2.Config
	Verifier     *oidc.IDTokenVerifier
	LoginURL     func(state string) string
}

var oidcConfigInstance *OIDCConfig

// 初始化OIDC配置
func InitOIDCConfig() error {
	if !config.OIDCAuthEnabled {
		return nil
	}
	logger.SysLog("OIDC功能启用")
	provider, err := oidc.NewProvider(context.Background(), config.OIDCIssuer)
	if err != nil {
		logger.SysError("OIDC配置错误, err:" + err.Error())
		return err
	}

	oauth2Config := &oauth2.Config{
		ClientID:     config.OIDCClientId,
		ClientSecret: config.OIDCClientSecret, // 修正 ClientSecret
		RedirectURL:  config.ServerAddress + "/oauth/oidc",
		Endpoint:     provider.Endpoint(),
		Scopes:       strings.Split(config.OIDCScopes, ","),
	}

	verifier := provider.Verifier(&oidc.Config{ClientID: oauth2Config.ClientID})

	oidcConfigInstance = &OIDCConfig{
		Provider:     provider,
		OAuth2Config: oauth2Config,
		Verifier:     verifier,
		LoginURL: func(state string) string {
			return oauth2Config.AuthCodeURL(state, oauth2.AccessTypeOffline)
		},
	}

	return nil
}

// 确保线程安全
var mu sync.Mutex

// 获取 OIDCConfig 实例，如果未初始化则进行初始化
func GetOIDCConfigInstance() (*OIDCConfig, error) {
	mu.Lock()
	defer mu.Unlock()
	if oidcConfigInstance == nil {
		err := InitOIDCConfig()
		if err != nil {
			return nil, err
		}
	}
	return oidcConfigInstance, nil
}
