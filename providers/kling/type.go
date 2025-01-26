package kling

type KlingQueryRequest struct {
	TaskID string `json:"task_id"`
	// ExternalTaskID string `json:"external_task_id,omitempty"`
}

type KlingTask struct {
	Prompt    string `json:"prompt,omitempty"`
	ModelName string `json:"model_name,omitempty"`
	// Model     string `json:"model,omitempty"`
	Mode string `json:"mode,omitempty"`

	// VideoID string `json:"video_id,omitempty"`

	Image        string `json:"image,omitempty"`
	ImageTail    string `json:"image_tail,omitempty"`
	StaticMask   string `json:"static_mask,omitempty"`
	DynamicMasks any    `json:"dynamic_masks,omitempty"`

	NegativePrompt string   `json:"negative_prompt,omitempty"`
	CfgScale       *float64 `json:"cfg_scale,omitempty"`
	CameraControl  any      `json:"camera_control,omitempty"`

	AspectRatio any    `json:"aspect_ratio,omitempty"`
	Duration    string `json:"duration,omitempty"`
	CallbackURL any    `json:"callback_url,omitempty"`
}

// type KlingVideoExtend struct {
// 	VideoID     string `json:"video_id"`
// 	Prompt      string `json:"prompt,omitempty"`
// 	CallbackURL any    `json:"callback_url,omitempty"`
// }

type KlingResponse[T any] struct {
	Code      int    `json:"code"`
	Message   string `json:"message"`
	RequestID string `json:"request_id"`
	Data      T      `json:"data,omitempty"`
}

type KlingTaskData struct {
	TaskID        string           `json:"task_id"`
	TaskStatus    string           `json:"task_status"`
	CreatedAt     int64            `json:"created_at"`
	UpdatedAt     int64            `json:"updated_at"`
	TaskStatusMsg string           `json:"task_status_msg,omitempty"`
	TaskResult    *KlingTaskResult `json:"task_result,omitempty"`
}

type KlingTaskResult struct {
	Videos []KlingVideoResult `json:"videos"`
}

type KlingVideoResult struct {
	ID       string `json:"id"`
	URL      string `json:"url"`
	Duration string `json:"duration"`
}
