package relay

import (
	"encoding/json"
	"one-api/model"
	"one-api/relay/relay_util"
	"one-api/types"
	"strings"
	"time"

	providersBase "one-api/providers/base"

	"github.com/gin-gonic/gin"
)

type relayBase struct {
	c              *gin.Context
	provider       providersBase.ProviderInterface
	originalModel  string
	modelName      string
	otherArg       string
	allowHeartbeat bool
	heartbeat      *relay_util.Heartbeat

	firstResponseTime time.Time
}

type RelayBaseInterface interface {
	send() (err *types.OpenAIErrorWithStatusCode, done bool)
	getPromptTokens() (int, error)
	setRequest() error
	getRequest() any
	setProvider(modelName string) error
	getProvider() providersBase.ProviderInterface
	getOriginalModel() string
	getModelName() string
	getContext() *gin.Context
	IsStream() bool
	// HandleError(err *types.OpenAIErrorWithStatusCode)
	GetFirstResponseTime() time.Time

	HandleJsonError(err *types.OpenAIErrorWithStatusCode)
	HandleStreamError(err *types.OpenAIErrorWithStatusCode)
	SetHeartbeat(isStream bool) *relay_util.Heartbeat
}

func (r *relayBase) getRequest() interface{} {
	return nil
}

func (r *relayBase) IsStream() bool {
	return false
}

func (r *relayBase) setProvider(modelName string) error {
	provider, modelName, fail := GetProvider(r.c, modelName)
	if fail != nil {
		return fail
	}
	r.provider = provider
	r.modelName = modelName

	r.provider.SetOtherArg(r.otherArg)

	return nil
}

func (r *relayBase) getOtherArg() string {
	return r.otherArg
}

func (r *relayBase) setOriginalModel(modelName string) {
	// 使用#进行分隔模型名称， 将#后面的内容作为otherArg
	parts := strings.Split(modelName, "#")
	if len(parts) > 1 {
		r.otherArg = parts[1]
	}

	r.originalModel = parts[0]
}

func (r *relayBase) getContext() *gin.Context {
	return r.c
}

func (r *relayBase) getProvider() providersBase.ProviderInterface {
	return r.provider
}

func (r *relayBase) getOriginalModel() string {
	return r.originalModel
}

func (r *relayBase) getModelName() string {
	billingOriginalModel := r.c.GetBool("billing_original_model")

	if billingOriginalModel {
		return r.originalModel
	}
	return r.modelName
}

func (r *relayBase) GetFirstResponseTime() time.Time {
	return r.firstResponseTime
}

func (r *relayBase) SetFirstResponseTime(firstResponseTime time.Time) {
	r.firstResponseTime = firstResponseTime
}

func (r *relayBase) GetError(err *types.OpenAIErrorWithStatusCode) (int, any) {
	newErr := FilterOpenAIErr(r.c, err)
	return newErr.StatusCode, types.OpenAIErrorResponse{
		Error: newErr.OpenAIError,
	}
}

func (r *relayBase) HandleJsonError(err *types.OpenAIErrorWithStatusCode) {
	statusCode, response := r.GetError(err)
	r.c.JSON(statusCode, response)
}

func (r *relayBase) HandleStreamError(err *types.OpenAIErrorWithStatusCode) {
	_, response := r.GetError(err)

	str, jsonErr := json.Marshal(response)
	if jsonErr != nil {
		return
	}

	r.c.Writer.Write([]byte("data: " + string(str) + "\n\n"))
	r.c.Writer.Flush()
}

func (r *relayBase) SetHeartbeat(isStream bool) *relay_util.Heartbeat {
	if !r.allowHeartbeat {
		return nil
	}

	setting, exists := r.c.Get("token_setting")
	if !exists {
		return nil
	}

	tokenSetting, ok := setting.(*model.TokenSetting)
	if !ok || !tokenSetting.Heartbeat.Enabled {
		return nil
	}

	r.heartbeat = relay_util.NewHeartbeat(
		isStream,
		relay_util.HeartbeatConfig{
			TimeoutSeconds:  tokenSetting.Heartbeat.TimeoutSeconds,
			IntervalSeconds: 5, // 5s 发送一次心跳
		},
		r.c,
	)
	r.heartbeat.Start()

	return r.heartbeat
}
