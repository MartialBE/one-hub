package siliconflow

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
