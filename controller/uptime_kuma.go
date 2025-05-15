package controller

import (
	"github.com/gin-gonic/gin"
	"io"
	"net/http"
	"one-api/common/config"
	"strconv"
	"time"
)

func UptimeKumaStatusPage(c *gin.Context) {
	var api = config.UPTIMEKUMA_DOMAIN + "/api/status-page/" + config.UPTIMEKUMA_STATUS_PAGE_NAME + "?t=" + strconv.FormatInt(time.Now().Unix(), 10)
	resp, err := http.Get(api)
	if err != nil {
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	c.Data(http.StatusOK, resp.Header.Get("Content-Type"), body)
}
func UptimeKumaStatusPageHeartbeat(c *gin.Context) {
	var api = config.UPTIMEKUMA_DOMAIN + "/api/status-page/heartbeat/" + config.UPTIMEKUMA_STATUS_PAGE_NAME + "?t=" + strconv.FormatInt(time.Now().Unix(), 10)
	resp, err := http.Get(api)
	if err != nil {
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	c.Data(http.StatusOK, resp.Header.Get("Content-Type"), body)
}
