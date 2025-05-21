---
title: "特殊用法"
layout: doc
outline: deep
lastUpdated: true
---

# 特殊用法

## o1 / o3-mini / o1-mini 快速切换 ReasoningEffort

在请求时，将模型名称后面添加 `#low`/`#medium`/`#high` 可以快速切换 ReasoningEffort 参数。
例如：

```bash
curl -X POST https://api.onehub.cn/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-proj-1234567890" \
  -d '{
    "model": "o1-mini#low",
    "messages": [{"role": "user", "content": "你好"}]
  }'
```

## Claude 3.7 模型开启 thinking

在请求时，将模型名称后面添加 `#thinking` 可以开启 thinking 模式。
例如：

```bash
curl -X POST https://api.onehub.cn/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-proj-1234567890" \
  -d '{
    "model": "claude-3-7-sonnet-20250219#thinking",
    "messages": [{"role": "user", "content": "你好"}]
  }'
```

## Gemini 模型 开启联网搜索

在请求时，增加 `tools` 参数，并设置 `name` 为 `googleSearch` 即可开启联网搜索。

```bash
curl -X POST https://api.onehub.cn/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-proj-1234567890" \
  -d '{
    "model": "gemini-1.5-flash-002",
    "messages": [{"role": "user", "content": "今天有什么新闻"}],
    "tools": [
		{
			"function": {
				"name": "googleSearch",
				"parameters": {}
			},
			"type": "function"
		}
	]
  }'
```

## Gemini 模型 开启代码执行

在请求时，增加 `tools` 参数，并设置 `name` 为 `codeExecution` 即可开启代码执行。

```bash
curl -X POST https://api.onehub.cn/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-proj-1234567890" \
  -d '{
    "model": "gemini-1.5-flash-002",
    "messages": [{"role": "user", "content": "计算2的7次方"}],
    "tools": [
		{
			"function": {
				"name": "codeExecution",
				"parameters": {}
			},
			"type": "function"
		}
	]
  }'
```

## Gemini 模型 开启网页上下文提取

在请求时，增加 `tools` 参数，并设置 `name` 为 `urlContext` 即可开启代码执行。

```bash
curl -X POST https://api.onehub.cn/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-proj-1234567890" \
  -d '{
    "model": "gemini-1.5-flash-002",
    "messages": [{"role": "user", "content": "解析这个url的内容，https://github.com/MartialBE/one-hub"}],
    "tools": [
		{
			"function": {
				"name": "urlContext",
				"parameters": {}
			},
			"type": "function"
		}
	]
  }'
```
