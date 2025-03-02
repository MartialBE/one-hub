package channel

import (
	"net/http"
	"net/url"
	"one-api/common/requester"
	"one-api/common/search/search_type"
	"strings"
)

type SearxngResponse struct {
	Query           string          `json:"query"`
	NumberOfResults int             `json:"number_of_results"`
	Results         []SearxngResult `json:"results"`
}

type SearxngResult struct {
	Url     string `json:"url"`
	Title   string `json:"title"`
	Content string `json:"content"`
}

type Searxng struct {
	Url string
}

func NewSearxng(url string) *Searxng {
	return &Searxng{
		Url: url,
	}
}

func (s *Searxng) Name() string {
	return "searxng"
}

func (s *Searxng) Query(query string) (*search_type.SearchResponses, error) {
	queryUrl := url.QueryEscape(query)
	queryUrl = strings.Replace(s.Url, "{query}", queryUrl, 1)

	client := requester.NewHTTPRequester("", nil)
	client.IsOpenAI = false

	req, err := client.NewRequest(http.MethodGet, queryUrl, client.WithHeader(requester.GetJsonHeaders()))
	if err != nil {
		return nil, err
	}

	var resp SearxngResponse
	_, opErr := client.SendRequest(req, &resp, true)
	if opErr != nil {
		return nil, opErr
	}

	responses := &search_type.SearchResponses{}
	for _, result := range resp.Results {
		responses.Results = append(responses.Results, search_type.SearchResult{
			Title:   result.Title,
			Content: result.Content,
			Url:     result.Url,
		})
	}

	return responses, nil
}
