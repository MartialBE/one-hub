package model

import (
	"errors"
	"fmt"
	"one-api/common"
	"one-api/common/config"
	"one-api/common/logger"
	"one-api/common/redis"
	"one-api/common/stmp"
	"one-api/common/utils"

	"gorm.io/gorm"
)

var (
	ErrTokenNotFound          = errors.New("令牌不存在")
	ErrTokenExpired           = errors.New("令牌已过期")
	ErrTokenQuotaExhausted    = errors.New("令牌额度已用尽")
	ErrTokenStatusUnavailable = errors.New("令牌状态不可用")
	ErrTokenInvalid           = errors.New("无效的令牌")
	ErrTokenQuotaGet          = errors.New("获取令牌额度失败")
)

type Token struct {
	Id             int            `json:"id"`
	UserId         int            `json:"user_id"`
	Key            string         `json:"key" gorm:"type:varchar(59);uniqueIndex"`
	Status         int            `json:"status" gorm:"default:1"`
	Name           string         `json:"name" gorm:"index" `
	CreatedTime    int64          `json:"created_time" gorm:"bigint"`
	AccessedTime   int64          `json:"accessed_time" gorm:"bigint"`
	ExpiredTime    int64          `json:"expired_time" gorm:"bigint;default:-1"` // -1 means never expired
	RemainQuota    int            `json:"remain_quota" gorm:"default:0"`
	UnlimitedQuota bool           `json:"unlimited_quota" gorm:"default:false"`
	UsedQuota      int            `json:"used_quota" gorm:"default:0"` // used quota
	Group          string         `json:"group" gorm:"default:''"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`
}

var allowedTokenOrderFields = map[string]bool{
	"id":           true,
	"name":         true,
	"status":       true,
	"expired_time": true,
	"created_time": true,
	"remain_quota": true,
	"used_quota":   true,
}

// 添加 AfterCreate 钩子方法
func (token *Token) AfterCreate(tx *gorm.DB) (err error) {
	tokenKey, err := common.GenerateToken(token.Id, token.UserId)
	if err != nil {
		return err
	}

	// 更新 key 字段
	return tx.Model(token).Update("key", tokenKey).Error
}

func GetUserTokensList(userId int, params *GenericParams) (*DataResult[Token], error) {
	var tokens []*Token
	db := DB.Where("user_id = ?", userId)

	if params.Keyword != "" {
		db = db.Where("name LIKE ?", params.Keyword+"%")
	}

	return PaginateAndOrder(db, &params.PaginationParams, &tokens, allowedTokenOrderFields)
}

func GetTokenModel(key string) (token *Token, err error) {
	if key == "" {
		return nil, ErrTokenInvalid
	}

	var userId int
	var tokenId int
	validUser := false

	switch len(key) {
	case 48:
		validUser = true
		if config.RedisEnabled {
			exists, _ := redis.RedisSIsMember(OldUserTokensCacheKey, key)
			if !exists {
				return nil, ErrTokenInvalid
			}
		}
	case 59:
		tokenId, userId, err = common.ValidateToken(key)
		if err != nil || userId == 0 || tokenId == 0 {
			return nil, ErrTokenInvalid
		}
		if userEnabled, err := CacheIsUserEnabled(userId); err != nil || !userEnabled {
			return nil, ErrTokenInvalid
		}
	default:
		return nil, ErrTokenInvalid
	}

	token, err = CacheGetTokenByKey(key)
	if err != nil {
		logger.SysError(fmt.Sprintf("DB Not Found: userId=%d, tokenId=%d, key=%s, err=%s", userId, tokenId, key, err.Error()))
		return nil, ErrTokenInvalid
	}

	if validUser {
		if userEnabled, err := CacheIsUserEnabled(token.UserId); err != nil || !userEnabled {
			return nil, ErrTokenInvalid
		}
	}

	return token, nil
}

func ValidateUserToken(key string) (token *Token, err error) {
	token, err = GetTokenModel(key)
	if err != nil {
		return nil, err
	}

	if token.Status != config.TokenStatusEnabled {
		switch token.Status {
		case config.TokenStatusExhausted:
			return nil, ErrTokenQuotaExhausted
		case config.TokenStatusExpired:
			return nil, ErrTokenExpired
		default:
			return nil, ErrTokenStatusUnavailable
		}
	}

	if token.ExpiredTime != -1 && token.ExpiredTime < utils.GetTimestamp() {
		return nil, ErrTokenExpired
	}

	if !token.UnlimitedQuota {
		if !token.UnlimitedQuota && token.RemainQuota <= 0 {
			if !config.RedisEnabled {
				// in this case, we can make sure the token is exhausted
				token.Status = config.TokenStatusExhausted
				err := token.SelectUpdate()
				if err != nil {
					logger.SysError("failed to update token status" + err.Error())
				}
			}
			return nil, ErrTokenQuotaExhausted
		}
	}

	return token, nil
}

func GetTokenByIds(id int, userId int) (*Token, error) {
	if id == 0 || userId == 0 {
		return nil, errors.New("id 或 userId 为空！")
	}
	token := Token{Id: id, UserId: userId}
	var err error = nil
	err = DB.First(&token, "id = ? and user_id = ?", id, userId).Error
	return &token, err
}

func GetTokenById(id int) (*Token, error) {
	if id == 0 {
		return nil, errors.New("id 为空！")
	}
	token := Token{Id: id}
	var err error = nil
	err = DB.First(&token, "id = ?", id).Error
	return &token, err
}

func GetTokenByName(name string, userId int) (*Token, error) {
	if name == "" {
		return nil, errors.New("name 为空！")
	}
	token := Token{Name: name}
	var err error = nil
	err = DB.First(&token, "user_id = ? and name = ?", userId, name).Error
	return &token, err
}

func GetTokenByKey(key string) (*Token, error) {
	keyCol := "`key`"
	if common.UsingPostgreSQL {
		keyCol = `"key"`
	}

	var token Token

	err := DB.Where(keyCol+" = ?", key).First(&token).Error
	return &token, err
}

func (token *Token) Insert() error {
	err := DB.Create(token).Error
	return err
}

// Update Make sure your token's fields is completed, because this will update non-zero values
func (token *Token) Update() error {
	err := DB.Model(token).Select("name", "status", "expired_time", "remain_quota", "unlimited_quota", "group").Updates(token).Error
	// 防止Redis缓存不生效，直接删除
	if err == nil && config.RedisEnabled {
		redis.RedisDel(fmt.Sprintf(UserTokensKey, token.Key))
	}

	return err
}

func (token *Token) SelectUpdate() error {
	// This can update zero values
	return DB.Model(token).Select("accessed_time", "status").Updates(token).Error
}

func (token *Token) Delete() error {
	err := DB.Delete(token).Error
	return err
}

func DeleteTokenById(id int, userId int) (err error) {
	// Why we need userId here? In case user want to delete other's token.
	if id == 0 || userId == 0 {
		return errors.New("id 或 userId 为空！")
	}
	token := Token{Id: id, UserId: userId}
	err = DB.Where(token).First(&token).Error
	if err != nil {
		return err
	}
	err = token.Delete()

	if err == nil && config.RedisEnabled {
		redis.RedisDel(fmt.Sprintf(UserTokensKey, token.Key))
	}

	return err

}

func IncreaseTokenQuota(id int, quota int) (err error) {
	if quota < 0 {
		return errors.New("quota 不能为负数！")
	}
	if config.BatchUpdateEnabled {
		addNewRecord(BatchUpdateTypeTokenQuota, id, quota)
		return nil
	}
	return increaseTokenQuota(id, quota)
}

func increaseTokenQuota(id int, quota int) (err error) {
	err = DB.Model(&Token{}).Where("id = ?", id).Updates(
		map[string]interface{}{
			"remain_quota":  gorm.Expr("remain_quota + ?", quota),
			"used_quota":    gorm.Expr("used_quota - ?", quota),
			"accessed_time": utils.GetTimestamp(),
		},
	).Error
	return err
}

func DecreaseTokenQuota(id int, quota int) (err error) {
	if quota < 0 {
		return errors.New("quota 不能为负数！")
	}
	if config.BatchUpdateEnabled {
		addNewRecord(BatchUpdateTypeTokenQuota, id, -quota)
		return nil
	}
	return decreaseTokenQuota(id, quota)
}

func decreaseTokenQuota(id int, quota int) (err error) {
	err = DB.Model(&Token{}).Where("id = ?", id).Updates(
		map[string]interface{}{
			"remain_quota":  gorm.Expr("remain_quota - ?", quota),
			"used_quota":    gorm.Expr("used_quota + ?", quota),
			"accessed_time": utils.GetTimestamp(),
		},
	).Error
	return err
}

func PreConsumeTokenQuota(tokenId int, quota int) (err error) {
	if quota < 0 {
		return errors.New("quota 不能为负数！")
	}
	token, err := GetTokenById(tokenId)
	if err != nil {
		return err
	}
	if !token.UnlimitedQuota && token.RemainQuota < quota {
		return errors.New("令牌额度不足")
	}
	userQuota, err := GetUserQuota(token.UserId)
	if err != nil {
		return err
	}
	if userQuota < quota {
		return errors.New("用户额度不足")
	}
	quotaTooLow := userQuota >= config.QuotaRemindThreshold && userQuota-quota < config.QuotaRemindThreshold
	noMoreQuota := userQuota-quota <= 0
	if quotaTooLow || noMoreQuota {
		go sendQuotaWarningEmail(token.UserId, userQuota, noMoreQuota)
	}
	if !token.UnlimitedQuota {
		err = DecreaseTokenQuota(tokenId, quota)
		if err != nil {
			return err
		}
	}
	err = DecreaseUserQuota(token.UserId, quota)
	return err
}

func sendQuotaWarningEmail(userId int, userQuota int, noMoreQuota bool) {
	user := User{Id: userId}

	if err := user.FillUserById(); err != nil {
		logger.SysError("failed to fetch user email: " + err.Error())
		return
	}

	if user.Email == "" {
		logger.SysError("user email is empty")
		return
	}

	userName := user.DisplayName
	if userName == "" {
		userName = user.Username
	}

	err := stmp.SendQuotaWarningCodeEmail(userName, user.Email, userQuota, noMoreQuota)

	if err != nil {
		logger.SysError("failed to send email" + err.Error())
	}
}

func PostConsumeTokenQuota(tokenId int, quota int) (err error) {
	if quota == 0 {
		return nil
	}
	token, err := GetTokenById(tokenId)
	if err != nil {
		return err
	}
	if quota > 0 {
		err = DecreaseUserQuota(token.UserId, quota)
	} else {
		err = IncreaseUserQuota(token.UserId, -quota)
	}
	if err != nil {
		return err
	}
	if !token.UnlimitedQuota {
		if quota > 0 {
			err = DecreaseTokenQuota(tokenId, quota)
		} else {
			err = IncreaseTokenQuota(tokenId, -quota)
		}
		if err != nil {
			return err
		}
	}
	return nil
}
