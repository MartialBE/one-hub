---
title: "使用方法"
layout: doc
outline: deep
lastUpdated: true
---

# 使用方法

系统本身开箱即用。

你可以通过设置环境变量/命令行参数/配置文件进行配置。
如果你要使用配置文件，请下载[config.example.yaml](https://raw.githubusercontent.com/MartialBE/one-api/main/config.example.yaml)，重命名为`config.yaml`，放在程序同目录下。

等到系统启动后，使用 `root`(默认密码：123456) 登录系统并做进一步的配置。

## API 调用

在`渠道`页面中添加你的 API Key，之后在`令牌`页面中新增访问令牌。

之后就可以使用你的令牌访问 One Hub 了。

### OpenAI API

使用方式与 [OpenAI API](https://platform.openai.com/docs/api-reference/introduction) 一致。

你需要在各种用到 OpenAI API 的地方设置 API Base 为你的 One Hub 的部署地址，例如：`https://api.onehub.cn`，API Key 则为你在 One API 中生成的令牌。

::: warning 注意
具体的 API Base 的格式取决于你所使用的客户端，请尝试如下地址：

- `https://api.onehub.cn`
- `https://api.onehub.cn/v1`
- `https://api.onehub.cn/v1/chat/completions`
  :::

#### 使用示例

```bash
curl --request POST \
    --url https://api.onehub.cn/v1/chat/completions \
    --header 'Authorization: Bearer sk-替换为你的key' \
    -H "Content-Type: application/json" \
    --data '{
      "model": "gpt-4o-mini",
      "messages": [
          {
              "role": "user",
              "content": "hi~"
          }
      ]
  }'
```

### Claude API

使用方式与 [Claude API](https://docs.anthropic.com/en/api/messages) 一致。

你需要在各种用到 Claude API 的地方设置 API Base 为你的 One Hub 的部署地址，例如：`https://claude.xxxx.cn/claude`，API Key 则为你在 One API 中生成的令牌。

#### 使用示例

```bash
curl --request POST \
    --url https://api.onehub.cn/claude/v1/messages \
    -H "Content-Type: application/json" \
    -H "x-api-key: sk-替换为你的key" \
    --data '{
  "model": "claude-3-haiku-20240307",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "hi~"
    }
  ]
}'
```

### Gemini API

你需要在各种用到 Gemini API 的地方设置 API Base 为你的 One Hub 的部署地址，例如：`https://api.onehub.cn/gemini`，API Key 则为你在 One API 中生成的令牌。

#### 使用示例

```bash
curl --request POST \
  --url https://api.onehub.cn/gemini/v1alpha/models/gemini-2.0-pro-exp:generateContent \
  --header 'Content-Type: application/json' \
  --header 'x-goog-api-key: sk-替换为你的key' \
  --data '{
	"contents": [

		{
			"role": "user",
			"parts": [
				{
					"text": "hi~"
				}
			]
		}
	]
}'
```
