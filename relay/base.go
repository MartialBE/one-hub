package relay

import (
	"one-api/types"
	"strings"
	"time"

	providersBase "one-api/providers/base"

	"github.com/gin-gonic/gin"
)

type relayBase struct {
	c             *gin.Context
	provider      providersBase.ProviderInterface
	originalModel string
	modelName     string
	otherArg      string

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
	HandleError(err *types.OpenAIErrorWithStatusCode)
	GetFirstResponseTime() time.Time
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

func (r *relayBase) HandleError(err *types.OpenAIErrorWithStatusCode) {
	newErr := FilterOpenAIErr(r.c, err)
	relayResponseWithOpenAIErr(r.c, &newErr)
}
