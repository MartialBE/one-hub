package model

import (
	"fmt"
	"one-api/common/config"
	"one-api/common/limit"
	"one-api/common/logger"
	"one-api/common/redis"
	"sync"
)

type UserGroup struct {
	Id        int     `json:"id"`
	Symbol    string  `json:"symbol" gorm:"type:varchar(50);uniqueIndex"`
	Name      string  `json:"name" gorm:"type:varchar(50)"`
	Ratio     float64 `json:"ratio" gorm:"type:decimal(10,2); default:1"`      // 倍率
	APIRate   int     `json:"api_rate" gorm:"default:600"`                     // 每分组允许的请求数
	Public    bool    `json:"public" form:"public" gorm:"default:false"`       // 是否为公开分组，如果是，则可以被用户在令牌中选择
	Promotion bool    `json:"promotion" form:"promotion" gorm:"default:false"` // 是否是自动升级用户组， 如果是则用户充值金额满足条件自动升级
	Min       int     `json:"min" form:"min" gorm:"default:0"`                 // 晋级条件最小值
	Max       int     `json:"max" form:"max" gorm:"default:0"`                 // 晋级条件最大值
	Enable    *bool   `json:"enable" form:"enable" gorm:"default:true"`        // 是否启用
}

type SearchUserGroupParams struct {
	UserGroup
	PaginationParams
}

var allowedUserGroupOrderFields = map[string]bool{
	"id":     true,
	"name":   true,
	"enable": true,
}

func GetUserGroupsList(params *SearchUserGroupParams) (*DataResult[UserGroup], error) {
	var userGroups []*UserGroup
	db := DB

	if params.Name != "" {
		db = db.Where("name LIKE ?", params.Name+"%")
	}

	if params.Enable != nil {
		db = db.Where("enable = ?", *params.Enable)
	}

	return PaginateAndOrder(db, &params.PaginationParams, &userGroups, allowedUserGroupOrderFields)
}

func GetUserGroupsById(id int) (*UserGroup, error) {
	var userGroup UserGroup
	err := DB.Where("id = ?", id).First(&userGroup).Error
	return &userGroup, err
}

func GetUserGroupsAll(isPublic bool) ([]*UserGroup, error) {
	var userGroups []*UserGroup

	db := DB.Where("enable = ?", true)
	if isPublic {
		db = db.Where("public = ?", true)
	}

	err := db.Find(&userGroups).Error
	return userGroups, err
}

func (c *UserGroup) Create() error {
	err := DB.Create(c).Error
	if err == nil {
		GlobalUserGroupRatio.Load()
	}
	return err
}

func (c *UserGroup) Update() error {
	err := DB.Select("name", "ratio", "public", "api_rate", "promotion", "min", "max").Updates(c).Error
	if err == nil {
		GlobalUserGroupRatio.Load()
	}

	return err
}

func (c *UserGroup) Delete() error {
	err := DB.Delete(c).Error

	if err == nil {
		GlobalUserGroupRatio.Load()
	}
	return err
}

func ChangeUserGroupEnable(id int, enable bool) error {
	err := DB.Model(&UserGroup{}).Where("id = ?", id).Update("enable", enable).Error
	if err == nil {
		GlobalUserGroupRatio.Load()
	}
	return err
}

type UserGroupRatio struct {
	sync.RWMutex
	UserGroup   map[string]*UserGroup
	APILimiter  map[string]limit.RateLimiter
	PublicGroup []string
}

var GlobalUserGroupRatio = UserGroupRatio{}

func (cgrm *UserGroupRatio) Load() {
	userGroups, err := GetUserGroupsAll(false)
	if err != nil {
		return
	}

	newUserGroups := make(map[string]*UserGroup, len(userGroups))
	newAPILimiter := make(map[string]limit.RateLimiter, len(userGroups))
	publicGroup := make([]string, 0)

	for _, userGroup := range userGroups {
		newUserGroups[userGroup.Symbol] = userGroup
		newAPILimiter[userGroup.Symbol] = limit.NewAPILimiter(userGroup.APIRate)
		if userGroup.Public {
			publicGroup = append(publicGroup, userGroup.Symbol)
		}
	}

	cgrm.Lock()
	defer cgrm.Unlock()

	cgrm.UserGroup = newUserGroups
	cgrm.APILimiter = newAPILimiter
	cgrm.PublicGroup = publicGroup
}

func (cgrm *UserGroupRatio) GetBySymbol(symbol string) *UserGroup {
	cgrm.RLock()
	defer cgrm.RUnlock()

	if symbol == "" {
		return nil
	}

	userGroupRatio, ok := cgrm.UserGroup[symbol]
	if !ok {
		return nil
	}

	return userGroupRatio
}

func (cgrm *UserGroupRatio) GetByTokenUserGroup(tokenGroup, userGroup string) *UserGroup {
	if tokenGroup != "" {
		return cgrm.GetBySymbol(tokenGroup)
	}

	return cgrm.GetBySymbol(userGroup)
}

func (cgrm *UserGroupRatio) GetAll() map[string]*UserGroup {
	cgrm.RLock()
	defer cgrm.RUnlock()

	return cgrm.UserGroup
}

func (cgrm *UserGroupRatio) GetAPIRate(symbol string) int {
	userGroup := cgrm.GetBySymbol(symbol)
	if userGroup == nil {
		return 0
	}

	return userGroup.APIRate
}

func (cgrm *UserGroupRatio) GetPublicGroupList() []string {
	cgrm.RLock()
	defer cgrm.RUnlock()

	return cgrm.PublicGroup
}

func (cgrm *UserGroupRatio) GetAPILimiter(symbol string) limit.RateLimiter {
	cgrm.RLock()
	defer cgrm.RUnlock()

	limiter, ok := cgrm.APILimiter[symbol]
	if !ok {
		return nil
	}

	return limiter
}

// CheckAndUpgradeUserGroup checks if a user's cumulative recharge amount falls within any promotion group's range
// and upgrades the user to that group if a match is found.
// The cumulative recharge amount is calculated as Quota + UsedQuota + rechargeAmount.
func CheckAndUpgradeUserGroup(userId int, rechargeAmount int) error {
	// Get user's current quota and used quota
	user := &User{}
	err := DB.Where("id = ?", userId).First(user).Error
	if err != nil {
		return err
	}

	// Calculate cumulative recharge amount
	cumulativeAmount := user.Quota + user.UsedQuota + rechargeAmount
	logger.SysError(fmt.Sprintf("use:%f q:%f  cumulative:%f rechargeAmount:%f", (float64)(user.UsedQuota)/config.QuotaPerUnit, (float64)(user.Quota)/config.QuotaPerUnit, cumulativeAmount, rechargeAmount))
	// Get all promotion-enabled user groups
	var promotionGroups []*UserGroup
	err = DB.Where("promotion = ? AND enable = ?", true, true).Find(&promotionGroups).Error
	if err != nil {
		return err
	}

	// Find a matching group (min <= cumulativeAmount < max)
	var targetGroup *UserGroup
	for _, group := range promotionGroups {
		var minQuota = (float64)(group.Min) * config.QuotaPerUnit
		var maxQuota = (float64)(group.Max) * config.QuotaPerUnit
		if (float64)(cumulativeAmount) >= minQuota && (group.Max == 0 || (float64)(cumulativeAmount) < maxQuota) {
			// If multiple groups match, choose the one with higher min value
			if targetGroup == nil || group.Min > targetGroup.Min {
				targetGroup = group
			}
		}
	}

	// If a matching group is found, upgrade the user
	if targetGroup != nil && targetGroup.Symbol != user.Group {
		// Update user's group
		err = DB.Model(&User{}).Where("id = ?", userId).Update("group", targetGroup.Symbol).Error
		if err != nil {
			return err
		}

		// Delete cache if Redis is enabled
		if config.RedisEnabled {
			redis.RedisDel(fmt.Sprintf(UserGroupCacheKey, userId))
		}
	}

	return nil
}
