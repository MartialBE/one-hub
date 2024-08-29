package siliconflow

import "one-api/types"

type ImageGenerations struct {
	Prompt            string  `json:"prompt"`
	ImageSize         string  `json:"image_size"`
	Seed              int64   `json:"seed,omitempty"`
	NumInferenceSteps int64   `json:"num_inference_steps,omitempty"`
	NegativePrompt    string  `json:"negative_prompt,omitempty"`
	BatchSize         int     `json:"batch_size,omitempty"`
	GuidanceScale     float64 `json:"guidance_scale,omitempty"`
}

type ImageRes struct {
	Images  []*ImagesData `json:"images"`
	Timings *ImageImings  `json:"timings,omitempty"`
	Seed    int64         `json:"seed,omitempty"`
}

type ImagesData struct {
	Url string `json:"url"`
}

type ImageImings struct {
	Inference float64 `json:"inference"`
}

type SiliError struct {
	Code    int    `json:"code,omitempty"`
	Message string `json:"message,omitempty"`
}

type RerankRequest struct {
	Model           string   `json:"model"`
	Query           string   `json:"query"`
	TopN            int      `json:"top_n"`
	ReturnDocuments bool     `json:"return_documents"`
	Documents       []string `json:"documents"`
}

type RerankResponse struct {
	Id      string               `json:"id"`
	Results []types.RerankResult `json:"results"`
	Meta    *Meta                `json:"meta,omitempty"`
}

type Meta struct {
	Tokens *Tokens `json:"tokens,omitempty"`
}

type Tokens struct {
	InputTokens  int `json:"input_tokens"`
	OutputTokens int `json:"output_tokens"`
}
