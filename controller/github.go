package controller

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"one-api/common/config"
	"one-api/common/logger"
	"one-api/common/utils"
	"one-api/model"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

type GitHubOAuthResponse struct {
	AccessToken string `json:"access_token"`
	Scope       string `json:"scope"`
	TokenType   string `json:"token_type"`
}

type GitHubUser struct {
	Id        int    `json:"id"`
	Login     string `json:"login"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	AvatarUrl string `json:"avatar_url"`
}

type GithubEmail struct {
	Email    string `json:"email"`
	Primary  bool   `json:"primary"`
	Verified bool   `json:"verified"`
}

func getGitHubUserInfoByCode(code string) (*GitHubUser, error) {
	if code == "" {
		return nil, errors.New("无效的参数")
	}
	values := map[string]string{"client_id": config.GitHubClientId, "client_secret": config.GitHubClientSecret, "code": code}
	jsonData, err := json.Marshal(values)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequest("POST", "https://github.com/login/oauth/access_token", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	client := http.Client{
		Timeout: 5 * time.Second,
	}
	res, err := client.Do(req)
	if err != nil {
		logger.SysError("无法连接至 GitHub 服务器, err:" + err.Error())
		return nil, errors.New("无法连接至 GitHub 服务器，请稍后重试！")
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, errors.New("无法连接至 GitHub 服务器，请稍后重试！")
	}

	var oAuthResponse GitHubOAuthResponse
	err = json.NewDecoder(res.Body).Decode(&oAuthResponse)
	if err != nil {
		return nil, err
	}

	scopes := strings.Split(oAuthResponse.Scope, ",")
	hasUserEmailScope := false
	if utils.Contains("user:email", scopes) {
		hasUserEmailScope = true
	}

	req, err = http.NewRequest("GET", "https://api.github.com/user", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", oAuthResponse.AccessToken))
	res2, err := client.Do(req)
	if err != nil {
		logger.SysError("无法连接至 GitHub 服务器, err:" + err.Error())
		return nil, errors.New("无法连接至 GitHub 服务器，请稍后重试！")
	}
	defer res2.Body.Close()
	if res2.StatusCode != http.StatusOK {
		return nil, errors.New("无法连接至 GitHub 服务器，请稍后重试！")
	}

	var githubUser GitHubUser
	err = json.NewDecoder(res2.Body).Decode(&githubUser)
	if err != nil {
		return nil, err
	}
	if githubUser.Login == "" {
		return nil, errors.New("返回值非法，用户字段为空，请稍后重试！")
	}

	if hasUserEmailScope {
		req, err = http.NewRequest("GET", "https://api.github.com/user/emails", nil)
		if err != nil {
			return nil, err
		}
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", oAuthResponse.AccessToken))
		res3, err := client.Do(req)
		if err != nil {
			return nil, err
		}
		defer res3.Body.Close()
		if res3.StatusCode != http.StatusOK {
			return nil, errors.New("无法连接至 GitHub 服务器，请稍后重试！")
		}

		var githubEmails []*GithubEmail
		err = json.NewDecoder(res3.Body).Decode(&githubEmails)
		if err != nil {
			return nil, err
		}

		githubUser.Email = getGithubEmail(githubEmails)
	}

	return &githubUser, nil
}

func getGithubEmail(githubEmails []*GithubEmail) string {
	for _, email := range githubEmails {
		if email.Primary && email.Verified {
			return email.Email
		}
	}
	return ""
}

func getUserByGitHub(githubUser *GitHubUser) (user *model.User, err error) {
	// 优先检测 GitHubIdNew
	if model.IsGitHubIdNewAlreadyTaken(githubUser.Id) {
		user, err = model.FindUserByField("github_id_new", githubUser.Id)
		if err != nil {
			return nil, err
		}
	}

	// 如果 GitHubIdNew 不存在，并且没有关闭 GitHubOldId登录，则检测 GitHubId
	if user == nil && !config.GitHubOldIdCloseEnabled && model.IsGitHubIdAlreadyTaken(githubUser.Login) {
		user, err = model.FindUserByField("github_id", githubUser.Login)
		if err != nil {
			return nil, err
		}
	}

	// 如果 GitHubId 不存在，则检测 Email
	if user == nil && model.IsEmailAlreadyTaken(githubUser.Email) {
		user, err = model.FindUserByField("email", githubUser.Email)
		if err != nil {
			return nil, err
		}
	}

	return user, nil
}

func GitHubOAuth(c *gin.Context) {
	session := sessions.Default(c)
	state := c.Query("state")
	if state == "" || session.Get("oauth_state") == nil || state != session.Get("oauth_state").(string) {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "state is empty or not same",
		})
		return
	}
	username := session.Get("username")
	if username != nil {
		GitHubBind(c)
		return
	}

	if !config.GitHubOAuthEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "管理员未开启通过 GitHub 登录以及注册",
		})
		return
	}
	code := c.Query("code")
	affCode := c.Query("aff")

	githubUser, err := getGitHubUserInfoByCode(code)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	user, err := getUserByGitHub(githubUser)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// 如果用户不存在，则创建用户
	if user == nil {
		if !config.RegisterEnabled {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "管理员关闭了新用户注册",
			})
			return
		}

		user = &model.User{
			GitHubId:    githubUser.Login,
			GitHubIdNew: githubUser.Id,
			Email:       githubUser.Email,
			Role:        config.RoleCommonUser,
			Status:      config.UserStatusEnabled,
			AvatarUrl:   githubUser.AvatarUrl,
		}

		// 检测邀请码
		var inviterId int
		if affCode != "" {
			inviterId, _ = model.GetUserIdByAffCode(affCode)
		}

		if inviterId > 0 {
			user.InviterId = inviterId
		}

		user.Username = githubUser.Login
		if model.IsUsernameAlreadyTaken(user.Username) {
			user.Username = "github_" + strconv.Itoa(model.GetMaxUserId()+1)
		}

		if githubUser.Name != "" {
			user.DisplayName = githubUser.Name
		} else {
			user.DisplayName = user.Username
		}

		if err := user.Insert(inviterId); err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}

	} else {
		// 如果用户存在，则更新用户
		user.GitHubId = githubUser.Login
		user.GitHubIdNew = githubUser.Id

		// 如果用户的邮箱为空，且 GitHub 用户的邮箱不为空，且 GitHub 用户的邮箱未被注册，则更新用户的邮箱
		if user.Email == "" && githubUser.Email != "" && !model.IsEmailAlreadyTaken(githubUser.Email) {
			user.Email = githubUser.Email
		}

		// 如果用户的头像为空，则更新用户的头像
		if user.AvatarUrl == "" {
			user.AvatarUrl = githubUser.AvatarUrl
		}
	}

	if user.Status != config.UserStatusEnabled {
		c.JSON(http.StatusOK, gin.H{
			"message": "用户已被封禁",
			"success": false,
		})
		return
	}

	setupLogin(user, c)
}

func GitHubBind(c *gin.Context) {
	if !config.GitHubOAuthEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "管理员未开启通过 GitHub 登录以及注册",
		})
		return
	}
	code := c.Query("code")
	githubUser, err := getGitHubUserInfoByCode(code)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	user := model.User{
		GitHubId: githubUser.Login,
	}
	if model.IsGitHubIdAlreadyTaken(user.GitHubId) {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "该 GitHub 账户已被绑定",
		})
		return
	}
	session := sessions.Default(c)
	id := session.Get("id")
	// id := c.GetInt("id")  // critical bug!
	user.Id = id.(int)
	err = user.FillUserById()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	user.GitHubId = githubUser.Login
	user.GitHubIdNew = githubUser.Id

	if user.AvatarUrl == "" {
		user.AvatarUrl = githubUser.AvatarUrl
	}

	if user.Email == "" && githubUser.Email != "" && !model.IsEmailAlreadyTaken(githubUser.Email) {
		user.Email = githubUser.Email
	}

	err = user.Update(false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "bind",
	})
}

func GenerateOAuthCode(c *gin.Context) {
	session := sessions.Default(c)
	state := utils.GetRandomString(12)
	session.Set("oauth_state", state)
	err := session.Save()
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
		"data":    state,
	})
}
