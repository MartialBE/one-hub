package baidu

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"one-api/common/cache"
	"one-api/common/logger"
	"one-api/common/requester"
	"one-api/model"
	"one-api/providers/base"
	"one-api/providers/openai"
	"one-api/types"
	"strings"
	"time"
)

// 定义供应商工厂
type BaiduProviderFactory struct{}

var baiduCacheKey = "api_token:baidu"

const (
	OpenaiBaseURL = "https://qianfan.baidubce.com"
	BaiduBaseURL  = "https://aip.baidubce.com"
)

// 创建 BaiduProvider
type BaiduProvider struct {
	openai.OpenAIProvider

	UseOpenaiAPI bool
}

func (f BaiduProviderFactory) Create(channel *model.Channel) base.ProviderInterface {
	useOpenaiAPI := false

	if channel.Plugin != nil {
		plugin := channel.Plugin.Data()
		if pOpenAI, ok := plugin["use_openai_api"]; ok {
			if enable, ok := pOpenAI["enable"].(bool); ok && enable {
				useOpenaiAPI = true
			}
		}
	}
	providers := &BaiduProvider{
		OpenAIProvider: openai.OpenAIProvider{
			BaseProvider: base.BaseProvider{
				Config:  getConfig(useOpenaiAPI),
				Channel: channel,
			},
			// StreamEscapeJSON:     true,
			SupportStreamOptions: true,
		},
		UseOpenaiAPI: useOpenaiAPI,
	}

	if useOpenaiAPI {
		providers.Requester = requester.NewHTTPRequester(*channel.Proxy, openai.RequestErrorHandle)
	} else {
		providers.Requester = requester.NewHTTPRequester(*channel.Proxy, requestErrorHandle)
	}

	return providers
}

func getConfig(useOpenaiAPI bool) base.ProviderConfig {
	if useOpenaiAPI {
		return base.ProviderConfig{
			BaseURL:         OpenaiBaseURL,
			ChatCompletions: "/v2/chat/completions",
			Embeddings:      "/v2/embeddings",
		}
	}
	return base.ProviderConfig{
		BaseURL:         "https://aip.baidubce.com",
		ChatCompletions: "/rpc/2.0/ai_custom/v1/wenxinworkshop/chat",
		Embeddings:      "/rpc/2.0/ai_custom/v1/wenxinworkshop/embeddings",
	}
}

// 请求错误处理
func requestErrorHandle(resp *http.Response) *types.OpenAIError {
	baiduError := &BaiduError{}
	err := json.NewDecoder(resp.Body).Decode(baiduError)
	if err != nil {
		return nil
	}

	return errorHandle(baiduError)
}

// 错误处理
func errorHandle(baiduError *BaiduError) *types.OpenAIError {
	if baiduError.ErrorMsg == "" {
		return nil
	}
	return &types.OpenAIError{
		Message: baiduError.ErrorMsg,
		Type:    "baidu_error",
		Code:    baiduError.ErrorCode,
	}
}

var modelNameMap = map[string]string{
	"ERNIE-4.0-Turbo-8K":           "ernie-4.0-turbo-8k",
	"ERNIE-4.0-8K-Latest":          "ernie-4.0-8k-latest",
	"ERNIE-4.0-8K-0613":            "ernie-4.0-8k-0613",
	"ERNIE-3.5-8K-0613":            "ernie-3.5-8k-0613",
	"ERNIE-Bot-turbo":              "eb-instant",
	"ERNIE-Lite-8K-0922":           "eb-instant",
	"ERNIE-Lite-8K":                "ernie-lite-8k",
	"ERNIE-Lite-8K-0308":           "ernie-lite-8k",
	"ERNIE-3.5-8K":                 "completions",
	"ERNIE-Bot":                    "completions",
	"ERNIE-4.0-8K":                 "completions_pro",
	"ERNIE-4.0-8K-Preview":         "ernie-4.0-8k-preview",
	"ERNIE-4.0-8K-Preview-0518":    "completions_adv_pro",
	"ERNIE-4.0-8K-0329":            "ernie-4.0-8k-0329",
	"ERNIE-4.0-8K-0104":            "ernie-4.0-8k-0104",
	"ERNIE-Bot-4":                  "completions_pro",
	"ERNIE-Bot-8k":                 "ernie_bot_8k",
	"ERNIE-3.5-128K":               "ernie-3.5-128k",
	"ERNIE-3.5-8K-preview":         "ernie-3.5-8k-preview",
	"ERNIE-3.5-8K-0329":            "ernie-3.5-8k-0329",
	"ERNIE-3.5-4K-0205":            "ernie-3.5-4k-0205",
	"ERNIE-3.5-8K-0205":            "ernie-3.5-8k-0205",
	"ERNIE-3.5-8K-1222":            "ernie-3.5-8k-1222",
	"ERNIE Speed":                  "ernie_speed",
	"ERNIE-Speed":                  "ernie_speed",
	"ERNIE-Speed-8K":               "ernie_speed",
	"ERNIE-Speed-128K":             "ernie-speed-128k",
	"ERNIE Speed-AppBuilder":       "ai_apaas",
	"ERNIE-Tiny-8K":                "ernie-tiny-8k",
	"ERNIE-Function-8K":            "ernie-func-8k",
	"ERNIE-Character-8K":           "ernie-char-8k",
	"ERNIE-Character-Fiction-8K":   "ernie-char-fiction-8k",
	"ERNIE-Bot-turbo-AI":           "ai_apaas",
	"EB-turbo-AppBuilder":          "ai_apaas",
	"BLOOMZ-7B":                    "bloomz_7b1",
	"Llama-2-7b-chat":              "llama_2_7b",
	"Llama-2-13b-chat":             "llama_2_13b",
	"Llama-2-70b-chat":             "llama_2_70b",
	"Qianfan-Chinese-Llama-2-7B":   "qianfan_chinese_llama_2_7b",
	"Qianfan-Chinese-Llama-2-13B":  "qianfan_chinese_llama_2_13b",
	"Qianfan-Chinese-Llama-2-70B":  "qianfan_chinese_llama_2_70b",
	"Meta-Llama-3-8B":              "llama_3_8b",
	"Meta-Llama-3-70B":             "llama_3_70b",
	"Qianfan-BLOOMZ-7B-compressed": "qianfan_bloomz_7b_compressed",
	"ChatGLM2-6B-32K":              "chatglm2_6b_32k",
	"AquilaChat-7B":                "aquilachat_7b",
	"XuanYuan-70B-Chat-4bit":       "xuanyuan_70b_chat",
	"ChatLaw":                      "chatlaw",
	"Yi-34B-Chat":                  "yi_34b_chat",
	"Mixtral-8x7B-Instruct":        "mixtral_8x7b_instruct",
	"Gemma-7B-it":                  "gemma_7b_it",
}

// 获取完整请求 URL
func (p *BaiduProvider) GetFullRequestURL(requestURL string, modelName string) string {
	if p.UseOpenaiAPI {
		return fmt.Sprintf("%s%s", p.GetBaseURL(), requestURL)
	}

	if modelNameConvert, ok := modelNameMap[modelName]; ok {
		modelName = modelNameConvert
	}

	baseURL := strings.TrimSuffix(p.GetBaseURL(), "/")
	apiKey, err := p.getBaiduAccessToken()
	if err != nil {
		return ""
	}

	return fmt.Sprintf("%s%s/%s?access_token=%s", baseURL, requestURL, modelName, apiKey)
}

// 获取请求头
func (p *BaiduProvider) GetRequestHeaders() (headers map[string]string) {
	headers = make(map[string]string)
	p.CommonRequestHeaders(headers)

	if p.UseOpenaiAPI {
		headers["Authorization"] = fmt.Sprintf("Bearer %s", p.Channel.Key)
	}

	return headers
}

func (p *BaiduProvider) getBaiduAccessToken() (string, error) {
	apiKey := p.Channel.Key
	cacheKey := fmt.Sprintf("%s:%d", baiduCacheKey, p.Channel.Id)
	tokenStr, err := cache.GetCache[string](cacheKey)
	if err != nil {
		logger.SysError("get baidu token error: " + err.Error())
	}

	if tokenStr != "" {
		return tokenStr, nil
	}

	accessToken, err := p.getBaiduAccessTokenHelper(apiKey)
	if err != nil {
		return "", err
	}
	if accessToken == nil {
		return "", errors.New("getBaiduAccessToken return a nil token")
	}

	cache.SetCache(cacheKey, accessToken.AccessToken, time.Duration(accessToken.ExpiresIn)*time.Second)

	return accessToken.AccessToken, nil
}

func (p *BaiduProvider) getBaiduAccessTokenHelper(apiKey string) (*BaiduAccessToken, error) {
	parts := strings.Split(apiKey, "|")
	if len(parts) != 2 {
		return nil, errors.New("invalid baidu apikey")
	}

	url := fmt.Sprintf(p.Config.BaseURL+"/oauth/2.0/token?grant_type=client_credentials&client_id=%s&client_secret=%s", parts[0], parts[1])

	var headers = map[string]string{
		"Content-Type": "application/json",
		"Accept":       "application/json",
	}

	req, err := p.Requester.NewRequest("POST", url, p.Requester.WithHeader(headers))
	if err != nil {
		return nil, err
	}
	var accessToken BaiduAccessToken
	_, errWithCode := p.Requester.SendRequest(req, &accessToken, false)
	if errWithCode != nil {
		return nil, errors.New(errWithCode.OpenAIError.Message)
	}
	if accessToken.Error != "" {
		return nil, errors.New(accessToken.Error + ": " + accessToken.ErrorDescription)
	}
	if accessToken.AccessToken == "" {
		return nil, errors.New("getBaiduAccessTokenHelper get empty access token")
	}
	return &accessToken, nil
}
