package controller

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"one-api/common/config"
	"one-api/common/logger"
	"one-api/common/notify"
	"one-api/common/utils"
	"one-api/model"
	"one-api/providers"
	providers_base "one-api/providers/base"
	"one-api/types"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

var (
	embeddingsRegex = regexp.MustCompile(`(?:^text-|embed|Embed|rerank|davinci|babbage|bge-|e5-|LLM2Vec|retrieval|uae-|gte-|jina-clip|jina-embeddings)`)
	imageRegex      = regexp.MustCompile(`flux|diffusion|stabilityai|sd-|dall|cogview|janus`)
	noSupportRegex  = regexp.MustCompile(`(?:^tts|rerank|whisper|speech|^mj_|^chirp)`)
)

func testChannel(channel *model.Channel, testModel string) (openaiErr *types.OpenAIErrorWithStatusCode, err error) {
	if testModel == "" {
		testModel = channel.TestModel
		if testModel == "" {
			return nil, errors.New("请填写测速模型后再试")
		}
	}

	channelType := getModelType(testModel)
	fmt.Println("channelType", channelType)
	var url string
	switch channelType {
	case "embeddings":
		url = "/v1/embeddings"
	case "image":
		url = "/v1/images/generations"
	case "chat":
		url = "/v1/chat/completions"
	default:
		return nil, errors.New("不支持的模型类型")
	}

	// 创建测试上下文
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	req, err := http.NewRequest("POST", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	// 获取并验证provider
	provider := providers.GetProvider(channel, c)
	if provider == nil {
		return nil, errors.New("channel not implemented")
	}

	newModelName, err := provider.ModelMappingHandler(testModel)
	if err != nil {
		return nil, err
	}

	usage := &types.Usage{}
	provider.SetUsage(usage)

	// 执行测试请求
	var response any
	var openAIErrorWithStatusCode *types.OpenAIErrorWithStatusCode

	switch channelType {
	case "embeddings":
		embeddingsProvider, ok := provider.(providers_base.EmbeddingsInterface)
		if !ok {
			return nil, errors.New("channel not implemented")
		}
		testRequest := &types.EmbeddingRequest{
			Model: newModelName,
			Input: "hi",
		}
		response, openAIErrorWithStatusCode = embeddingsProvider.CreateEmbeddings(testRequest)
	case "image":
		imageProvider, ok := provider.(providers_base.ImageGenerationsInterface)
		if !ok {
			return nil, errors.New("channel not implemented")
		}

		testRequest := &types.ImageRequest{
			Model:  newModelName,
			Prompt: "A cute cat",
			N:      1,
		}
		response, openAIErrorWithStatusCode = imageProvider.CreateImageGenerations(testRequest)
	case "chat":
		chatProvider, ok := provider.(providers_base.ChatInterface)
		if !ok {
			return nil, errors.New("channel not implemented")
		}
		testRequest := &types.ChatCompletionRequest{
			Messages: []types.ChatCompletionMessage{
				{
					Role:    "user",
					Content: "You just need to output 'hi' next.",
				},
			},
			Model:  newModelName,
			Stream: false,
		}

		if strings.HasPrefix(newModelName, "o1") || strings.HasPrefix(newModelName, "o3") {
			testRequest.MaxCompletionTokens = 10
		} else {
			testRequest.MaxTokens = 10
		}
		response, openAIErrorWithStatusCode = chatProvider.CreateChatCompletion(testRequest)
	default:
		return nil, errors.New("不支持的模型类型")
	}

	if openAIErrorWithStatusCode != nil {
		return openAIErrorWithStatusCode, errors.New(openAIErrorWithStatusCode.Message)
	}

	// 转换为JSON字符串
	jsonBytes, _ := json.Marshal(response)
	logger.SysLog(fmt.Sprintf("测试渠道 %s : %s 返回内容为：%s", channel.Name, newModelName, string(jsonBytes)))

	return nil, nil
}

func getModelType(modelName string) string {
	if noSupportRegex.MatchString(modelName) {
		return "noSupport"
	}

	if embeddingsRegex.MatchString(modelName) {
		return "embeddings"
	}

	if imageRegex.MatchString(modelName) {
		return "image"
	}

	return "chat"
}

func TestChannel(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	channel, err := model.GetChannelById(id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	testModel := c.Query("model")
	tik := time.Now()
	openaiErr, err := testChannel(channel, testModel)
	tok := time.Now()
	milliseconds := tok.Sub(tik).Milliseconds()
	consumedTime := float64(milliseconds) / 1000.0

	success := false
	msg := ""
	if openaiErr != nil {
		if ShouldDisableChannel(channel.Type, openaiErr) {
			msg = fmt.Sprintf("测速失败，已被禁用，原因：%s", err.Error())
			DisableChannel(channel.Id, channel.Name, err.Error(), false)
		} else {
			msg = fmt.Sprintf("测速失败，原因：%s", err.Error())
		}
	} else if err != nil {
		msg = fmt.Sprintf("测速失败，原因：%s", err.Error())
	} else {
		success = true
		msg = "测速成功"
		go channel.UpdateResponseTime(milliseconds)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": success,
		"message": msg,
		"time":    consumedTime,
	})
}

var testAllChannelsLock sync.Mutex
var testAllChannelsRunning bool = false

func testAllChannels(isNotify bool) error {
	testAllChannelsLock.Lock()
	if testAllChannelsRunning {
		testAllChannelsLock.Unlock()
		return errors.New("测试已在运行中")
	}
	testAllChannelsRunning = true
	testAllChannelsLock.Unlock()
	channels, err := model.GetAllChannels()
	if err != nil {
		return err
	}
	var disableThreshold = int64(config.ChannelDisableThreshold * 1000)
	if disableThreshold == 0 {
		disableThreshold = 10000000 // a impossible value
	}
	go func() {
		var sendMessage string
		for _, channel := range channels {
			time.Sleep(config.RequestInterval)

			isChannelEnabled := channel.Status == config.ChannelStatusEnabled
			sendMessage += fmt.Sprintf("**通道 %s - #%d - %s** : \n\n", utils.EscapeMarkdownText(channel.Name), channel.Id, channel.StatusToStr())
			tik := time.Now()
			openaiErr, err := testChannel(channel, "")
			tok := time.Now()
			milliseconds := tok.Sub(tik).Milliseconds()
			// 通道为禁用状态，并且还是请求错误 或者 响应时间超过阈值 直接跳过，也不需要更新响应时间。
			if !isChannelEnabled {
				if err != nil {
					sendMessage += fmt.Sprintf("- 测试报错: %s \n\n- 无需改变状态，跳过\n\n", utils.EscapeMarkdownText(err.Error()))
					continue
				}
				if milliseconds > disableThreshold {
					sendMessage += fmt.Sprintf("- 响应时间 %.2fs 超过阈值 %.2fs \n\n- 无需改变状态，跳过\n\n", float64(milliseconds)/1000.0, float64(disableThreshold)/1000.0)
					continue
				}
				// 如果已被禁用，但是请求成功，需要判断是否需要恢复
				// 手动禁用的通道，不会自动恢复
				if shouldEnableChannel(err, openaiErr) {
					if channel.Status == config.ChannelStatusAutoDisabled {
						EnableChannel(channel.Id, channel.Name, false)
						sendMessage += "- 已被启用 \n\n"
					} else {
						sendMessage += "- 手动禁用的通道，不会自动恢复 \n\n"
					}
				}
			} else {
				// 如果通道启用状态，但是返回了错误 或者 响应时间超过阈值，需要判断是否需要禁用
				if milliseconds > disableThreshold {
					errMsg := fmt.Sprintf("响应时间 %.2fs 超过阈值 %.2fs ", float64(milliseconds)/1000.0, float64(disableThreshold)/1000.0)
					sendMessage += fmt.Sprintf("- %s \n\n- 禁用\n\n", errMsg)
					DisableChannel(channel.Id, channel.Name, errMsg, false)
					continue
				}

				if ShouldDisableChannel(channel.Type, openaiErr) {
					sendMessage += fmt.Sprintf("- 已被禁用，原因：%s\n\n", utils.EscapeMarkdownText(err.Error()))
					DisableChannel(channel.Id, channel.Name, err.Error(), false)
					continue
				}

				if err != nil {
					sendMessage += fmt.Sprintf("- 测试报错: %s \n\n", utils.EscapeMarkdownText(err.Error()))
					continue
				}
			}
			channel.UpdateResponseTime(milliseconds)
			sendMessage += fmt.Sprintf("- 测试完成，耗时 %.2fs\n\n", float64(milliseconds)/1000.0)
		}
		testAllChannelsLock.Lock()
		testAllChannelsRunning = false
		testAllChannelsLock.Unlock()
		if isNotify {
			notify.Send("通道测试完成", sendMessage)
		}
	}()
	return nil
}

func TestAllChannels(c *gin.Context) {
	err := testAllChannels(true)
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

func AutomaticallyTestChannels(frequency int) {
	if frequency <= 0 {
		return
	}

	for {
		time.Sleep(time.Duration(frequency) * time.Minute)
		logger.SysLog("testing all channels")
		_ = testAllChannels(false)
		logger.SysLog("channel test finished")
	}
}
