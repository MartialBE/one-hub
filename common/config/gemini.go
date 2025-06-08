package config

import "encoding/json"

type GeminiSettings struct {
	OpenThink map[string]bool
}

var GeminiSettingsInstance = GeminiSettings{
	OpenThink: map[string]bool{},
}

func init() {
	GlobalOption.RegisterCustom("GeminiOpenThink", func() string {
		return GeminiSettingsInstance.GetOpenThinkJSONString()
	}, func(value string) error {
		GeminiSettingsInstance.SetOpenThink(value)
		return nil
	}, "")
}

func (c *GeminiSettings) SetOpenThink(data string) {
	if data == "" {
		c.OpenThink = map[string]bool{}
		return
	}

	var openThink map[string]bool
	err := json.Unmarshal([]byte(data), &openThink)
	if err != nil {
		return
	}
	c.OpenThink = openThink
}

func (c *GeminiSettings) GetOpenThink(model string) bool {
	if openThink, ok := c.OpenThink[model]; ok {
		return openThink
	}
	return false
}

func (c *GeminiSettings) GetOpenThinkJSONString() string {
	str, err := json.Marshal(c.OpenThink)
	if err != nil {
		return ""
	}
	return string(str)
}
