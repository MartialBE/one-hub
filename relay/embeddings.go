package relay

import (
	"net/http"
	"one-api/common"
	"one-api/common/config"
	providersBase "one-api/providers/base"
	"one-api/safty"
	"one-api/types"
	"strings"

	"github.com/gin-gonic/gin"
)

type relayEmbeddings struct {
	relayBase
	request types.EmbeddingRequest
}

func NewRelayEmbeddings(c *gin.Context) *relayEmbeddings {
	relay := &relayEmbeddings{}
	relay.c = c
	return relay
}

func (r *relayEmbeddings) setRequest() error {
	if strings.HasSuffix(r.c.Request.URL.Path, "embeddings") {
		r.request.Model = r.c.Param("model")
	}

	if err := common.UnmarshalBodyReusable(r.c, &r.request); err != nil {
		return err
	}

	r.setOriginalModel(r.request.Model)

	return nil
}

func (r *relayEmbeddings) getPromptTokens() (int, error) {
	return common.CountTokenInput(r.request.Input, r.modelName), nil
}

func (r *relayEmbeddings) send() (err *types.OpenAIErrorWithStatusCode, done bool) {
	provider, ok := r.provider.(providersBase.EmbeddingsInterface)
	if !ok {
		err = common.StringErrorWrapperLocal("channel not implemented", "channel_error", http.StatusServiceUnavailable)
		done = true
		return
	}

	// 内容审查
	if config.EnableSafe {
		if r.request.Input != nil {
			CheckResult, _ := safty.CheckContent(r.request)
			if !CheckResult.IsSafe {
				err = common.StringErrorWrapperLocal(CheckResult.Reason, CheckResult.Code, http.StatusBadRequest)
				done = true
				return
			}
		}
	}

	r.request.Model = r.modelName

	response, err := provider.CreateEmbeddings(&r.request)
	if err != nil {
		return
	}
	err = responseJsonClient(r.c, response)

	if err != nil {
		done = true
	}

	return
}
