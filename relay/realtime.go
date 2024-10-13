package relay

import (
	"fmt"
	"net/http"
	"one-api/common"
	"one-api/common/config"
	"one-api/common/logger"
	"one-api/common/requester"
	"one-api/common/utils"
	"one-api/metrics"
	providersBase "one-api/providers/base"
	"one-api/relay/relay_util"
	"one-api/types"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type RelayModeChatRealtime struct {
	relayBase
	userConn       *websocket.Conn
	messageHandler requester.MessageHandler
	providerConn   *websocket.Conn
	quota          *relay_util.Quota
	usage          *types.UsageEvent
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
	Subprotocols: []string{"realtime"},
}

func ChatRealtime(c *gin.Context) {
	modelName := c.Query("model")
	if modelName == "" {
		common.AbortWithMessage(c, http.StatusBadRequest, "model_name_required")
		return
	}

	userConn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		fmt.Println("upgrade failed", err)
		common.AbortWithMessage(c, http.StatusInternalServerError, "upgrade_failed")
		return
	}

	relay := &RelayModeChatRealtime{
		relayBase: relayBase{
			c: c,
		},
		userConn: userConn,
	}
	relay.originalModel = modelName

	if !relay.getProvider() {
		return
	}

	relay.quota = relay_util.NewQuota(relay.getContext(), relay.getModelName(), 0)

	relay.usage = &types.UsageEvent{}

	wsProxy := requester.NewWSProxy(relay.userConn, relay.providerConn, time.Minute*1, relay.messageHandler, relay.usageHandler)

	wsProxy.Start()

	go func() {
		var closedBy string
		select {
		case <-wsProxy.UserClosed():
			closedBy = "user"
		case <-wsProxy.SupplierClosed():
			closedBy = "provider"
		}

		logger.LogInfo(relay.c.Request.Context(), fmt.Sprintf("连接由%s关闭", closedBy))
		wsProxy.Close()
		relay.quota.Consume(relay.c, relay.usage.ToChatUsage(), false)

	}()

	wsProxy.Wait()
}

func (r *RelayModeChatRealtime) abortWithMessage(message string) {
	eventErr := types.NewErrorEvent("", "system_error", "system_error", message)

	r.userConn.WriteMessage(websocket.TextMessage, []byte(eventErr.Error()))
	r.userConn.Close()
}

func (r *RelayModeChatRealtime) getProvider() bool {
	retryTimes := config.RetryTimes
	if retryTimes == 0 {
		retryTimes = 1
	}

	for i := retryTimes; i > 0; i-- {
		// 找不到直接返回
		if err := r.setProvider(r.getOriginalModel()); err != nil {
			r.abortWithMessage(err.Error())
			return false
		}

		realtimeProvider, ok := r.provider.(providersBase.RealtimeInterface)
		if !ok {
			r.abortWithMessage("channel not implemented")
			return false
		}
		channel := r.provider.GetChannel()

		providerConn, messageHandler, apiErr := realtimeProvider.CreateChatRealtime(r.modelName)
		if apiErr != nil {
			r.skipChannelIds(channel.Id)
			logger.LogError(r.c.Request.Context(), fmt.Sprintf("using channel #%d(%s) Error: %s to retry (remain times %d)", channel.Id, channel.Name, apiErr.Error(), i))
			metrics.RecordProvider(r.c, apiErr.StatusCode)

			continue
		}

		r.messageHandler = messageHandler
		r.providerConn = providerConn

		if r.getRealtimeFirstMessage() {
			return true
		}

		r.skipChannelIds(channel.Id)
	}

	r.abortWithMessage("get provider failed")
	return false
}

func (r *RelayModeChatRealtime) skipChannelIds(channelId int) {
	skipChannelIds, ok := utils.GetGinValue[[]int](r.c, "skip_channel_ids")
	if !ok {
		skipChannelIds = make([]int, 0)
	}

	skipChannelIds = append(skipChannelIds, channelId)

	r.c.Set("skip_channel_ids", skipChannelIds)
}

func (r *RelayModeChatRealtime) getRealtimeFirstMessage() bool {
	messageType, firstMessage, err := r.providerConn.ReadMessage()
	if err != nil {
		return false
	}

	if messageType != websocket.TextMessage {
		return false
	}

	shouldContinue, _, newMessage, err := r.messageHandler(requester.SupplierMessage, messageType, firstMessage)

	if !shouldContinue || err != nil {
		return false
	}

	if newMessage != nil {
		r.userConn.WriteMessage(websocket.TextMessage, newMessage)
	} else {
		r.userConn.WriteMessage(websocket.TextMessage, firstMessage)
	}

	return true
}

func (r *RelayModeChatRealtime) usageHandler(usage *types.UsageEvent) error {
	err := r.quota.UpdateUserRealtimeQuota(r.usage, usage)
	if err != nil {
		return types.NewErrorEvent("", "system_error", "system_error", err.Error())
	}

	return nil
}
