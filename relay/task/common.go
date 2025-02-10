package task

import (
	"errors"
	"one-api/common/config"
	"one-api/model"
	"one-api/relay/task/base"
	"one-api/relay/task/kling"
	"one-api/relay/task/suno"

	"github.com/gin-gonic/gin"
)

func GetTaskAdaptor(relayType int, c *gin.Context) (base.TaskInterface, error) {
	switch relayType {
	case config.RelayModeSuno:
		return &suno.SunoTask{
			TaskBase: getTaskBase(c, model.TaskPlatformSuno),
		}, nil
	case config.RelayModeKling:
		return &kling.KlingTask{
			TaskBase: getTaskBase(c, model.TaskPlatformKling),
		}, nil
	default:
		return nil, errors.New("adaptor not found")
	}
}

func GetTaskAdaptorByPlatform(platform string) (base.TaskInterface, error) {
	relayType := config.RelayModeUnknown

	switch platform {
	case model.TaskPlatformSuno:
		relayType = config.RelayModeSuno
	case model.TaskPlatformKling:
		relayType = config.RelayModeKling
	}

	return GetTaskAdaptor(relayType, nil)
}

func getTaskBase(c *gin.Context, platform string) base.TaskBase {
	return base.TaskBase{
		Platform: platform,
		C:        c,
	}
}
