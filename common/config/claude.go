package config

import (
	"encoding/json"
)

type ClaudeSettings struct {
	DefaultMaxTokens       map[string]int
	BudgetTokensPercentage float64
}

var ClaudeSettingsInstance = ClaudeSettings{
	DefaultMaxTokens: map[string]int{
		"default": 8192,
	},
	BudgetTokensPercentage: 0.8,
}

func init() {
	GlobalOption.RegisterFloat("ClaudeBudgetTokensPercentage", &ClaudeSettingsInstance.BudgetTokensPercentage)

	GlobalOption.RegisterCustom("ClaudeDefaultMaxTokens", func() string {
		return ClaudeSettingsInstance.GetDefaultMaxTokensJSONString()
	}, func(value string) error {
		ClaudeSettingsInstance.SetDefaultMaxTokens(value)
		return nil
	}, "")
}

func (c *ClaudeSettings) SetDefaultMaxTokens(data string) {
	if data == "" {
		c.DefaultMaxTokens = map[string]int{
			"default": 8192,
		}
		return
	}

	var maxTokens map[string]int
	err := json.Unmarshal([]byte(data), &maxTokens)
	if err != nil {
		return
	}
	c.DefaultMaxTokens = maxTokens
}

func (c *ClaudeSettings) GetDefaultMaxTokens(model string) int {
	if maxTokens, ok := c.DefaultMaxTokens[model]; ok {
		return maxTokens
	}
	return c.DefaultMaxTokens["default"]
}

func (c *ClaudeSettings) GetBudgetTokensPercentage() float64 {
	return c.BudgetTokensPercentage
}

func (c *ClaudeSettings) GetDefaultMaxTokensJSONString() string {
	str, err := json.Marshal(c.DefaultMaxTokens)
	if err != nil {
		return ""
	}
	return string(str)
}
