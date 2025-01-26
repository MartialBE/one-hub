package model

import (
	"one-api/common/config"
	"one-api/common/logger"
	"sync"
)

var UnknownOwnedBy = "未知"

const ModelOwnedByReserveID = 1000

type ModelOwnedBy struct {
	Id   int    `json:"id" gorm:"index"`
	Name string `json:"name" gorm:"type:varchar(100)"`
	Icon string `json:"icon" gorm:"type:text"`
}

func (m *ModelOwnedBy) TableName() string {
	return "model_owned_by"
}

func CreateModelOwnedBy(modelOwnedBy *ModelOwnedBy) error {
	err := DB.Create(modelOwnedBy).Error
	if err != nil {
		return err
	}

	ModelOwnedBysInstance.Load()

	return nil
}

func UpdateModelOwnedBy(modelOwnedBy *ModelOwnedBy) error {
	err := DB.Omit("id").Save(modelOwnedBy).Error
	if err != nil {
		return err
	}

	ModelOwnedBysInstance.Load()

	return nil
}

func GetModelOwnedBy(id int) (*ModelOwnedBy, error) {
	modelOwnedBy := &ModelOwnedBy{}
	err := DB.Where("id = ?", id).First(modelOwnedBy).Error
	if err != nil {
		return nil, err
	}
	return modelOwnedBy, nil
}

func GetAllModelOwnedBy() ([]*ModelOwnedBy, error) {
	var modelOwnedBies []*ModelOwnedBy
	err := DB.Find(&modelOwnedBies).Error
	if err != nil {
		return nil, err
	}
	return modelOwnedBies, nil
}

func DeleteModelOwnedBy(id int) error {
	err := DB.Delete(&ModelOwnedBy{}, id).Error
	if err != nil {
		return err
	}

	ModelOwnedBysInstance.Load()

	return nil
}

type ModelOwnedBys struct {
	sync.RWMutex
	ModelOwnedBy map[int]*ModelOwnedBy
}

var ModelOwnedBysInstance *ModelOwnedBys

func NewModelOwnedBys() {
	ModelOwnedBysInstance = &ModelOwnedBys{}
	err := ModelOwnedBysInstance.Load()
	if err != nil {
		logger.SysError("Failed to initialize ModelOwnedBys:" + err.Error())
		return
	}

	logger.SysLog("Checking for ModelOwned updates")
	modelOwnedBies := GetDefaultModelOwnedBy()
	ModelOwnedBysInstance.SyncModelOwnedBy(modelOwnedBies)
	logger.SysLog("ModelOwnedBys initialized")
}

func (m *ModelOwnedBys) Load() error {
	modelOwnedBies, err := GetAllModelOwnedBy()
	if err != nil {
		return err
	}

	newModelOwnedBy := make(map[int]*ModelOwnedBy)
	for _, modelOwnedBy := range modelOwnedBies {
		newModelOwnedBy[modelOwnedBy.Id] = modelOwnedBy
	}

	m.Lock()
	defer m.Unlock()

	m.ModelOwnedBy = newModelOwnedBy

	return nil
}

func (m *ModelOwnedBys) Get(id int) *ModelOwnedBy {
	m.RLock()
	defer m.RUnlock()

	return m.ModelOwnedBy[id]
}

func (m *ModelOwnedBys) GetName(id int) string {
	modelOwnedBy := m.Get(id)
	if modelOwnedBy == nil {
		return UnknownOwnedBy
	}
	return modelOwnedBy.Name
}

func (m *ModelOwnedBys) GetIcon(id int) string {
	modelOwnedBy := m.Get(id)
	if modelOwnedBy == nil {
		return ""
	}
	return modelOwnedBy.Icon
}

func (m *ModelOwnedBys) GetAll() map[int]*ModelOwnedBy {
	m.RLock()
	defer m.RUnlock()

	return m.ModelOwnedBy
}

func (m *ModelOwnedBys) SyncModelOwnedBy(modelOwnedBies []*ModelOwnedBy) {
	var newModelOwnedBy []*ModelOwnedBy

	for _, modelOwnedBy := range modelOwnedBies {
		if _, ok := m.ModelOwnedBy[modelOwnedBy.Id]; !ok {
			newModelOwnedBy = append(newModelOwnedBy, modelOwnedBy)
		}
	}

	if len(newModelOwnedBy) == 0 {
		return
	}

	err := DB.CreateInBatches(newModelOwnedBy, 100).Error
	if err != nil {
		logger.SysError("Failed to sync ModelOwnedBy:" + err.Error())
		return
	}

	m.Load()
}

func GetDefaultModelOwnedBy() []*ModelOwnedBy {
	return []*ModelOwnedBy{
		{Id: config.ChannelTypeOpenAI, Name: "OpenAI", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openai.svg"},
		{Id: config.ChannelTypePaLM, Name: "Google PaLM", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/gemini-color.svg"},
		{Id: config.ChannelTypeAnthropic, Name: "Anthropic", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/claude-color.svg"},
		{Id: config.ChannelTypeBaidu, Name: "Baidu", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/wenxin-color.svg"},
		{Id: config.ChannelTypeZhipu, Name: "Zhipu", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/zhipu-color.svg"},
		{Id: config.ChannelTypeAli, Name: "Qwen", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/qwen-color.svg"},
		{Id: config.ChannelTypeXunfei, Name: "Spark", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/spark-color.svg"},
		{Id: config.ChannelType360, Name: "360", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/ai360-color.svg"},
		{Id: config.ChannelTypeTencent, Name: "Tencent", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/hunyuan-color.svg"},
		{Id: config.ChannelTypeGemini, Name: "Google Gemini", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/gemini-color.svg"},
		{Id: config.ChannelTypeBaichuan, Name: "Baichuan", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/baichuan-color.svg"},
		{Id: config.ChannelTypeMiniMax, Name: "MiniMax", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/minimax-color.svg"},
		{Id: config.ChannelTypeDeepseek, Name: "Deepseek", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/deepseek-color.svg"},
		{Id: config.ChannelTypeMoonshot, Name: "Moonshot", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/moonshot.svg"},
		{Id: config.ChannelTypeMistral, Name: "Mistral", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/mistral-color.svg"},
		{Id: config.ChannelTypeGroq, Name: "Groq", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/groq.svg"},
		{Id: config.ChannelTypeLingyi, Name: "Yi", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/yi-color.svg"},
		{Id: config.ChannelTypeMidjourney, Name: "Midjourney", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/midjourney.svg"},
		{Id: config.ChannelTypeCloudflareAI, Name: "Cloudflare AI", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/cloudflare-color.svg"},
		{Id: config.ChannelTypeCohere, Name: "Cohere", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/cohere-color.svg"},
		{Id: config.ChannelTypeStabilityAI, Name: "Stability AI", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/stability-color.svg"},
		{Id: config.ChannelTypeCoze, Name: "Coze", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/coze.svg"},
		{Id: config.ChannelTypeOllama, Name: "Ollama", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/ollama.svg"},
		{Id: config.ChannelTypeHunyuan, Name: "Hunyuan", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/hunyuan-color.svg"},
		{Id: config.ChannelTypeSuno, Name: "Suno", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/suno.svg"},
		{Id: config.ChannelTypeLLAMA, Name: "Meta", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/meta-color.svg"},
		{Id: config.ChannelTypeIdeogram, Name: "Ideogram", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/ideogram.svg"},
		{Id: config.ChannelTypeSiliconflow, Name: "Siliconflow", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/siliconcloud-color.svg"},
		{Id: config.ChannelTypeFlux, Name: "Flux", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/flux.svg"},
		{Id: config.ChannelTypeJina, Name: "Jina", Icon: ""},
		{Id: config.ChannelTypeRerank, Name: "Rerank", Icon: ""},
		{Id: config.ChannelTypeRecraft, Name: "RecraftAI", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/recraft.svg"},
		{Id: config.ChannelTypeKling, Name: "Kling", Icon: "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/kling-color.svg"},
	}
}
