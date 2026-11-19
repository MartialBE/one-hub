package image

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
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

func RequestFile(rawURL, action string) (*http.Response, error) {
	// A user-supplied image_url is fetched server-side before it reaches
	// the upstream provider, so the destination is checked before anything
	// is sent (#939): only public http(s) addresses a token holder may
	// point us at. The CF worker path keeps its own destination — the
	// worker, not this instance, fetches the url.
	if config.CFWorkerImageUrl == "" {
		u, err := url.Parse(rawURL)
		if err != nil {
			return nil, errUnsafeImageURL
		}
		if err := checkImageURL(u); err != nil {
			return nil, err
		}
	}

	// An address the check above didn't see, dialled on a redirect,
	// would undo it: the fetch runs on a client whose every hop lands
	// on a vetted public address (safeDialer) and stops after 10 hops.
	// The CF-worker path fetches its own url, which the worker's admin
	// configured, and keeps its plain transport.
	client := *ImageHttpClients
	if config.CFWorkerImageUrl == "" {
		client.Transport = &http.Transport{
			DialContext: safeDialer,
			Proxy:       utils.ProxyFunc,
		}
	}
	client.CheckRedirect = func(req *http.Request, via []*http.Request) error {
		if len(via) >= 10 {
			return errors.New("stopped after 10 redirects")
		}
		return nil
	}

	reqUrl := rawURL
	method := http.MethodGet
	var requestBody any

	if config.CFWorkerImageUrl != "" {
		requestBody = &CFRequest{
			Action: action,
			APIKey: config.CFWorkerImageKey,
			URL:    rawURL,
		}
		reqUrl = config.CFWorkerImageUrl
		method = http.MethodPost
	}

	res, err := utils.RequestBuilder(utils.SetProxy(config.ChatImageRequestProxy, nil), method, reqUrl, requestBody, nil)

	if err != nil {
		return nil, err
	}

	response, err := client.Do(res)
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
