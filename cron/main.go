package cron

import (
	"one-api/common/config"
	"one-api/common/logger"
	"one-api/model"
	"time"

	"github.com/go-co-op/gocron/v2"
)

func InitCron() {
	if !config.IsMasterNode {
		logger.SysLog("Cron is disabled on slave node")
		return
	}

	scheduler, err := gocron.NewScheduler()
	if err != nil {
		logger.SysError("Cron scheduler error: " + err.Error())
		return
	}

	// 添加删除cache的任务
	_, err = scheduler.NewJob(
		gocron.DailyJob(
			1,
			gocron.NewAtTimes(
				gocron.NewAtTime(0, 5, 0),
			)),
		gocron.NewTask(func() {
			model.RemoveChatCache()
			logger.SysLog("删除过期缓存数据")
		}),
	)

	if err != nil {
		logger.SysError("Cron job error: " + err.Error())
		return
	}

	// 添加每日统计任务
	_, err = scheduler.NewJob(
		gocron.DailyJob(
			1,
			gocron.NewAtTimes(
				gocron.NewAtTime(0, 0, 30),
			)),
		gocron.NewTask(func() {
			model.UpdateStatistics(model.StatisticsUpdateTypeYesterday)
			logger.SysLog("更新昨日统计数据")
		}),
	)
	if err != nil {
		logger.SysError("Cron job error: " + err.Error())
		return
	}

	// 每十分钟更新一次统计数据
	_, err = scheduler.NewJob(
		gocron.DurationJob(10*time.Minute),
		gocron.NewTask(func() {
			model.UpdateStatistics(model.StatisticsUpdateTypeToDay)
			logger.SysLog("10分钟统计数据")
		}),
	)

	if err != nil {
		logger.SysError("Cron job error: " + err.Error())
		return
	}

	scheduler.Start()
}
