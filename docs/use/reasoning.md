---
title: "推理设置"
layout: doc
outline: deep
lastUpdated: true
---

# 推理设置

本页面所有说明都应该在`OpenAI SDK`中使用。在`Claude` / `Gemini`原生 API 无效。

## Claude

### Claude 3.7 模型开启 thinking

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

### 自定义 Claude 3-7 模型推理参数

您可以使用以下参数控制请求中的推理标记 reasoning：

```json
{
  "model": "claude-3-7-sonnet-2025021",
  "messages": [],
  "reasoning": {
    "effort": "high", // 强度参数 (可选)
    "max_tokens": 2000 // 推理最大tokens，目前特指budget_tokens (可选)
  }
}
```

#### 开启推理

当您直接传入`"reasoning": {}`时， 效果和`claude-3-7-sonnet-20250219#thinking`一致，不需要再更改模型名称。

#### 强度参数

`effort` 参数可以设置为 `high`、`medium` 或 `low`。

- `high`：将分配`80%`的`max_tokens`作为`budget_tokens`。
- `medium`：将分配`50%`的`max_tokens`作为`budget_tokens`。
- `low`：将分配`20%`的`max_tokens`作为`budget_tokens`。

#### 推理最大 tokens

`reasoning.max_tokens` 参数可以设置为具体的数值，表示推理最大 tokens，目前特指 budget_tokens。

:::warning

`reasoning.max_tokens` 参数需要大于`max_tokens`,且不能低于`1024`。

:::

#### 优先级

如果同时在`reasoning`传入`effort`和`max_tokens`，优先级如下：

- `max_tokens` > `effort`

## Gemini

### 自定义 Gemini 模型推理参数

`Gemini`的推理参数和`Claude`不一样， 在`gemini 2.5`中是默认开启推理的，如果需要关闭则需要传入`reasoning`参数。

```json
{
  "model": "gemini-2.5-flash-preview-04-17",
  "messages": [],
  "reasoning": {
    "max_tokens": 2000 // 推理最大tokens，目前特指budget_tokens (可选)
  }
}
```

:::warning

`reasoning.max_tokens` 为 0 时关闭推理。
或者只传入`"reasoning": {}`时，默认关闭推理。

:::
