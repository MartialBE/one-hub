package requester

import (
	"time"

	"github.com/gorilla/websocket"

	"one-api/types"
)

type WSProxy struct {
	userConn       *websocket.Conn
	supplierConn   *websocket.Conn
	timeout        time.Duration
	handler        MessageHandler
	usageHandler   UsageHandler
	done           chan struct{}
	userClosed     chan struct{}
	supplierClosed chan struct{}
}

type MessageSource int

const (
	UserMessage MessageSource = iota
	SupplierMessage
)

type MessageHandler func(source MessageSource, messageType int, message []byte) (bool, *types.UsageEvent, []byte, error)
type UsageHandler func(usage *types.UsageEvent) error

func NewWSProxy(userConn, supplierConn *websocket.Conn, timeout time.Duration, handler MessageHandler, usageHandler UsageHandler) *WSProxy {
	return &WSProxy{
		userConn:       userConn,
		supplierConn:   supplierConn,
		timeout:        timeout,
		handler:        handler,
		usageHandler:   usageHandler,
		done:           make(chan struct{}),
		userClosed:     make(chan struct{}),
		supplierClosed: make(chan struct{}),
	}
}

func (p *WSProxy) Start() {
	go p.transfer(p.userConn, p.supplierConn, UserMessage, p.userClosed)
	go p.transfer(p.supplierConn, p.userConn, SupplierMessage, p.supplierClosed)
}

func (p *WSProxy) Wait() {
	<-p.done
}

func (p *WSProxy) Close() {
	p.userConn.Close()
	p.supplierConn.Close()
}

func (p *WSProxy) UserClosed() <-chan struct{} {
	return p.userClosed
}

func (p *WSProxy) SupplierClosed() <-chan struct{} {
	return p.supplierClosed
}

func (p *WSProxy) transfer(src, dst *websocket.Conn, source MessageSource, closed chan<- struct{}) {
	defer func() {
		close(closed)
		p.done <- struct{}{}
	}()

	inactivityTimer := time.NewTimer(p.timeout)
	defer inactivityTimer.Stop()

	for {
		src.SetReadDeadline(time.Now().Add(p.timeout))

		messageType, message, err := src.ReadMessage()
		if err != nil {
			return
		}

		if !inactivityTimer.Stop() {
			<-inactivityTimer.C
		}
		inactivityTimer.Reset(p.timeout)

		if p.handler != nil {
			shouldContinue, usage, newMessage, err := p.handler(source, messageType, message)
			if err != nil {
				errMsg := []byte(err.Error())
				dst.WriteMessage(websocket.TextMessage, errMsg)
				return
			}

			if !shouldContinue {
				return
			}

			if newMessage != nil {
				message = newMessage
			}

			if usage != nil && p.usageHandler != nil {
				err := p.usageHandler(usage)
				if err != nil {
					dst.WriteMessage(websocket.TextMessage, message)
					errMsg := []byte(err.Error())
					dst.WriteMessage(websocket.TextMessage, errMsg)
					return
				}
			}
		}

		err = dst.WriteMessage(messageType, message)
		if err != nil {
			return
		}
	}
}
