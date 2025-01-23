package model

import (
	"errors"
	"fmt"
	"one-api/common"
	"one-api/common/config"
	"one-api/common/logger"
	"one-api/common/redis"
	"one-api/common/utils"
	"strings"

	"gorm.io/gorm"
)

// User if you add sensitive fields, don't forget to clean them in setupLogin function.
// Otherwise, the sensitive information will be saved on local storage in plain text!
type User struct {
	Id               int            `json:"id"`
	Username         string         `json:"username" gorm:"unique;index" validate:"max=12"`
	Password         string         `json:"password" gorm:"not null;" validate:"min=8,max=20"`
	DisplayName      string         `json:"display_name" gorm:"index" validate:"max=20"`
	Role             int            `json:"role" gorm:"type:int;default:1"`   // admin, common
	Status           int            `json:"status" gorm:"type:int;default:1"` // enabled, disabled
	Email            string         `json:"email" gorm:"index" validate:"max=50"`
	AvatarUrl        string         `json:"avatar_url" gorm:"type:varchar(500);column:avatar_url;default:''"`
	GitHubId         string         `json:"github_id" gorm:"column:github_id;index"`
	GitHubIdNew      int            `json:"github_id_new" gorm:"column:github_id_new;index"`
	WeChatId         string         `json:"wechat_id" gorm:"column:wechat_id;index"`
	TelegramId       int64          `json:"telegram_id" gorm:"bigint,column:telegram_id;default:0;"`
	LarkId           string         `json:"lark_id" gorm:"column:lark_id;index"`
	VerificationCode string         `json:"verification_code" gorm:"-:all"`                                    // this field is only for Email verification, don't save it to database!
	AccessToken      string         `json:"access_token" gorm:"type:char(32);column:access_token;uniqueIndex"` // this token is for system management
	Quota            int            `json:"quota" gorm:"type:int;default:0"`
	UsedQuota        int            `json:"used_quota" gorm:"type:int;default:0;column:used_quota"` // used quota
	RequestCount     int            `json:"request_count" gorm:"type:int;default:0;"`               // request number
	Group            string         `json:"group" gorm:"type:varchar(32);default:'default'"`
	AffCode          string         `json:"aff_code" gorm:"type:varchar(32);column:aff_code;uniqueIndex"`
	AffCount         int            `json:"aff_count" gorm:"type:int;default:0;column:aff_count"`
	AffQuota         int            `json:"aff_quota" gorm:"type:int;default:0;column:aff_quota"`
	AffHistoryQuota  int            `json:"aff_history_quota" gorm:"type:int;default:0;column:aff_history"`
	InviterId        int            `json:"inviter_id" gorm:"type:int;column:inviter_id;index"`
	LastLoginTime    int64          `json:"last_login_time" gorm:"bigint;default:0"`
	CreatedTime      int64          `json:"created_time" gorm:"bigint"`
	DeletedAt        gorm.DeletedAt `json:"-" gorm:"index"`
}

type UserUpdates func(*User)

func GetMaxUserId() int {
	var user User
	DB.Last(&user)
	return user.Id
}

var allowedUserOrderFields = map[string]bool{
	"id":           true,
	"username":     true,
	"role":         true,
	"status":       true,
	"created_time": true,
}

func GetUsersList(params *GenericParams) (*DataResult[User], error) {
	var users []*User
	db := DB.Omit("password")
	if params.Keyword != "" {
		groupCol := "`group`"
		if common.UsingPostgreSQL {
			groupCol = `"group"`
		}
		db = db.Where("id = ? or username LIKE ? or email LIKE ? or display_name LIKE ? or " + groupCol + " LIKE ?", utils.String2Int(params.Keyword), params.Keyword+"%", params.Keyword+"%", params.Keyword+"%", params.Keyword+"%")
	}

	return PaginateAndOrder[User](db, &params.PaginationParams, &users, allowedUserOrderFields)
}

func GetUserById(id int, selectAll bool) (*User, error) {
	if id == 0 {
		return nil, errors.New("id 为空！")
	}
	user := User{Id: id}
	var err error = nil
	if selectAll {
		err = DB.First(&user, "id = ?", id).Error
	} else {
		err = DB.Omit("password").First(&user, "id = ?", id).Error
	}
	return &user, err
}

func GetUserByTelegramId(telegramId int64) (*User, error) {
	if telegramId == 0 {
		return nil, errors.New("telegramId 为空！")
	}

	var user User
	err := DB.First(&user, "telegram_id = ?", telegramId).Error

	return &user, err
}

func GetUserIdByAffCode(affCode string) (int, error) {
	if affCode == "" {
		return 0, errors.New("affCode 为空！")
	}
	var user User
	err := DB.Select("id").First(&user, "aff_code = ?", affCode).Error
	return user.Id, err
}

func DeleteUserById(id int) (err error) {
	if id == 0 {
		return errors.New("id 为空！")
	}
	user := User{Id: id}
	return user.Delete()
}

func (user *User) Insert(inviterId int) error {
	if RecordExists(&User{}, "username", user.Username, nil) {
		return errors.New("用户名已存在！")
	}
	var err error
	if user.Password != "" {
		user.Password, err = common.Password2Hash(user.Password)
		if err != nil {
			return err
		}
	}
	user.Quota = config.QuotaForNewUser
	user.AccessToken = utils.GetUUID()
	user.AffCode = utils.GetRandomString(4)
	user.CreatedTime = utils.GetTimestamp()
	result := DB.Create(user)
	if result.Error != nil {
		return result.Error
	}
	if config.QuotaForNewUser > 0 {
		RecordLog(user.Id, LogTypeSystem, fmt.Sprintf("新用户注册赠送 %s", common.LogQuota(config.QuotaForNewUser)))
	}
	if inviterId != 0 {
		if config.QuotaForInvitee > 0 {
			_ = IncreaseUserQuota(user.Id, config.QuotaForInvitee)
			RecordLog(user.Id, LogTypeSystem, fmt.Sprintf("使用邀请码赠送 %s", common.LogQuota(config.QuotaForInvitee)))
		}
		if config.QuotaForInviter > 0 {
			_ = IncreaseUserQuota(inviterId, config.QuotaForInviter)
			RecordLog(inviterId, LogTypeSystem, fmt.Sprintf("邀请用户赠送 %s", common.LogQuota(config.QuotaForInviter)))
		}
	}
	return nil
}

func (user *User) Update(updatePassword bool) error {
	var err error
	omitFields := []string{"quota", "used_quota", "request_count", "aff_count", "aff_quota", "aff_history"}

	if updatePassword {
		user.Password, err = common.Password2Hash(user.Password)
		if err != nil {
			return err
		}
	} else {
		omitFields = append(omitFields, "password")
	}

	err = DB.Model(user).Omit(omitFields...).Updates(user).Error

	if err == nil && user.Role == config.RoleRootUser {
		config.RootUserEmail = user.Email
	}

	// 删除缓存
	if config.RedisEnabled {
		redis.RedisDel(fmt.Sprintf(UserGroupCacheKey, user.Id))
	}

	return err
}

func UpdateUser(id int, fields map[string]interface{}) error {
	return DB.Model(&User{}).Where("id = ?", id).Updates(fields).Error
}

func (user *User) Delete() error {
	if user.Id == 0 {
		return errors.New("id 为空！")
	}

	// 不改变当前数据库索引，通过更改用户名来删除用户
	user.Username = user.Username + "_del_" + utils.GetRandomString(6)
	err := user.Update(false)
	if err != nil {
		return err
	}

	err = DB.Delete(user).Error
	return err
}

// ValidateAndFill check password & user status
func (user *User) ValidateAndFill() (err error) {
	// When querying with struct, GORM will only query with non-zero fields,
	// that means if your field’s value is 0, '', false or other zero values,
	// it won’t be used to build query conditions
	password := user.Password
	if user.Username == "" || password == "" {
		return errors.New("用户名或密码为空")
	}
	err = DB.Where("username = ?", user.Username).First(user).Error
	if err != nil {
		// we must make sure check username firstly
		// consider this case: a malicious user set his username as other's email
		err := DB.Where("email = ?", user.Username).First(user).Error
		if err != nil {
			return errors.New("用户名或密码错误，或用户已被封禁")
		}
	}
	okay := common.ValidatePasswordAndHash(password, user.Password)
	if !okay || user.Status != config.UserStatusEnabled {
		return errors.New("用户名或密码错误，或用户已被封禁")
	}
	return nil
}

func (user *User) FillUserById() error {
	if user.Id == 0 {
		return errors.New("id 为空！")
	}

	result := DB.Where(User{Id: user.Id}).First(user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return errors.New("没有找到用户！")
		}
		return result.Error
	}
	return nil
}

func (user *User) FillUserByEmail() error {
	if user.Email == "" {
		return errors.New("email 为空！")
	}

	result := DB.Where(User{Email: user.Email}).First(user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return errors.New("没有找到用户！")
		}
		return result.Error
	}
	return nil
}

func (user *User) FillUserByGitHubId() error {
	if user.GitHubId == "" {
		return errors.New("GitHub id 为空！")
	}
	DB.Where(User{GitHubId: user.GitHubId}).First(user)
	return nil
}

func (user *User) FillUserByGitHubIdNew() error {
	if user.GitHubIdNew == 0 {
		return errors.New("GitHub id new 为空！")
	}
	DB.Where(User{GitHubIdNew: user.GitHubIdNew}).First(user)
	return nil
}

func (user *User) FillUserByWeChatId() error {
	if user.WeChatId == "" {
		return errors.New("WeChat id 为空！")
	}
	DB.Where(User{WeChatId: user.WeChatId}).First(user)
	return nil
}

func (user *User) FillUserByLarkId() error {
	if user.LarkId == "" {
		return errors.New("lark id 为空！")
	}
	DB.Where(User{LarkId: user.LarkId}).First(user)
	return nil
}

func (user *User) FillUserByUsername() error {
	if user.Username == "" {
		return errors.New("username 为空！")
	}
	err := DB.Where(User{Username: user.Username}).First(user)
	if err != nil {
		return err.Error
	}
	return nil
}

func FindUserByField(field string, value any) (*User, error) {
	user := &User{}
	err := DB.Where(fmt.Sprintf("%s = ?", field), value).First(user).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}

	return user, err
}

func IsFieldAlreadyTaken(field string, value any) bool {
	var count int64
	DB.Model(&User{}).Where(fmt.Sprintf("%s = ?", field), value).Limit(1).Count(&count)
	return count > 0
}

func IsUsernameAlreadyTaken(username string) bool {
	return IsFieldAlreadyTaken("username", username)
}

func IsEmailAlreadyTaken(email string) bool {
	return IsFieldAlreadyTaken("email", email)
}

func IsWeChatIdAlreadyTaken(wechatId string) bool {
	return IsFieldAlreadyTaken("wechat_id", wechatId)
}

func IsGitHubIdAlreadyTaken(githubId string) bool {
	return IsFieldAlreadyTaken("github_id", githubId)
}

func IsGitHubIdNewAlreadyTaken(githubIdNew int) bool {
	return IsFieldAlreadyTaken("github_id_new", githubIdNew)
}

func IsLarkIdAlreadyTaken(larkId string) bool {
	return IsFieldAlreadyTaken("lark_id", larkId)
}

func IsTelegramIdAlreadyTaken(telegramId int64) bool {
	return IsFieldAlreadyTaken("telegram_id", telegramId)
}

func ResetUserPasswordByEmail(email string, password string) error {
	if email == "" || password == "" {
		return errors.New("邮箱地址或密码为空！")
	}
	hashedPassword, err := common.Password2Hash(password)
	if err != nil {
		return err
	}
	err = DB.Model(&User{}).Where("email = ?", email).Update("password", hashedPassword).Error
	return err
}

func IsAdmin(userId int) bool {
	if userId == 0 {
		return false
	}
	var user User
	err := DB.Where("id = ?", userId).Select("role").Find(&user).Error
	if err != nil {
		logger.SysError("no such user " + err.Error())
		return false
	}
	return user.Role >= config.RoleAdminUser
}

func IsUserEnabled(userId int) (bool, error) {
	if userId == 0 {
		return false, errors.New("user id is empty")
	}
	var user User
	err := DB.Where("id = ?", userId).Select("status").Find(&user).Error
	if err != nil {
		return false, err
	}
	return user.Status == config.UserStatusEnabled, nil
}

func ValidateAccessToken(token string) (user *User) {
	if token == "" {
		return nil
	}
	token = strings.Replace(token, "Bearer ", "", 1)
	user = &User{}
	if DB.Where("access_token = ?", token).First(user).RowsAffected == 1 {
		return user
	}
	return nil
}

func GetUserFields(id int, fields []string) (map[string]interface{}, error) {
	result := make(map[string]interface{})
	err := GetFieldsByID(&User{}, fields, id, &result)
	return result, err
}

func GetUserQuota(id int) (quota int, err error) {
	err = DB.Model(&User{}).Where("id = ?", id).Select("quota").Find(&quota).Error
	return quota, err
}

func GetUserUsedQuota(id int) (quota int, err error) {
	err = DB.Model(&User{}).Where("id = ?", id).Select("used_quota").Find(&quota).Error
	return quota, err
}

func GetUserGroup(id int) (group string, err error) {
	groupCol := "`group`"
	if common.UsingPostgreSQL {
		groupCol = `"group"`
	}

	err = DB.Model(&User{}).Where("id = ?", id).Select(groupCol).Find(&group).Error
	return group, err
}

func IncreaseUserQuota(id int, quota int) (err error) {
	if quota < 0 {
		return errors.New("quota 不能为负数！")
	}
	if config.BatchUpdateEnabled {
		addNewRecord(BatchUpdateTypeUserQuota, id, quota)
		return nil
	}
	return increaseUserQuota(id, quota)
}

func increaseUserQuota(id int, quota int) (err error) {
	err = DB.Model(&User{}).Where("id = ?", id).Update("quota", gorm.Expr("quota + ?", quota)).Error
	return err
}

func DecreaseUserQuota(id int, quota int) (err error) {
	if quota < 0 {
		return errors.New("quota 不能为负数！")
	}
	if config.BatchUpdateEnabled {
		addNewRecord(BatchUpdateTypeUserQuota, id, -quota)
		return nil
	}
	return decreaseUserQuota(id, quota)
}

func decreaseUserQuota(id int, quota int) (err error) {
	err = DB.Model(&User{}).Where("id = ?", id).Update("quota", gorm.Expr("quota - ?", quota)).Error
	return err
}

func GetRootUserEmail() (email string) {
	DB.Model(&User{}).Where("role = ?", config.RoleRootUser).Select("email").Find(&email)
	return email
}

func UpdateUserUsedQuotaAndRequestCount(id int, quota int) {
	if config.BatchUpdateEnabled {
		addNewRecord(BatchUpdateTypeUsedQuota, id, quota)
		addNewRecord(BatchUpdateTypeRequestCount, id, 1)
		return
	}
	updateUserUsedQuotaAndRequestCount(id, quota, 1)
}

func updateUserUsedQuotaAndRequestCount(id int, quota int, count int) {
	err := DB.Model(&User{}).Where("id = ?", id).Updates(
		map[string]interface{}{
			"used_quota":    gorm.Expr("used_quota + ?", quota),
			"request_count": gorm.Expr("request_count + ?", count),
		},
	).Error
	if err != nil {
		logger.SysError("failed to update user used quota and request count: " + err.Error())
	}
}

func updateUserUsedQuota(id int, quota int) {
	err := DB.Model(&User{}).Where("id = ?", id).Updates(
		map[string]interface{}{
			"used_quota": gorm.Expr("used_quota + ?", quota),
		},
	).Error
	if err != nil {
		logger.SysError("failed to update user used quota: " + err.Error())
	}
}

func updateUserRequestCount(id int, count int) {
	err := DB.Model(&User{}).Where("id = ?", id).Update("request_count", gorm.Expr("request_count + ?", count)).Error
	if err != nil {
		logger.SysError("failed to update user request count: " + err.Error())
	}
}

func GetUsernameById(id int) (username string) {
	DB.Model(&User{}).Where("id = ?", id).Select("username").Find(&username)
	return username
}

type StatisticsUser struct {
	TotalQuota       int64 `json:"total_quota"`
	TotalUsedQuota   int64 `json:"total_used_quota"`
	TotalUser        int64 `json:"total_user"`
	TotalInviterUser int64 `json:"total_inviter_user"`
}

func GetStatisticsUser() (statisticsUser *StatisticsUser, err error) {
	err = DB.Model(&User{}).Select("sum(quota) as total_quota, sum(used_quota) as total_used_quota, count(*) as total_user, count(CASE WHEN inviter_id != 0 THEN 1 END) as total_inviter_user").Scan(&statisticsUser).Error
	return statisticsUser, err
}

type UserStatisticsByPeriod struct {
	Date             string `json:"date"`
	UserCount        int64  `json:"user_count"`
	InviterUserCount int64  `json:"inviter_user_count"`
}

func GetUserStatisticsByPeriod(startTimestamp, endTimestamp int64) (statistics []*UserStatisticsByPeriod, err error) {
	groupSelect := getTimestampGroupsSelect("created_time", "day", "date")

	err = DB.Raw(`
		SELECT `+groupSelect+`,
		count(*) as user_count,
		count(CASE WHEN inviter_id != 0 THEN 1 END) as inviter_user_count
		FROM users
		WHERE created_time BETWEEN ? AND ?
		GROUP BY date
		ORDER BY date
	`, startTimestamp, endTimestamp).Scan(&statistics).Error

	return statistics, err
}

func ChangeUserQuota(id int, quota int, isRecharge bool) (err error) {
	updateMap := map[string]interface{}{
		"quota": gorm.Expr("quota + ?", quota),
	}

	if isRecharge {
		updateMap["recharge_count"] = gorm.Expr("recharge_count + 1")
	}

	err = DB.Model(&User{}).Where("id = ?", id).Updates(updateMap).Error

	if err != nil {
		return err
	}

	if config.RedisEnabled {
		redis.RedisDel(fmt.Sprintf(UserQuotaCacheKey, id))
	}

	return nil
}
