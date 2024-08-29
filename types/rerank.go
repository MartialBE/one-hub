package types

import "encoding/json"

type RerankRequest struct {
	Model     string   `json:"model" binding:"required"`
	Query     string   `json:"query" binding:"required"`
	TopN      int      `json:"top_n"`
	Documents []string `json:"documents" binding:"required"`
}

type RerankResponse struct {
	Model   string         `json:"model"`
	Usage   *Usage         `json:"usage"`
	Results []RerankResult `json:"results"`
}

type RerankResult struct {
	Index          int                  `json:"index"`
	Document       RerankResultDocument `json:"document"`
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
