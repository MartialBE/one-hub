package search

import (
	"one-api/common/logger"
	"one-api/common/search/channel"
	"one-api/common/search/search_type"

	"github.com/spf13/viper"
)

type Searcher interface {
	Query(query string) (*search_type.SearchResponses, error)
	Name() string
}

func InitSearcher() {
	InitSearxng()
	InitTavily()
}

func InitSearxng() {
	searxngUrl := viper.GetString("search.searxng.url")
	if searxngUrl == "" {
		logger.SysLog("searxng url is empty")
		return
	}

	searxng := channel.NewSearxng(searxngUrl)
	AddSearchers(searxng)
}

func InitTavily() {
	tavilyKey := viper.GetString("search.tavily.key")
	if tavilyKey == "" {
		logger.SysLog("tavily key is empty")
		return
	}

	tavily := channel.NewTavily(tavilyKey)
	AddSearchers(tavily)
}
