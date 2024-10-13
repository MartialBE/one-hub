package base

import (
	"encoding/json"
	"fmt"
	"net/http"
	"one-api/common"
	"one-api/common/config"
	"one-api/common/requester"
	"one-api/common/utils"
	"one-api/model"
	"one-api/types"
	"strings"

	"github.com/gin-gonic/gin"
)

type ProviderConfig struct {
	BaseURL             string
	Completions         string
	ChatCompletions     string
	Embeddings          string
	AudioSpeech         string
	Moderation          string
	AudioTranscriptions string
	AudioTranslations   string
	ImagesGenerations   string
	ImagesEdit          string
	ImagesVariations    string
	ModelList           string
	Rerank              string
	ChatRealtime        string
}

func (pc *ProviderConfig) SetAPIUri(customMapping map[string]interface{}) {
	relayModeMap := map[int]*string{
		config.RelayModeChatCompletions:    &pc.ChatCompletions,
		config.RelayModeCompletions:        &pc.Completions,
		config.RelayModeEmbeddings:         &pc.Embeddings,
		config.RelayModeAudioSpeech:        &pc.AudioSpeech,
		config.RelayModeAudioTranscription: &pc.AudioTranscriptions,
		config.RelayModeAudioTranslation:   &pc.AudioTranslations,
		config.RelayModeModerations:        &pc.Moderation,
		config.RelayModeImagesGenerations:  &pc.ImagesGenerations,
		config.RelayModeImagesEdits:        &pc.ImagesEdit,
		config.RelayModeImagesVariations:   &pc.ImagesVariations,
	}

	for key, value := range customMapping {
		keyInt := utils.String2Int(key)
		customValue, isString := value.(string)
		if !isString || customValue == "" {
			continue
		}

		if _, exists := relayModeMap[keyInt]; !exists {
			continue
		}

		value := customValue
		if value == "disable" {
			value = ""
		}

		*relayModeMap[keyInt] = value

	}
}

type BaseProvider struct {
	OriginalModel string
	Usage         *types.Usage
	Config        ProviderConfig
	Context       *gin.Context
	Channel       *model.Channel
	Requester     *requester.HTTPRequester
}

// 获取基础URL
func (p *BaseProvider) GetBaseURL() string {
	if p.Channel.GetBaseURL() != "" {
		return p.Channel.GetBaseURL()
	}

	return p.Config.BaseURL
}

// 获取完整请求URL
func (p *BaseProvider) GetFullRequestURL(requestURL string, _ string) string {
	baseURL := strings.TrimSuffix(p.GetBaseURL(), "/")

	return fmt.Sprintf("%s%s", baseURL, requestURL)
}

// 获取请求头
func (p *BaseProvider) CommonRequestHeaders(headers map[string]string) {
	if p.Context != nil {
		headers["Content-Type"] = p.Context.Request.Header.Get("Content-Type")
		headers["Accept"] = p.Context.Request.Header.Get("Accept")
	}

	if headers["Content-Type"] == "" {
		headers["Content-Type"] = "application/json"
	}
	// 自定义header
	if p.Channel.ModelHeaders != nil {
		var customHeaders map[string]string
		err := json.Unmarshal([]byte(*p.Channel.ModelHeaders), &customHeaders)
		if err == nil {
			for key, value := range customHeaders {
				headers[key] = value
			}
		}
	}
}

func (p *BaseProvider) GetUsage() *types.Usage {
	return p.Usage
}

func (p *BaseProvider) SetUsage(usage *types.Usage) {
	p.Usage = usage
}

func (p *BaseProvider) SetContext(c *gin.Context) {
	p.Context = c
}

func (p *BaseProvider) SetOriginalModel(ModelName string) {
	p.OriginalModel = ModelName
}

func (p *BaseProvider) GetOriginalModel() string {
	return p.OriginalModel
}

func (p *BaseProvider) GetChannel() *model.Channel {
	return p.Channel
}

func (p *BaseProvider) ModelMappingHandler(modelName string) (string, error) {
	p.OriginalModel = modelName

	modelMapping := p.Channel.GetModelMapping()

	if modelMapping == "" || modelMapping == "{}" {
		return modelName, nil
	}

	modelMap := make(map[string]string)
	err := json.Unmarshal([]byte(modelMapping), &modelMap)
	if err != nil {
		return "", err
	}

	if modelMap[modelName] != "" {
		return modelMap[modelName], nil
	}

	return modelName, nil
}

func (p *BaseProvider) GetAPIUri(relayMode int) string {
	switch relayMode {
	case config.RelayModeChatCompletions:
		return p.Config.ChatCompletions
	case config.RelayModeCompletions:
		return p.Config.Completions
	case config.RelayModeEmbeddings:
		return p.Config.Embeddings
	case config.RelayModeAudioSpeech:
		return p.Config.AudioSpeech
	case config.RelayModeAudioTranscription:
		return p.Config.AudioTranscriptions
	case config.RelayModeAudioTranslation:
		return p.Config.AudioTranslations
	case config.RelayModeModerations:
		return p.Config.Moderation
	case config.RelayModeImagesGenerations:
		return p.Config.ImagesGenerations
	case config.RelayModeImagesEdits:
		return p.Config.ImagesEdit
	case config.RelayModeImagesVariations:
		return p.Config.ImagesVariations
	case config.RelayModeRerank:
		return p.Config.Rerank
	case config.RelayModeChatRealtime:
		return p.Config.ChatRealtime
	default:
		return ""
	}
}

func (p *BaseProvider) GetSupportedAPIUri(relayMode int) (url string, err *types.OpenAIErrorWithStatusCode) {
	url = p.GetAPIUri(relayMode)
	if url == "" {
		err = common.StringErrorWrapperLocal("The API interface is not supported", "unsupported_api", http.StatusNotImplemented)
		return
	}

	return
}

func (p *BaseProvider) GetRequester() *requester.HTTPRequester {
	return p.Requester
}
