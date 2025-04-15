package relay

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
	"one-api/common"
	"one-api/common/config"
	"one-api/common/requester"
	"one-api/common/utils"
	providersBase "one-api/providers/base"
	"one-api/safty"
	"one-api/types"
	"time"

	"github.com/gin-gonic/gin"
)

type relayCompletions struct {
	relayBase
	request types.CompletionRequest
}

func NewRelayCompletions(c *gin.Context) *relayCompletions {
	relay := &relayCompletions{}
	relay.c = c
	return relay
}

func (r *relayCompletions) setRequest() error {
	if err := common.UnmarshalBodyReusable(r.c, &r.request); err != nil {
		return err
	}

	if r.request.MaxTokens < 0 || r.request.MaxTokens > math.MaxInt32/2 {
		return errors.New("max_tokens is invalid")
	}

	if !r.request.Stream && r.request.StreamOptions != nil {
		return errors.New("the 'stream_options' parameter is only allowed when 'stream' is enabled")
	}

	r.setOriginalModel(r.request.Model)

	return nil
}

func (r *relayCompletions) IsStream() bool {
	return r.request.Stream
}

func (r *relayCompletions) getRequest() interface{} {
	return &r.request
}

func (r *relayCompletions) getPromptTokens() (int, error) {
	return common.CountTokenInput(r.request.Prompt, r.modelName), nil
}

func (r *relayCompletions) send() (err *types.OpenAIErrorWithStatusCode, done bool) {
	provider, ok := r.provider.(providersBase.CompletionInterface)
	if !ok {
		err = common.StringErrorWrapperLocal("channel not implemented", "channel_error", http.StatusServiceUnavailable)
		done = true
		return
	}

	r.request.Model = r.modelName

	// 内容审查
	if config.EnableSafe {
		if r.request.Prompt != nil {
			CheckResult, _ := safty.CheckContent(r.request.Prompt)
			if !CheckResult.IsSafe {
				err = common.StringErrorWrapperLocal(CheckResult.Reason, CheckResult.Code, http.StatusBadRequest)
				done = true
				return
			}
		}
	}

	if r.request.Stream {
		var response requester.StreamReaderInterface[string]
		response, err = provider.CreateCompletionStream(&r.request)
		if err != nil {
			return
		}

		doneStr := func() string {
			return r.getUsageResponse()
		}

		var firstResponseTime time.Time
		firstResponseTime, err = responseStreamClient(r.c, response, doneStr)
		r.SetFirstResponseTime(firstResponseTime)
	} else {
		var response *types.CompletionResponse
		response, err = provider.CreateCompletion(&r.request)
		if err != nil {
			return
		}
		err = responseJsonClient(r.c, response)
	}

	if err != nil {
		done = true
	}

	return
}

func (r *relayCompletions) getUsageResponse() string {
	if r.request.StreamOptions != nil && r.request.StreamOptions.IncludeUsage {
		usageResponse := types.CompletionResponse{
			ID:      fmt.Sprintf("chatcmpl-%s", utils.GetUUID()),
			Object:  "chat.completion.chunk",
			Created: utils.GetTimestamp(),
			Model:   r.request.Model,
			Choices: []types.CompletionChoice{},
			Usage:   r.provider.GetUsage(),
		}

		responseBody, err := json.Marshal(usageResponse)
		if err != nil {
			return ""
		}

		return string(responseBody)
	}

	return ""
}
