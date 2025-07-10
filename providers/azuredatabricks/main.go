package azuredatabricks

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"one-api/common"
	"one-api/common/requester"
	"one-api/model"
	"one-api/providers/base"
	"one-api/types"
)

type AzureDatabricksProviderFactory struct{}

// Create returns an AzureDatabricksProvider
func (f AzureDatabricksProviderFactory) Create(channel *model.Channel) base.ProviderInterface {
	return &AzureDatabricksProvider{
		BaseProvider: base.BaseProvider{
			Channel:   channel,
			Requester: requester.NewHTTPRequester(*channel.Proxy, requestErrorHandle),
		},
	}
}

type AzureDatabricksProvider struct {
	base.BaseProvider
}

func (p *AzureDatabricksProvider) GetRequestHeaders() (headers map[string]string) {
	headers = make(map[string]string)
	// https://learn.microsoft.com/en-us/azure/databricks/dev-tools/api/latest/authentication
	auth := base64.StdEncoding.EncodeToString([]byte("token:" + p.Channel.Key))
	headers["Authorization"] = fmt.Sprintf("Basic %s", auth)
	return headers
}

func (p *AzureDatabricksProvider) GetFullRequestURL(modelName string) string {
	baseURL := strings.TrimSuffix(p.GetBaseURL(), "/")
	return fmt.Sprintf("%s/serving-endpoints/%s/invocations", baseURL, modelName)
}

func (p *AzureDatabricksProvider) prepareRequest(request *types.ChatCompletionRequest) (*http.Response, *types.OpenAIErrorWithStatusCode) {
	req, errWithCode := p.convertRequest(request)
	if errWithCode != nil {
		return nil, errWithCode
	}

	requestURL := p.GetFullRequestURL(request.Model)
	httpResponse, errWithCode := p.doRequest(req, requestURL)
	if errWithCode != nil {
		return nil, errWithCode
	}

	return httpResponse, nil
}

func (p *AzureDatabricksProvider) CreateChatCompletion(request *types.ChatCompletionRequest) (*types.ChatCompletionResponse, *types.OpenAIErrorWithStatusCode) {
	httpResponse, errWithCode := p.prepareRequest(request)
	if errWithCode != nil {
		return nil, errWithCode
	}
	defer httpResponse.Body.Close()

	response, err := p.convertResponse(httpResponse)
	if err != nil {
		return nil, common.ErrorWrapper(err, "convert_response_failed", http.StatusInternalServerError)
	}

	return response, nil
}

func (p *AzureDatabricksProvider) doRequest(request any, requestURL string) (*http.Response, *types.OpenAIErrorWithStatusCode) {
	req, err := p.Requester.NewRequest(http.MethodPost, requestURL,
		p.Requester.WithBody(request),
		p.Requester.WithHeader(p.GetRequestHeaders()),
	)
	if err != nil {
		return nil, common.ErrorWrapper(err, "new_request_failed", http.StatusInternalServerError)
	}
	return p.Requester.SendRequestRaw(req)
}

func (p *AzureDatabricksProvider) convertRequest(request *types.ChatCompletionRequest) (*databricksChatRequest, *types.OpenAIErrorWithStatusCode) {
	messages := make([]types.ChatCompletionMessage, 0)
	for _, msg := range request.Messages {
		messages = append(messages, types.ChatCompletionMessage{
			Role:    msg.Role,
			Content: msg.StringContent(),
		})
	}

	databricksRequest := &databricksChatRequest{
		Messages: messages,
		Stream:   request.Stream,
	}

	if request.MaxTokens != 0 {
		databricksRequest.MaxTokens = request.MaxTokens
	}
	if request.Temperature != nil {
		databricksRequest.Temperature = float64(*request.Temperature)
	}
	if request.TopP != nil {
		databricksRequest.TopP = float64(*request.TopP)
	}
	if request.N != nil {
		databricksRequest.N = *request.N
	}
	if request.Stop != nil {
		if stop, ok := request.Stop.([]string); ok {
			databricksRequest.Stop = stop
		}
	}
	if request.PresencePenalty != nil {
		databricksRequest.PresencePenalty = float64(*request.PresencePenalty)
	}
	if request.FrequencyPenalty != nil {
		databricksRequest.FrequencyPenalty = float64(*request.FrequencyPenalty)
	}

	if request.Reasoning != nil {
		var opErr *types.OpenAIErrorWithStatusCode
		databricksRequest.MaxTokens, databricksRequest.Thinking, opErr = getThinking(databricksRequest.MaxTokens, request.Reasoning)
		if opErr != nil {
			return nil, opErr
		}
	}

	return databricksRequest, nil
}

func getThinking(maxTokens int, reasoning *types.ChatReasoning) (newMaxTokens int, thinking *Thinking, err *types.OpenAIErrorWithStatusCode) {
	newMaxTokens = maxTokens
	thinking = &Thinking{
		Type: "enabled",
	}
	if reasoning == nil || (reasoning.MaxTokens == 0 && reasoning.Effort == "") {
		thinking.BudgetTokens = int(float64(maxTokens) * 0.8)
	} else if reasoning.MaxTokens > 0 {
		if reasoning.MaxTokens > maxTokens {
			err = common.StringErrorWrapper(fmt.Sprintf("budget_token cannot be greater than the max_token, max_token: %d, budget_token: %d", maxTokens, reasoning.MaxTokens), "budget_tokens_too_large", http.StatusBadRequest)
			return
		}
		thinking.BudgetTokens = reasoning.MaxTokens
	} else {
		switch reasoning.Effort {
		case "low":
			thinking.BudgetTokens = int(float64(maxTokens) * 0.2)
		case "medium":
			thinking.BudgetTokens = int(float64(maxTokens) * 0.5)
		default:
			thinking.BudgetTokens = int(float64(maxTokens) * 0.8)
		}
	}
	if thinking.BudgetTokens < 128 {
		thinking.BudgetTokens = 128
	}
	if newMaxTokens <= thinking.BudgetTokens {
		newMaxTokens = thinking.BudgetTokens + 128
	}

	return
}

func (p *AzureDatabricksProvider) convertResponse(resp *http.Response) (response *types.ChatCompletionResponse, err error) {
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var databricksResponse databricksChatResponse
	err = json.Unmarshal(responseBody, &databricksResponse)
	if err != nil {
		return nil, err
	}

	response = &types.ChatCompletionResponse{
		ID:      databricksResponse.ID,
		Object:  "chat.completion",
		Created: databricksResponse.Created,
		Model:   databricksResponse.Model,
		Choices: []types.ChatCompletionChoice{},
	}

	for _, choice := range databricksResponse.Choices {
		response.Choices = append(response.Choices, types.ChatCompletionChoice{
			Index: choice.Index,
			Message: types.ChatCompletionMessage{
				Role:    "assistant",
				Content: choice.Message.Content,
			},
			FinishReason: choice.FinishReason,
		})
	}

	if databricksResponse.Usage != nil {
		response.Usage = &types.Usage{
			PromptTokens:     databricksResponse.Usage.PromptTokens,
			CompletionTokens: databricksResponse.Usage.CompletionTokens,
			TotalTokens:      databricksResponse.Usage.TotalTokens,
		}
	}

	return response, nil
}

func (p *AzureDatabricksProvider) CreateChatCompletionStream(request *types.ChatCompletionRequest) (requester.StreamReaderInterface[string], *types.OpenAIErrorWithStatusCode) {
	httpResponse, errWithCode := p.prepareRequest(request)
	if errWithCode != nil {
		return nil, errWithCode
	}

	stream, err := requester.RequestStream(p.Requester, httpResponse, streamHandler)
	if err != nil {
		return nil, common.ErrorWrapper(err, "request_stream_failed", http.StatusInternalServerError)
	}

	return stream, nil
}

func streamHandler(rawLine *[]byte, dataChan chan string, errChan chan error) {
	if !strings.HasPrefix(string(*rawLine), "data:") {
		*rawLine = nil
		return
	}

	*rawLine = (*rawLine)[5:]
	*rawLine = []byte(strings.TrimSpace(string(*rawLine)))

	if string(*rawLine) == "[DONE]" {
		errChan <- io.EOF
		*rawLine = requester.StreamClosed
		return
	}

	dataChan <- string(*rawLine)
}

func requestErrorHandle(resp *http.Response) *types.OpenAIError {
	var errorResponse types.OpenAIErrorResponse
	err := json.NewDecoder(resp.Body).Decode(&errorResponse)
	if err != nil {
		return nil
	}
	return &errorResponse.Error
}

// databricksChatRequest is the request body for Azure Databricks
type databricksChatRequest struct {
	Messages         []types.ChatCompletionMessage `json:"messages"`
	Stream           bool                          `json:"stream,omitempty"`
	MaxTokens        int                           `json:"max_tokens,omitempty"`
	Temperature      float64                       `json:"temperature,omitempty"`
	TopP             float64                       `json:"top_p,omitempty"`
	N                int                           `json:"n,omitempty"`
	Stop             []string                      `json:"stop,omitempty"`
	PresencePenalty  float64                       `json:"presence_penalty,omitempty"`
	FrequencyPenalty float64                       `json:"frequency_penalty,omitempty"`
	Thinking         *Thinking                     `json:"thinking,omitempty"`
}

type Thinking struct {
	Type         string `json:"type,omitempty"`
	BudgetTokens int    `json:"budget_tokens,omitempty"`
}

// databricksChatResponse is the response body for Azure Databricks
type databricksChatResponse struct {
	ID      string `json:"id"`
	Object  string `json:"object"`
	Created int64  `json:"created"`
	Model   string `json:"model"`
	Choices []struct {
		Index   int `json:"index"`
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
	Usage *struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage,omitempty"`
}
