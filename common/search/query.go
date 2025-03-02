package search

import (
	"errors"
	"one-api/common/search/search_type"
)

func (s *Search) query(query string) (*search_type.SearchResponses, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, searcher := range s.searchers {
		if searcher == nil {
			continue
		}
		responses, err := searcher.Query(query)
		if err == nil {
			return responses, nil
		}
	}

	return nil, errors.New("no searcher found")
}

func Query(query string) (*search_type.SearchResponses, error) {
	return searchChannels.query(query)
}

func IsEnable() bool {
	return searchChannels.IsEnable()
}
