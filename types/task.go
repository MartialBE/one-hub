package types

import "gorm.io/datatypes"

type TaskResponse[T any] struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Data    *T     `json:"data,omitempty"`
}

const TaskSuccessCode = "success"

func (t *TaskResponse[T]) IsSuccess() bool {
	return t.Code == TaskSuccessCode
}

type TaskDto struct {
	TaskID     string         `json:"task_id"` // 第三方id，不一定有/ song id\ Task id
	Action     string         `json:"action"`  // 任务类型, song, lyrics, description-mode
	Status     string         `json:"status"`  // 任务状态, submitted, queueing, processing, success, failed
	FailReason string         `json:"fail_reason"`
	SubmitTime int64          `json:"submit_time"`
	StartTime  int64          `json:"start_time"`
	FinishTime int64          `json:"finish_time"`
	Progress   string         `json:"progress"`
	Data       datatypes.JSON `json:"data"`
}
