package channel

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"one-api/common/requester"
	"one-api/types"
	"strings"
)

var warningStrs = []string{"已被禁用"}

type weComMarkdownMessage struct {
	Content string `json:"content"`
}

type weComMessage struct {
	MsgType  string               `json:"msgtype"`
	Markdown weComMarkdownMessage `json:"markdown"`
}

type weComResponse struct {
	ErrorCode    int    `json:"errcode,omitempty"`
	ErrorMessage string `json:"errmsg,omitempty"`
}

type WeCom struct {
	Webhook string
}

func (w *WeCom) Name() string {
	return "WeCom"
}

func (w *WeCom) Send(c context.Context, title, message string) error {
	// match color
	color := "info"
	for _, warningStr := range warningStrs {
		if strings.Contains(title, warningStr) {
			color = "warning"
			break
		}
	}

	// init req data
	msg := weComMessage{
		MsgType: "markdown",
		Markdown: weComMarkdownMessage{
			Content: fmt.Sprintf("## <font color=\"%s\">%s</font>\n   \n%s", color, title, message),
		},
	}

	// init client
	client := requester.NewHTTPRequester("", weComErrFunc)
	client.Context = c
	client.IsOpenAI = false

	// init req
	req, err := client.NewRequest(http.MethodPost, w.Webhook, client.WithHeader(requester.GetJsonHeaders()), client.WithBody(msg))
	if err != nil {
		return err
	}

	// request
	respMsg := &weComResponse{}
	if _, err := client.SendRequest(req, respMsg, false); err != nil {
		return fmt.Errorf("%s", err.Message)
	} else if respMsg.ErrorCode != 0 {
		return fmt.Errorf("send wecom msg err: %s", respMsg.ErrorMessage)
	}

	return nil
}

func NewWeCom(webhook string) *WeCom {
	return &WeCom{Webhook: webhook}
}

func weComErrFunc(resp *http.Response) *types.OpenAIError {
	respMsg := &weComResponse{}
	if err := json.NewDecoder(resp.Body).Decode(respMsg); err != nil {
		return &types.OpenAIError{
			Message: fmt.Sprintf("send wecom msg err: %s", err),
			Type:    "unknown_error",
		}
	}
	if respMsg.ErrorCode == 0 {
		return nil
	}
	return &types.OpenAIError{
		Message: fmt.Sprintf("send wecom msg err: %s", respMsg.ErrorMessage),
		Type:    "wecom_error",
	}
}
