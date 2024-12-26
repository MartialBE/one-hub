package controller

import (
	"io"
	"net/http"
	"one-api/common"
	"one-api/common/requester"
	"one-api/controller/check_channel"
	"time"

	"github.com/gin-gonic/gin"
)

func CheckImg(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.AbortWithStatus(http.StatusNotFound)
		return
	}

	err := check_channel.AppendAccessRecord(id, c)
	if err != nil {
		c.AbortWithStatus(http.StatusNotFound)
		return
	}

	check_channel.CheckImageResponse(c)

}

type checkChannelRequest struct {
	ID     int    `json:"id"`
	Models string `json:"models"`
}

func CheckChannel(c *gin.Context) {
	var params checkChannelRequest
	if err := c.ShouldBindJSON(&params); err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	ck, err := check_channel.CreateCheckChannel(params.ID, params.Models)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	// 设置 SSE 头信息
	requester.SetEventStreamHeaders(c)

	// 创建一个通道用于接收结果
	resultChan := make(chan *check_channel.ModelResult)
	heartbeatChan := make(chan bool)
	doneChan := make(chan bool)

	// 启动检查过程
	go ck.RunStream(resultChan, doneChan)

	// 启动心跳协程
	go func() {
		ticker := time.NewTicker(10 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				heartbeatChan <- true
			case <-doneChan:
				return
			}
		}
	}()

	// 处理结果流
	clientGone := c.Request.Context().Done()
	c.Stream(func(w io.Writer) bool {
		select {
		case result := <-resultChan:
			c.SSEvent("message", gin.H{
				"type": "result",
				"data": result,
			})
			return true
		case <-heartbeatChan:
			c.SSEvent("message", gin.H{
				"type": "heartbeat",
				"data": "ping",
			})
			return true
		case <-doneChan:
			c.SSEvent("message", gin.H{
				"type": "done",
				"data": "completed",
			})
			return false
		case <-clientGone:
			close(doneChan)
			return false
		}
	})
}
