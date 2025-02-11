package scheduler

import (
	"fmt"
	"one-api/common/logger"
	"sync"

	"github.com/go-co-op/gocron/v2"
)

type TaskManager struct {
	scheduler gocron.Scheduler
	jobs      map[string]*JobInfo
	mu        sync.RWMutex
}

type JobInfo struct {
	Job        gocron.Job
	Name       string
	Definition gocron.JobDefinition
	Task       gocron.Task
	Options    []gocron.JobOption
}

var (
	Manager *TaskManager
)

func init() {
	scheduler, err := gocron.NewScheduler()
	if err != nil {
		logger.SysError("初始化调度器失败: " + err.Error())
		return
	}

	Manager = &TaskManager{
		scheduler: scheduler,
		jobs:      make(map[string]*JobInfo),
	}

	Manager.scheduler.Start()
}

func (tm *TaskManager) AddJob(name string, definition gocron.JobDefinition, task gocron.Task, options ...gocron.JobOption) error {
	tm.mu.Lock()
	defer tm.mu.Unlock()

	// 如果任务已存在，先移除
	if oldJob, exists := tm.jobs[name]; exists {
		tm.scheduler.RemoveJob(oldJob.Job.ID())
	}

	job, err := tm.scheduler.NewJob(
		definition,
		task,
		options...,
	)

	if err != nil {
		return fmt.Errorf("添加任务失败: %v", err)
	}

	tm.jobs[name] = &JobInfo{
		Job:        job,
		Name:       name,
		Definition: definition,
		Task:       task,
		Options:    options,
	}

	return nil
}

// 获取所有任务信息
func (tm *TaskManager) GetJob(name string) *JobInfo {
	tm.mu.RLock()
	defer tm.mu.RUnlock()

	return tm.jobs[name]
}
