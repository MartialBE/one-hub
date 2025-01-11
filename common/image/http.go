package image

import (
	"encoding/json"
	"errors"
	"net/http"
	"one-api/common/config"
	"one-api/common/utils"
	"time"
)

var ImageHttpClients = &http.Client{
	Transport: &http.Transport{
		DialContext: utils.Socks5ProxyFunc,
		Proxy:       utils.ProxyFunc,
	},
	Timeout: 15 * time.Second,
}

var maxFileSize int64 = 20 * 1024 * 1024 // 20MB

type CFRequest struct {
	Action string `json:"action"`
	APIKey string `json:"api_key"`
	URL    string `json:"url"`
}

type CFResponse struct {
	Status   bool   `json:"status"`
	Message  string `json:"message,omitempty"`
	Data     string `json:"data,omitempty"`
	MimeType string `json:"mimeType,omitempty"`
}

func RequestFile(url, action string) (*http.Response, error) {
	var resCF *CFRequest
	reqUrl := url
	method := http.MethodGet

	if config.CFWorkerImageUrl != "" {
		resCF = &CFRequest{
			Action: action,
			APIKey: config.CFWorkerImageKey,
			URL:    url,
		}
		reqUrl = config.CFWorkerImageUrl
		method = http.MethodPost
	}

	res, err := utils.RequestBuilder(utils.SetProxy(config.ChatImageRequestProxy, nil), method, reqUrl, resCF, nil)

	if err != nil {
		return nil, err
	}

	response, err := ImageHttpClients.Do(res)
	if err != nil {
		return nil, err
	}

	response.Body = http.MaxBytesReader(nil, response.Body, maxFileSize)

	if response.StatusCode != http.StatusOK && config.CFWorkerImageUrl != "" {
		var cfResp *CFResponse
		err = json.NewDecoder(response.Body).Decode(&cfResp)
		if err != nil {
			return nil, err
		}
		return nil, errors.New(cfResp.Message)
	}

	return response, err
}
