package search

import "sync"

var searchChannels = New()

type Search struct {
	searchers map[string]Searcher
	enable    bool
	mu        sync.RWMutex
}

func (s *Search) addSearcher(searcher Searcher) {
	if searcher != nil {
		s.mu.Lock()
		defer s.mu.Unlock()
		searcherName := searcher.Name()
		s.searchers[searcherName] = searcher
		s.enable = true
	}
}

func (s *Search) addSearchers(searcher ...Searcher) {
	for _, r := range searcher {
		s.addSearcher(r)
	}
}

func (s *Search) IsEnable() bool {
	return s.enable
}

func New() *Search {
	return &Search{
		searchers: make(map[string]Searcher),
		enable:    false,
	}
}

func AddSearchers(searcher ...Searcher) {
	searchChannels.addSearchers(searcher...)
}
