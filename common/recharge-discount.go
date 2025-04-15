package common

import (
	"encoding/json"
	"one-api/common/logger"
)

var RechargeDiscount = map[string]float64{}
var SafeKeyword = map[string]string{}

func RechargeDiscount2JSONString() string {
	jsonBytes, err := json.Marshal(RechargeDiscount)
	if err != nil {
		logger.SysError("error marshalling recharge discount: " + err.Error())
	}
	return string(jsonBytes)
}

func SafeKeyword2JSONString() string {
	jsonBytes, err := json.Marshal(SafeKeyword)
	if err != nil {
		logger.SysError("error marshalling recharge discount: " + err.Error())
	}
	return string(jsonBytes)
}
func UpdateSafeKeywordByJSONString(jsonStr string) error {
	SafeKeyword = map[string]string{}
	return json.Unmarshal([]byte(jsonStr), &SafeKeyword)
}
func UpdateRechargeDiscountByJSONString(jsonStr string) error {
	RechargeDiscount = make(map[string]float64)
	return json.Unmarshal([]byte(jsonStr), &RechargeDiscount)
}

func GetRechargeDiscount(name string) float64 {
	ratio, ok := RechargeDiscount[name]
	if !ok {
		logger.SysError("recharge discount not found: " + name)
		return 1
	}
	return ratio
}
