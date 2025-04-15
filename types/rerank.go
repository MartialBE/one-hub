package types

import (
	"encoding/json"
	"fmt"
)

type RerankRequest struct {
	Model     string `json:"model" binding:"required"`
	Query     string `json:"query" binding:"required"`
	TopN      int    `json:"top_n"`
	Documents []any  `json:"documents" binding:"required"`
}

func (r *RerankRequest) GetDocumentsList() ([]string, error) {
	documents := make([]string, len(r.Documents))
	for i, doc := range r.Documents {
		str, ok := doc.(string)
		if !ok {
			return nil, fmt.Errorf("document at index %d is not a string", i)
		}
		documents[i] = str
	}
	return documents, nil
}

// type MultimodalDocument struct {
// 	Text  string `json:"text,omitempty"`
// 	Image string `json:"image,omitempty"`
// }

type RerankResponse struct {
	Model   string         `json:"model"`
	Usage   *Usage         `json:"usage"`
	Results []RerankResult `json:"results"`
}

type RerankResult struct {
	Index          int                  `json:"index"`
	Document       RerankResultDocument `json:"document,omitempty"`
	RelevanceScore float64              `json:"relevance_score"`
}

type RerankResultDocument struct {
	Text string `json:"text"`
}

type RerankError struct {
	Detail string `json:"detail"`
}

func (e *RerankError) Error() string {
	// 转换为JSON
	bytes, _ := json.Marshal(e)
	return string(bytes)
}

type RerankErrorWithStatusCode struct {
	RerankError
	StatusCode int  `json:"status_code"`
	LocalError bool `json:"-"`
}
