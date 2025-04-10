---
title: "消息通知"
layout: doc
outline: deep
lastUpdated: true
---

# 消息通知

当渠道被禁用时，系统会发送通知。

## 配置文件配置

请在 config.yaml 中填写以下字段内容，不开启保持为空即可

```yaml
notify: # 通知设置, 配置了几个通知方式，就会同时发送几次通知 如果不需要通知，可以删除这个配置
  email: # 邮件通知 (具体stmp配置在后台设置，默认开启状态，如需要关闭请在下面禁用)
    disable: false # 是否禁用邮件通知
    smtp_to: "" # 收件人地址 (可空，如果为空则使用超级管理员邮箱)
  dingTalk: # 钉钉机器人通知
    token: "" # webhook 地址最后一串字符
    secret: "" # 密钥 (secret/keyWord 二选一)
    keyWord: "" # 关键字 (secret/keyWord 二选一)
  lark: # 飞书机器人通知
    token: "" # webhook 地址最后一串字符
    secret: "" # 密钥 (secret/keyWord 二选一)
    keyWord: "" # 关键字 (secret/keyWord 二选一)
  pushdeer: # pushdeer 通知
    url: "https://api2.pushdeer.com" # pushdeer地址 (可空，如果自建需填写)
    pushkey: "" # pushkey
  telegram: # Telegram 通知
    bot_api_key: "" # 你的 Telegram bot 的 API 密钥
    chat_id: "" # 你的 Telegram chat_id
```

## 环境变量配置

### email 通知

- `NOTIFY_EMAIL_DISABLE` 是否禁用邮件通知, `true` 或者 `false`
- `NOTIFY_EMAIL_SMTP_TO` 收件人地址 (可空，如果为空则使用超级管理员邮箱)

### 钉钉通知

- `NOTIFY_DINGTALK_TOKEN` webhook 地址最后一串字符
- `NOTIFY_DINGTALK_SECRET` 密钥 (secret/keyWord 二选一)
- `NOTIFY_DINGTALK_KEYWORD` 关键字 (secret/keyWord 二选一)

### 飞书通知

- `NOTIFY_LARK_TOKEN` webhook 地址最后一串字符
- `NOTIFY_LARK_SECRET` 密钥 (secret/keyWord 二选一)
- `NOTIFY_LARK_KEYWORD` 关键字 (secret/keyWord 二选一)

### pushdeer 通知

- `NOTIFY_PUSHDEER_URL` pushdeer 地址 (可空，如果自建需填写)
- `NOTIFY_PUSHDEER_PUSHKEY` pushdeer 地址 (可空，如果自建需填写)

### telegram 通知

- `NOTIFY_TELEGRAM_BOT_API_KEY` 你的 Telegram bot 的 API 密钥
- `NOTIFY_TELEGRAM_CHAT_ID` 你的 Telegram chat_id
