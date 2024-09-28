package controller

import (
	"log"
	"net/http"
	"one-api/common"
	"one-api/model"
	paymentService "one-api/payment"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetPaymentList(c *gin.Context) {
	var params model.SearchPaymentParams
	if err := c.ShouldBindQuery(&params); err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	payments, err := model.GetPanymentList(&params)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    payments,
	})
}

func GetPayment(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	payment, err := model.GetPaymentByID(id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    payment,
	})
}

func AddPayment(c *gin.Context) {
	payment := model.Payment{}
	err := c.ShouldBindJSON(&payment)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	if err := payment.Insert(); err != nil {
		common.APIRespondWithError(c, http.StatusInternalServerError, err)
		return
	}

	ps, err := paymentService.NewPaymentService(payment.UUID)
	if err != nil {
		if deleteErr := payment.Delete(); deleteErr != nil {
			log.Printf("Failed to delete payment after service creation error: %v", deleteErr)
		}
		common.APIRespondWithError(c, http.StatusInternalServerError, err)
		return
	}

	if err := ps.CreatedPay(); err != nil {
		if deleteErr := payment.Delete(); deleteErr != nil {
			log.Printf("Failed to delete payment after creation error: %v", deleteErr)
		}
		common.APIRespondWithError(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Payment added successfully",
		"data":    payment,
	})
}

func UpdatePayment(c *gin.Context) {
	payment := model.Payment{}
	err := c.ShouldBindJSON(&payment)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	overwrite := true

	if payment.UUID == "" {
		overwrite = false
	}

	err = payment.Update(overwrite)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    payment,
	})
}

func DeletePayment(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	payment := model.Payment{ID: id}
	err = payment.Delete()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
}

func GetUserPaymentList(c *gin.Context) {
	payments, err := model.GetUserPaymentList()
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    payments,
	})
}
