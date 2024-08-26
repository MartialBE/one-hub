package providers

import (
	"one-api/common/config"
	"one-api/model"
	"one-api/providers/ali"
	"one-api/providers/azure"
	azurespeech "one-api/providers/azureSpeech"
	"one-api/providers/baichuan"
	"one-api/providers/baidu"
	"one-api/providers/base"
	"one-api/providers/bedrock"
	"one-api/providers/claude"
	"one-api/providers/cloudflareAI"
	"one-api/providers/cohere"
	"one-api/providers/coze"
	"one-api/providers/deepseek"
	"one-api/providers/gemini"
	"one-api/providers/groq"
	"one-api/providers/hunyuan"
	"one-api/providers/jina"
	"one-api/providers/lingyi"
	"one-api/providers/midjourney"
	"one-api/providers/minimax"
	"one-api/providers/mistral"
	"one-api/providers/moonshot"
	"one-api/providers/ollama"
	"one-api/providers/openai"
	"one-api/providers/palm"
	"one-api/providers/siliconflow"
	"one-api/providers/stabilityAI"
	"one-api/providers/suno"
	"one-api/providers/tencent"
	"one-api/providers/vertexai"
	"one-api/providers/xunfei"
	"one-api/providers/zhipu"

	"github.com/gin-gonic/gin"
)

// 定义供应商工厂接口
type ProviderFactory interface {
	Create(Channel *model.Channel) base.ProviderInterface
}

// 创建全局的供应商工厂映射
var providerFactories = make(map[int]ProviderFactory)

// 在程序启动时，添加所有的供应商工厂
func init() {
	providerFactories = map[int]ProviderFactory{
		config.ChannelTypeOpenAI:       openai.OpenAIProviderFactory{},
		config.ChannelTypeAzure:        azure.AzureProviderFactory{},
		config.ChannelTypeAli:          ali.AliProviderFactory{},
		config.ChannelTypeTencent:      tencent.TencentProviderFactory{},
		config.ChannelTypeBaidu:        baidu.BaiduProviderFactory{},
		config.ChannelTypeAnthropic:    claude.ClaudeProviderFactory{},
		config.ChannelTypePaLM:         palm.PalmProviderFactory{},
		config.ChannelTypeZhipu:        zhipu.ZhipuProviderFactory{},
		config.ChannelTypeXunfei:       xunfei.XunfeiProviderFactory{},
		config.ChannelTypeAzureSpeech:  azurespeech.AzureSpeechProviderFactory{},
		config.ChannelTypeGemini:       gemini.GeminiProviderFactory{},
		config.ChannelTypeBaichuan:     baichuan.BaichuanProviderFactory{},
		config.ChannelTypeMiniMax:      minimax.MiniMaxProviderFactory{},
		config.ChannelTypeDeepseek:     deepseek.DeepseekProviderFactory{},
		config.ChannelTypeMistral:      mistral.MistralProviderFactory{},
		config.ChannelTypeGroq:         groq.GroqProviderFactory{},
		config.ChannelTypeBedrock:      bedrock.BedrockProviderFactory{},
		config.ChannelTypeMidjourney:   midjourney.MidjourneyProviderFactory{},
		config.ChannelTypeCloudflareAI: cloudflareAI.CloudflareAIProviderFactory{},
		config.ChannelTypeCohere:       cohere.CohereProviderFactory{},
		config.ChannelTypeStabilityAI:  stabilityAI.StabilityAIProviderFactory{},
		config.ChannelTypeCoze:         coze.CozeProviderFactory{},
		config.ChannelTypeOllama:       ollama.OllamaProviderFactory{},
		config.ChannelTypeMoonshot:     moonshot.MoonshotProviderFactory{},
		config.ChannelTypeLingyi:       lingyi.LingyiProviderFactory{},
		config.ChannelTypeHunyuan:      hunyuan.HunyuanProviderFactory{},
		config.ChannelTypeSuno:         suno.SunoProviderFactory{},
		config.ChannelTypeVertexAI:     vertexai.VertexAIProviderFactory{},
		config.ChannelTypeSiliconflow:  siliconflow.SiliconflowProviderFactory{},
		config.ChannelTypeJina:         jina.JinaProviderFactory{},
	}
}

// 获取供应商
func GetProvider(channel *model.Channel, c *gin.Context) base.ProviderInterface {
	factory, ok := providerFactories[channel.Type]
	var provider base.ProviderInterface
	if !ok {
		// 处理未找到的供应商工厂
		baseURL := config.ChannelBaseURLs[channel.Type]
		if channel.GetBaseURL() != "" {
			baseURL = channel.GetBaseURL()
		}
		if baseURL == "" {
			return nil
		}

		provider = openai.CreateOpenAIProvider(channel, baseURL)
	} else {
		provider = factory.Create(channel)
	}
	provider.SetContext(c)

	return provider
}
