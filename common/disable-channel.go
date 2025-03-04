package common

import (
	"one-api/common/logger"
	"strings"
	"sync"

	goahocorasick "github.com/anknown/ahocorasick"
)

type DisableChannelKeyword struct {
	AcMachines *goahocorasick.Machine
	mutex      sync.RWMutex
}

var DisableChannelKeywordsInstance *DisableChannelKeyword

func init() {
	DisableChannelKeywordsInstance = &DisableChannelKeyword{
		AcMachines: &goahocorasick.Machine{},
	}
}

func GetDefaultDisableChannelKeywords() string {
	return `Your credit balance is too low
This organization has been disabled.
You exceeded your current quota
Permission denied
Quota exceeded for quota metric
API key not valid
The security token included in the request is invalid
Operation not allowed
Your account is not authorized
your account balance is insufficient
Your account is currently blocked
too many invalid requests`
}

func (d *DisableChannelKeyword) Load(keywords string) {
	if keywords == "" {
		return
	}

	keywordsList := strings.Split(keywords, "\n")
	patterns := make([][]rune, 0, len(keywordsList))

	for _, keyword := range keywordsList {
		if keyword == "" {
			continue
		}

		keyword = strings.TrimSpace(keyword)
		patterns = append(patterns, []rune(keyword))
	}
	d.mutex.Lock()
	defer d.mutex.Unlock()

	if len(patterns) > 0 {
		machine := new(goahocorasick.Machine)
		if err := machine.Build(patterns); err == nil {
			d.AcMachines = machine
		} else {
			logger.SysError("failed to build Aho-Corasick machine: " + err.Error())
		}
	}
}

func (d *DisableChannelKeyword) IsContains(message string) bool {
	d.mutex.RLock()
	defer d.mutex.RUnlock()

	// 将消息转换为 rune 数组
	messageRunes := []rune(message)

	matches := d.AcMachines.MultiPatternSearch(messageRunes, false)

	return len(matches) > 0
}
