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

func (p *AzureDatabricksProvider) CreateChatCompletion(request *types.ChatCompletionRequest) (*types.ChatCompletionResponse, *types.OpenAIErrorWithStatusCode) {
	req, errWithCode := p.convertRequest(request)
	if errWithCode != nil {
		return nil, errWithCode
	}

	requestURL := p.GetFullRequestURL(request.Model)
	httpResponse, errWithCode := p.doRequest(req, requestURL)
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

	return &databricksChatRequest{
		Messages: messages,
	}, nil
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
	req, errWithCode := p.convertRequest(request)
	if errWithCode != nil {
		return nil, errWithCode
	}

	requestURL := p.GetFullRequestURL(request.Model)
	httpResponse, errWithCode := p.doRequest(req, requestURL)
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
	Messages []types.ChatCompletionMessage `json:"messages"`
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