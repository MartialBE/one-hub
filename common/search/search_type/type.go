package search_type

import "fmt"

type SearchResponses struct {
	Results []SearchResult
}

type SearchResult struct {
	Title   string
	Content string
	Url     string
}

func (s *SearchResponses) ToString() string {
	var result string
	for index, r := range s.Results {
		webpageIndex := index + 1
		result += fmt.Sprintf("[webpage %d begin]\nTitle: %s\nContent: %s\nUrl: %s\n[webpage %d end]\n", webpageIndex, r.Title, r.Content, r.Url, webpageIndex)
	}
	return result
}
