package azure

import "one-api/types"

type ImageAzureResponse struct {
	ID      string              `json:"id,omitempty"`
	Created int64               `json:"created,omitempty"`
	Expires int64               `json:"expires,omitempty"`
	Result  types.ImageResponse `json:"result,omitempty"`
	Status  string              `json:"status,omitempty"`
	Error   ImageAzureError     `json:"error,omitempty"`
	Header  map[string]string   `json:"header,omitempty"`
	Proxy   string              `json:"proxy,omitempty"`
}

type ImageAzureError struct {
	Code       string   `json:"code,omitempty"`
	Target     string   `json:"target,omitempty"`
	Message    string   `json:"message,omitempty"`
	Details    []string `json:"details,omitempty"`
	InnerError any      `json:"innererror,omitempty"`
}

type ModelListResponse struct {
	Object string         `json:"object"`
	Data   []ModelDetails `json:"data"`
}

type ModelDetails struct {
	ScaleSettings ScaleSettings `json:"scale_settings"` // 修改为单个对象
	Model         string        `json:"model"`
	Owner         string        `json:"owner"`
	Id            string        `json:"id"`
	Status        string        `json:"status"`
	CreatedAt     int64         `json:"created_at"`
	UpdatedAt     int64         `json:"updated_at"`
	Object        string        `json:"object"`
}

type ScaleSettings struct {
	ScaleType string `json:"scale_type"`
}
