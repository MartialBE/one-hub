package channel

import (
	"encoding/json"
	"fmt"
	"net/http"
	"one-api/common/requester"
	"one-api/common/search/search_type"
	"one-api/types"
)

const uri = "https://api.tavily.com/search"

type TavilyRequest struct {
	Query string `json:"query"`
	// Topic                    string   `json:"topic,omitempty"`
	// SearchDepth              string   `json:"search_depth,omitempty"`
	// MaxResults               int      `json:"max_results,omitempty"`
	// TimeRange                string   `json:"time_range,omitempty"`
	// Days                     int      `json:"days,omitempty"`
	// IncludeAnswers           bool     `json:"include_answers,omitempty"`
	// IncludeRawContent        bool     `json:"include_raw_content,omitempty"`
	// IncludeImages            bool     `json:"include_images,omitempty"`
	// IncludeDomains           []string `json:"include_domains,omitempty"`
	// ExcludeDomains           []string `json:"exclude_domains,omitempty"`
}

type TavilyResponse struct {
	Query   string          `json:"query"`
	Answer  string          `json:"answer,omitempty"`
	Images  []*TavilyImages `json:"images,omitempty"`
	Results []*TavilyResult `json:"results"`
}

type TavilyImages struct {
	URL         string `json:"url"`
	Description string `json:"description"`
}

type TavilyResult struct {
	Title      string `json:"title"`
	URL        string `json:"url"`
	Content    string `json:"content"`
	RawContent string `json:"raw_content,omitempty"`
}

type TavilyErr struct {
	Detail struct {
		Error string `json:"error"`
	} `json:"detail"`
}

type Tavily struct {
	apiKey string
}

func NewTavily(apiKey string) *Tavily {
	return &Tavily{
		apiKey: apiKey,
	}
}

func (t *Tavily) Name() string {
	return "Tavily"
}

func (t *Tavily) Query(query string) (*search_type.SearchResponses, error) {
	request := &TavilyRequest{
		Query: query,
	}

	client := requester.NewHTTPRequester("", tavilyErrFunc)
	client.IsOpenAI = false

	headers := requester.GetJsonHeaders()
	headers["Authorization"] = fmt.Sprintf("Bearer %s", t.apiKey)

	req, err := client.NewRequest(http.MethodPost, uri, client.WithHeader(headers), client.WithBody(request))
	if err != nil {
		return nil, err
	}

	var resp TavilyResponse
	_, opErr := client.SendRequest(req, &resp, true)
	if opErr != nil {
		return nil, opErr
	}

	responses := &search_type.SearchResponses{}
	for _, result := range resp.Results {
		responses.Results = append(responses.Results, search_type.SearchResult{
			Title:   result.Title,
			Content: result.Content,
			Url:     result.URL,
		})
	}

	return responses, nil
}

func tavilyErrFunc(resp *http.Response) *types.OpenAIError {
	respMsg := &TavilyErr{}

	err := json.NewDecoder(resp.Body).Decode(respMsg)
	if err != nil {
		return nil
	}

	if respMsg.Detail.Error == "" {
		return nil
	}

	return &types.OpenAIError{
		Message: fmt.Sprintf("query tavily err. err msg: %s", respMsg.Detail.Error),
		Type:    "tavily_error",
	}
}
