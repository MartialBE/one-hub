package model

import (
	"one-api/common/limit"
	"sync"
)

type UserGroup struct {
	Id      int     `json:"id"`
	Symbol  string  `json:"symbol" gorm:"type:varchar(50);uniqueIndex"`
	Name    string  `json:"name" gorm:"type:varchar(50)"`
	Ratio   float64 `json:"ratio" gorm:"type:decimal(10,2); default:1"` // 倍率
	APIRate int     `json:"api_rate" gorm:"default:600"`                // 每分组允许的请求数
	Public  bool    `json:"public" form:"public" gorm:"default:false"`  // 是否为公开分组，如果是，则可以被用户在令牌中选择
	// Promotion bool  `json:"promotion" form:"promotion" gorm:"default:false"` // 是否是自动升级用户组， 如果是则用户充值金额满足条件自动升级
	// Min       int   `json:"min" form:"min" gorm:"default:0"`                 // 晋级条件最小值
	// Max       int   `json:"max" form:"max" gorm:"default:0"`                 // 晋级条件最大值
	Enable *bool `json:"enable" form:"enable" gorm:"default:true"` // 是否启用
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
	err := DB.Select("name", "ratio", "public", "api_rate").Updates(c).Error
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
