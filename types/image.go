package types

import "mime/multipart"

type ImageRequest struct {
	Prompt           string  `json:"prompt,omitempty" binding:"required"`
	Model            string  `json:"model,omitempty"`
	N                int     `json:"n,omitempty"`
	Quality          string  `json:"quality,omitempty"`
	Size             string  `json:"size,omitempty"`
	Style            string  `json:"style,omitempty"`
	ResponseFormat   string  `json:"response_format,omitempty"`
	User             string  `json:"user,omitempty"`
	AspectRatio      *string `json:"aspect_ratio,omitempty"`
	OutputQuality    *int    `json:"output_quality,omitempty"`
	SafetyTolerance  *string `json:"safety_tolerance,omitempty"`
	PromptUpsampling *string `json:"prompt_upsampling,omitempty"`

	Background        *string `json:"background,omitempty"`
	Moderation        *string `json:"moderation,omitempty"`
	OutputCompression *int    `json:"output_compression,omitempty"`
	OutputFormat      *string `json:"output_format,omitempty"`
}

type ImageResponse struct {
	Created any                      `json:"created,omitempty"`
	Data    []ImageResponseDataInner `json:"data,omitempty"`
	Usage   *ResponsesUsage          `json:"usage,omitempty"`
}

type ImageResponseDataInner struct {
	URL           string `json:"url,omitempty"`
	B64JSON       string `json:"b64_json,omitempty"`
	RevisedPrompt string `json:"revised_prompt,omitempty"`
}

type ImageEditRequest struct {
	Image          *multipart.FileHeader   `form:"image"`
	Images         []*multipart.FileHeader `form:"image[]"`
	Mask           *multipart.FileHeader   `form:"mask"`
	Model          string                  `form:"model"`
	Prompt         string                  `form:"prompt"`
	N              int                     `form:"n"`
	Size           string                  `form:"size"`
	ResponseFormat string                  `form:"response_format"`
	User           string                  `form:"user"`
}
