package openai

import (
	"encoding/json"
	"fmt"
	"net/http"
	"one-api/common"
	"one-api/common/config"
	"one-api/common/logger"
	"one-api/common/requester"
	"one-api/types"

	"github.com/gorilla/websocket"
)

func (p *OpenAIProvider) CreateChatRealtime(modelName string) (*websocket.Conn, requester.MessageHandler, *types.OpenAIErrorWithStatusCode) {
	url, errWithCode := p.GetSupportedAPIUri(config.RelayModeChatRealtime)
	if errWithCode != nil {
		return nil, nil, errWithCode
	}
	// 获取请求地址
	fullRequestURL := p.GetFullRequestURL(url, modelName)

	// 获取请求头
	httpHeaders := make(http.Header)
	if p.IsAzure {
		httpHeaders.Set("api-key", p.Channel.Key)
	} else {
		httpHeaders.Set("Authorization", fmt.Sprintf("Bearer %s", p.Channel.Key))
	}
	httpHeaders.Set("OpenAI-Beta", "realtime=v1")

	wsRequester := requester.NewWSRequester(*p.Channel.Proxy)

	wsConn, err := wsRequester.NewRequest(fullRequestURL, httpHeaders)
	if err != nil {
		return nil, nil, common.ErrorWrapper(err, "ws_request_failed", http.StatusInternalServerError)
	}

	return wsConn, p.HandleMessage, nil
}

func (p *OpenAIProvider) HandleMessage(source requester.MessageSource, messageType int, message []byte) (bool, *types.UsageEvent, []byte, error) {
	// 处理用户消息
	if source == requester.UserMessage {
		return true, nil, nil, nil
	}

	// 确保消息类型为文本
	if messageType != websocket.TextMessage {
		return true, nil, nil, nil
	}

	// 解析事件
	var event types.Event
	if err := json.Unmarshal(message, &event); err != nil {
		return true, nil, nil, types.NewErrorEvent("", "json_unmarshal_failed", "invalid_event", err.Error())
	}

	// 处理错误事件
	if event.IsError() {
		logger.SysError("event error: " + event.Error())
		return false, nil, nil, &event
	}

	// 处理响应完成事件
	if event.Type == types.EventTypeResponseDone {
		return true, event.Response.Usage, nil, nil
	}

	// 处理其他事件类型
	return true, nil, nil, nil
}
