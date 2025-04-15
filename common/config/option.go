package config

import (
	"strconv"
	"sync"
)

// OptionHandler 定义配置项处理器接口
type OptionHandler interface {
	// SetValue 设置配置值
	SetValue(value string) error
	// GetValue 获取配置字符串值
	GetValue() string
}

// OptionManager 配置管理器
type OptionManager struct {
	handlers map[string]OptionHandler
	mutex    *sync.RWMutex
}

var GlobalOption = NewOptionManager()

// NewOptionManager 创建配置管理器实例
func NewOptionManager() *OptionManager {
	return &OptionManager{
		handlers: make(map[string]OptionHandler),
		mutex:    &sync.RWMutex{},
	}
}

// Register 注册配置项
func (cm *OptionManager) Register(key string, handler OptionHandler, defaultValue string) {
	cm.mutex.Lock()
	defer cm.mutex.Unlock()
	cm.handlers[key] = handler

	// 设置默认值
	if defaultValue != "" {
		handler.SetValue(defaultValue)
	}
}

// RegisterString 快速注册字符串配置
func (cm *OptionManager) RegisterString(key string, value *string) {
	cm.Register(key, &StringOptionHandler{
		value: value,
	}, "")
}

// RegisterBool 快速注册布尔配置
func (cm *OptionManager) RegisterBool(key string, value *bool) {
	cm.Register(key, &BoolOptionHandler{
		value: value,
	}, "")
}

// RegisterInt 快速注册整数配置
func (cm *OptionManager) RegisterInt(key string, value *int) {
	cm.Register(key, &IntOptionHandler{
		value: value,
	}, "")
}

// RegisterFloat 快速注册浮点数配置
func (cm *OptionManager) RegisterFloat(key string, value *float64) {
	cm.Register(key, &FloatOptionHandler{
		value: value,
	}, "")
}

// RegisterCustom 注册自定义处理函数的配置
func (cm *OptionManager) RegisterCustom(key string, getter func() string, setter func(string) error, defaultValue string) {
	cm.Register(key, &CustomOptionHandler{
		getter: getter,
		setter: setter,
	}, defaultValue)
}

// RegisterValue 注册一个值类型的配置项
func (cm *OptionManager) RegisterValue(key string) {
	cm.Register(key, &ValueOptionHandler{
		value: "",
	}, "")
}

// Get 获取配置值(字符串)
func (cm *OptionManager) Get(key string) string {
	cm.mutex.RLock()
	defer cm.mutex.RUnlock()

	handler, exists := cm.handlers[key]
	if !exists {
		return ""
	}
	return handler.GetValue()
}

// Set 设置配置值
func (cm *OptionManager) Set(key string, value string) error {
	handler, exists := cm.getHandler(key)
	if !exists {
		return nil
	}

	return handler.SetValue(value)
}

// 获取处理器
func (cm *OptionManager) getHandler(key string) (OptionHandler, bool) {
	cm.mutex.RLock()
	defer cm.mutex.RUnlock()

	handler, exists := cm.handlers[key]
	return handler, exists
}

func (cm *OptionManager) GetAll() map[string]string {
	cm.mutex.RLock()
	defer cm.mutex.RUnlock()

	all := make(map[string]string)
	for k, v := range cm.handlers {
		all[k] = v.GetValue()
	}
	return all
}

// 以下是各种配置处理器的实现
type StringOptionHandler struct {
	value *string
}

func (h *StringOptionHandler) SetValue(value string) error {
	*h.value = value
	return nil
}

func (h *StringOptionHandler) GetValue() string {
	return *h.value
}

type BoolOptionHandler struct {
	value *bool
}

func (h *BoolOptionHandler) SetValue(value string) error {
	*h.value = value == "true"
	return nil
}

func (h *BoolOptionHandler) GetValue() string {
	if *h.value {
		return "true"
	}
	return "false"
}

type IntOptionHandler struct {
	value *int
}

func (h *IntOptionHandler) SetValue(value string) error {
	val, err := strconv.Atoi(value)
	if err != nil {
		return err
	}
	*h.value = val
	return nil
}

func (h *IntOptionHandler) GetValue() string {
	return strconv.Itoa(*h.value)
}

type FloatOptionHandler struct {
	value *float64
}

func (h *FloatOptionHandler) SetValue(value string) error {
	val, err := strconv.ParseFloat(value, 64)
	if err != nil {
		return err
	}
	*h.value = val
	return nil
}

func (h *FloatOptionHandler) GetValue() string {
	return strconv.FormatFloat(*h.value, 'f', -1, 64)
}

type CustomOptionHandler struct {
	getter func() string
	setter func(string) error
}

func (h *CustomOptionHandler) SetValue(value string) error {
	return h.setter(value)
}

func (h *CustomOptionHandler) GetValue() string {
	return h.getter()
}

// ValueOptionHandler 用于存储非全局变量的字符串值
type ValueOptionHandler struct {
	value string
}

func (h *ValueOptionHandler) SetValue(value string) error {
	h.value = value
	return nil
}

func (h *ValueOptionHandler) GetValue() string {
	return h.value
}
