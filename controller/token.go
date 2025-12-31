package controller

import (
	"errors"
	"net/http"
	"one-api/common"
	"one-api/common/config"
	"one-api/common/utils"
	"one-api/model"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetUserTokensList(c *gin.Context) {
	userId := c.GetInt("id")
	userRole := c.GetInt("role")
	var params model.GenericParams
	if err := c.ShouldBindQuery(&params); err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	tokens, err := model.GetUserTokensList(userId, &params)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	// 对于非可信用户，隐藏 BillingTag 字段
	if userRole < config.RoleReliableUser {
		for _, token := range *tokens.Data {
			setting := token.Setting.Data()
			setting.BillingTag = nil
			token.Setting.Set(setting)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    tokens,
	})
}

// GetTokensListByAdmin 管理员查询令牌列表（可按用户ID或令牌ID查询）
func GetTokensListByAdmin(c *gin.Context) {
	var params model.AdminSearchTokensParams
	if err := c.ShouldBindQuery(&params); err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	tokens, err := model.GetTokensListByAdmin(&params)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    tokens,
	})
}

func GetToken(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	userId := c.GetInt("id")
	userRole := c.GetInt("role")
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	token, err := model.GetTokenByIds(id, userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// 对于非可信用户，隐藏 BillingTag 字段
	if userRole < config.RoleReliableUser {
		setting := token.Setting.Data()
		setting.BillingTag = nil
		token.Setting.Set(setting)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    token,
	})
}

func GetPlaygroundToken(c *gin.Context) {
	tokenName := "sys_playground"
	userId := c.GetInt("id")
	token, err := model.GetTokenByName(tokenName, userId)
	if err != nil {
		cleanToken := model.Token{
			UserId: userId,
			Name:   tokenName,
			// Key:            utils.GenerateKey(),
			CreatedTime:    utils.GetTimestamp(),
			AccessedTime:   utils.GetTimestamp(),
			ExpiredTime:    0,
			RemainQuota:    0,
			UnlimitedQuota: true,
		}
		err = cleanToken.Insert()
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "创建令牌失败，请去系统手动配置一个名称为：sys_playground 的令牌",
			})
			return
		}
		token = &cleanToken
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    token.Key,
	})
}

func AddToken(c *gin.Context) {
	userId := c.GetInt("id")
	userRole := c.GetInt("role")
	token := model.Token{}
	err := c.ShouldBindJSON(&token)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	if len(token.Name) > 30 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "令牌名称过长",
		})
		return
	}

	if token.Group != "" {
		err = validateTokenGroup(token.Group, userId)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	}
	if token.BackupGroup != "" {
		err = validateTokenGroup(token.BackupGroup, userId)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	}

	setting := token.Setting.Data()
	err = validateTokenSetting(&setting)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	// 非可信用户不能设置 BillingTag
	if userRole < config.RoleReliableUser {
		setting.BillingTag = nil
	}

	cleanToken := model.Token{
		UserId: userId,
		Name:   token.Name,
		// Key:            utils.GenerateKey(),
		CreatedTime:    utils.GetTimestamp(),
		AccessedTime:   utils.GetTimestamp(),
		ExpiredTime:    token.ExpiredTime,
		RemainQuota:    token.RemainQuota,
		UnlimitedQuota: token.UnlimitedQuota,
		Group:          token.Group,
		BackupGroup:    token.BackupGroup,
	}
	cleanToken.Setting.Set(setting)
	err = cleanToken.Insert()
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

func DeleteToken(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	userId := c.GetInt("id")
	err := model.DeleteTokenById(id, userId)
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

func UpdateToken(c *gin.Context) {
	userId := c.GetInt("id")
	userRole := c.GetInt("role")
	statusOnly := c.Query("status_only")
	token := model.Token{}
	err := c.ShouldBindJSON(&token)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	if len(token.Name) > 30 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "令牌名称过长",
		})
		return
	}

	newSetting := token.Setting.Data()
	err = validateTokenSetting(&newSetting)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	cleanToken, err := model.GetTokenByIds(token.Id, userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	if token.Status == config.TokenStatusEnabled {
		if cleanToken.Status == config.TokenStatusExpired && cleanToken.ExpiredTime <= utils.GetTimestamp() && cleanToken.ExpiredTime != -1 {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "令牌已过期，无法启用，请先修改令牌过期时间，或者设置为永不过期",
			})
			return
		}
		if cleanToken.Status == config.TokenStatusExhausted && cleanToken.RemainQuota <= 0 && !cleanToken.UnlimitedQuota {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "令牌可用额度已用尽，无法启用，请先修改令牌剩余额度，或者设置为无限额度",
			})
			return
		}
	}

	if cleanToken.Group != token.Group && token.Group != "" {
		err = validateTokenGroup(token.Group, userId)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	}
	if cleanToken.BackupGroup != token.BackupGroup && token.BackupGroup != "" {
		err = validateTokenGroup(token.BackupGroup, userId)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	}

	if statusOnly != "" {
		cleanToken.Status = token.Status
	} else {
		// If you add more fields, please also update token.Update()
		cleanToken.Name = token.Name
		cleanToken.ExpiredTime = token.ExpiredTime
		cleanToken.RemainQuota = token.RemainQuota
		cleanToken.UnlimitedQuota = token.UnlimitedQuota
		cleanToken.Group = token.Group
		cleanToken.BackupGroup = token.BackupGroup

		// 处理 BillingTag: 非可信用户保持原值不变
		oldSetting := cleanToken.Setting.Data()
		if userRole < config.RoleReliableUser {
			// 非可信用户：保持原来的 BillingTag，忽略前端传入的值
			newSetting.BillingTag = oldSetting.BillingTag
		}
		// 可信用户：直接使用前端传入的值（包括空值，用于清除 BillingTag）

		cleanToken.Setting.Set(newSetting)
	}
	err = cleanToken.Update()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// 对于非可信用户，返回数据时隐藏 BillingTag 字段
	if userRole < config.RoleReliableUser {
		responseSetting := cleanToken.Setting.Data()
		responseSetting.BillingTag = nil
		cleanToken.Setting.Set(responseSetting)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    cleanToken,
	})
}

// UpdateTokenByAdmin 管理员更新任意token（支持转移用户）
func UpdateTokenByAdmin(c *gin.Context) {
	statusOnly := c.Query("status_only")
	token := model.Token{}
	err := c.ShouldBindJSON(&token)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	if len(token.Name) > 30 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "令牌名称过长",
		})
		return
	}

	newSetting := token.Setting.Data()
	err = validateTokenSetting(&newSetting)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	cleanToken, err := model.GetTokenById(token.Id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	if token.Status == config.TokenStatusEnabled {
		if cleanToken.Status == config.TokenStatusExpired && cleanToken.ExpiredTime <= utils.GetTimestamp() && cleanToken.ExpiredTime != -1 {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "令牌已过期，无法启用，请先修改令牌过期时间，或者设置为永不过期",
			})
			return
		}
		if cleanToken.Status == config.TokenStatusExhausted && cleanToken.RemainQuota <= 0 && !cleanToken.UnlimitedQuota {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "令牌可用额度已用尽，无法启用，请先修改令牌剩余额度，或者设置为无限额度",
			})
			return
		}
	}

	// 验证目标用户是否存在（如果要转移token）
	if token.UserId > 0 && token.UserId != cleanToken.UserId {
		targetUser, err := model.GetUserById(token.UserId, false)
		if err != nil || targetUser == nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "目标用户不存在",
			})
			return
		}
	}

	// 验证用户组（使用目标用户ID）
	targetUserId := cleanToken.UserId
	if token.UserId > 0 {
		targetUserId = token.UserId
	}

	if cleanToken.Group != token.Group && token.Group != "" {
		err = validateTokenGroupForUser(token.Group, targetUserId)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	}
	if cleanToken.BackupGroup != token.BackupGroup && token.BackupGroup != "" {
		err = validateTokenGroupForUser(token.BackupGroup, targetUserId)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	}

	if statusOnly != "" {
		cleanToken.Status = token.Status
	} else {
		cleanToken.Name = token.Name
		cleanToken.ExpiredTime = token.ExpiredTime
		cleanToken.RemainQuota = token.RemainQuota
		cleanToken.UnlimitedQuota = token.UnlimitedQuota
		cleanToken.Group = token.Group
		cleanToken.BackupGroup = token.BackupGroup
		cleanToken.Setting.Set(newSetting)

		// 管理员可以转移token给其他用户
		if token.UserId > 0 {
			cleanToken.UserId = token.UserId
		}
	}

	err = cleanToken.UpdateByAdmin()
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
		"data":    cleanToken,
	})
}

// validateTokenGroupForUser 验证用户组是否对指定用户有效
func validateTokenGroupForUser(tokenGroup string, userId int) error {
	userGroup, _ := model.CacheGetUserGroup(userId)
	if userGroup == "" {
		return errors.New("获取用户组信息失败")
	}

	groupRatio := model.GlobalUserGroupRatio.GetBySymbol(tokenGroup)
	if groupRatio == nil {
		return errors.New("无效的用户组")
	}

	if !groupRatio.Public && userGroup != tokenGroup {
		return errors.New("目标用户无权使用指定的分组")
	}

	return nil
}

func validateTokenGroup(tokenGroup string, userId int) error {
	userGroup, _ := model.CacheGetUserGroup(userId)
	if userGroup == "" {
		return errors.New("获取用户组信息失败")
	}

	groupRatio := model.GlobalUserGroupRatio.GetBySymbol(tokenGroup)
	if groupRatio == nil {
		return errors.New("无效的用户组")
	}

	if !groupRatio.Public && userGroup != tokenGroup {
		return errors.New("当前用户组无权使用指定的分组")
	}

	return nil
}

func validateTokenSetting(setting *model.TokenSetting) error {
	if setting == nil {
		return nil
	}

	if setting.Heartbeat.Enabled {
		if setting.Heartbeat.TimeoutSeconds < 30 || setting.Heartbeat.TimeoutSeconds > 90 {
			return errors.New("heartbeat timeout seconds must be between 30 and 90")
		}
	}

	return nil
}
