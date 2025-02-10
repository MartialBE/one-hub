package kling

import (
	"encoding/json"
	"fmt"
	"net/http"
	"one-api/common"
	"one-api/types"

	"gorm.io/datatypes"
)

func (s *KlingProvider) GetFetchs(class, action string, ids []string) (response []*types.TaskDto, errWithCode *types.OpenAIErrorWithStatusCode) {
	fetchUri := fmt.Sprintf(s.Fetchs, class, action)

	fullRequestURL := s.GetFullRequestURL(fetchUri, "")
	fullRequestURL += "?pageNum=1&pageSize=500"
	headers := s.GetRequestHeaders()

	// 创建请求
	req, err := s.Requester.NewRequest(http.MethodGet, fullRequestURL, s.Requester.WithHeader(headers))
	if err != nil {
		return nil, common.ErrorWrapper(err, "new_request_failed", http.StatusInternalServerError)
	}

	klResponse := KlingResponse[[]*KlingTaskData]{}

	_, errWithCode = s.Requester.SendRequest(req, &klResponse, false)

	if errWithCode != nil {
		return nil, errWithCode
	}

	idsMap := make(map[string]bool)
	for _, id := range ids {
		idsMap[id] = true
	}

	for _, task := range klResponse.Data {
		if !idsMap[task.TaskID] || task == nil {
			continue
		}

		data := "{}"
		taskResultJSON, _ := json.Marshal(task)
		data = string(taskResultJSON)
		response = append(response, &types.TaskDto{
			TaskID:     task.TaskID,
			Action:     action,
			Status:     switchTaskStatus(task.TaskStatus),
			FailReason: task.TaskStatusMsg,
			SubmitTime: int64(task.CreatedAt),
			StartTime:  int64(task.UpdatedAt),
			FinishTime: int64(task.UpdatedAt),
			Progress:   "0%",
			Data:       datatypes.JSON(data),
		})
	}

	return response, errWithCode
}

func (s *KlingProvider) GetFetch(class, action string, id string) (response *types.TaskResponse[types.TaskDto], errWithCode *types.OpenAIErrorWithStatusCode) {
	fetchUri := fmt.Sprintf(s.Fetch, class, action, id)

	fullRequestURL := s.GetFullRequestURL(fetchUri, "")
	headers := s.GetRequestHeaders()

	// 创建请求
	req, err := s.Requester.NewRequest(http.MethodGet, fullRequestURL, s.Requester.WithHeader(headers))
	if err != nil {
		return nil, common.ErrorWrapper(err, "new_request_failed", http.StatusInternalServerError)
	}

	klResponse := KlingResponse[*KlingTaskData]{}
	_, errWithCode = s.Requester.SendRequest(req, &klResponse, false)
	if errWithCode != nil {
		return nil, errWithCode
	}

	data := ""
	taskResultJSON, err := json.Marshal(klResponse)
	if err == nil {
		data = string(taskResultJSON)
	}

	response = &types.TaskResponse[types.TaskDto]{
		Code: "success",
		Data: &types.TaskDto{
			TaskID: id,
			Action: action,
			Data:   datatypes.JSON(data),
		},
	}

	if klResponse.Code != 0 {
		response.Code = "failed"
		response.Message = klResponse.Message
		return response, nil
	}

	if klResponse.Data != nil {
		response.Data.Status = switchTaskStatus(klResponse.Data.TaskStatus)
		response.Data.FailReason = klResponse.Data.TaskStatusMsg
		response.Data.SubmitTime = klResponse.Data.CreatedAt
		response.Data.StartTime = klResponse.Data.UpdatedAt
		response.Data.FinishTime = klResponse.Data.UpdatedAt
		response.Data.Progress = "0%"

		switch klResponse.Data.TaskStatus {
		case "submitted":
			response.Data.Progress = "0%"
		case "processing":
			response.Data.Progress = "50%"
		case "succeed":
			response.Data.Progress = "100%"
		case "failed":
			response.Data.Progress = "100%"
		}
	}

	return response, errWithCode
}

func switchTaskStatus(status string) string {
	switch status {
	case "submitted":
		return "SUBMITTED"
	case "processing":
		return "IN_PROGRESS"
	case "succeed":
		return "SUCCESS"
	case "failed":
		return "FAILURE"
	default:
		return "UNKNOWN"
	}
}
