package controller

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
	"one-api/common"
	"one-api/model"
	"time"
)

func GenInvoice(c *gin.Context) {
	timeStr := c.Param("time")
	invoiceTime, err := time.Parse("2006-01-02", timeStr)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, fmt.Errorf("invalid time format"))
		return
	}
	date := time.Date(invoiceTime.Year(), invoiceTime.Month(), 1, 0, 0, 0, 0, time.Local)
	nowDate := time.Date(time.Now().Year(), time.Now().Month(), 1, 0, 0, 0, 0, time.Local)
	// 如果date大于等于当前月份返回错误
	if !date.Before(nowDate) {
		common.APIRespondWithError(c, http.StatusOK, fmt.Errorf("invoice time cannot be later than or equal to current month"))
		return
	}
	if model.IsStatisticsMonthGenerated(date) {
		common.APIRespondWithError(c, http.StatusOK, fmt.Errorf("invoice the month data already generated"))
		return
	}
	err = model.InsertStatisticsMonthForDate(date)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "账单任务提交成功，后台将自动执行指定月份的账单生成任务",
	})
}

func UpdateInvoice(c *gin.Context) {
	timeStr := c.Param("time")
	invoiceTime, err := time.Parse("2006-01-02", timeStr)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, fmt.Errorf("invalid time format"))
		return
	}
	date := time.Date(invoiceTime.Year(), invoiceTime.Month(), 1, 0, 0, 0, 0, time.Local)
	nowDate := time.Date(time.Now().Year(), time.Now().Month(), 1, 0, 0, 0, 0, time.Local)
	// 如果date大于等于当前月份返回错误
	if !date.Before(nowDate) {
		common.APIRespondWithError(c, http.StatusOK, fmt.Errorf("invoice time cannot be later than or equal to current month"))
		return
	}
	err = model.InsertStatisticsMonthForDate(date)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "账单任务提交成功，后台将自动执行指定月份的账单生成任务",
	})
}

// GetUserInvoice 根据查询参数获取用户的账单统计数据
func GetUserInvoice(c *gin.Context) {
	var params model.StatisticsMonthSearchParams
	if err := c.ShouldBindQuery(&params); err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}
	id := c.GetInt("id")
	params.UserId = id
	invoices, err := model.GetUserInvoices(&params)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    invoices,
	})
}

// GetUserInvoiceDetail 获取用户指定月份的账单详情。
func GetUserInvoiceDetail(c *gin.Context) {
	var params model.StatisticsMonthDetailSearchParams
	if err := c.ShouldBindQuery(&params); err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}
	id := c.GetInt("id")
	date := c.Query("date")
	params.UserId = id
	params.Date = date
	invoices, err := model.GetUserInvoiceDetail(&params)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    invoices,
	})
}
