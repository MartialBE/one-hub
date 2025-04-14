---
title: "环境变量"
layout: doc
outline: deep
lastUpdated: true
---

# 环境变量

::: warning 注意
环境变量优先级高于配置文件。
:::

本页面可能未及时更新，具体值可参考 [配置文件](https://raw.githubusercontent.com/MartialBE/one-hub/refs/heads/main/config.example.yaml)。

## 配置文件转环境变量

将配置文件中的变量名全部大写，遇到子集用下划线连接，例如：

```yaml
# 配置文件
user_token_secret: "your-secret-key"
logs:
  filename: "one-hub.log" # 日志文件名
```

转换为环境变量：

```bash
USER_TOKEN_SECRET="your-secret-key"
LOGS_FILENAME="one-hub.log"
```

## 环境变量说明

1. `REDIS_CONN_STRING`：设置之后将使用 Redis 作为缓存使用。
   - 例子：`REDIS_CONN_STRING=redis://default:redispw@localhost:49153`
   - 如果数据库访问延迟很低，没有必要启用 Redis，启用后反而会出现数据滞后的问题。
2. `SESSION_SECRET`：设置之后将使用固定的会话密钥，这样系统重新启动后已登录用户的 cookie 将依旧有效。
   - 例子：`SESSION_SECRET=random_string`
3. `SQL_DSN`：设置之后将使用指定数据库而非 SQLite，请使用 MySQL 或 PostgreSQL。
   - 例子：
     - MySQL：`SQL_DSN=root:123456@tcp(localhost:3306)/oneapi`
     - PostgreSQL：`SQL_DSN=postgres://postgres:123456@localhost:5432/oneapi`（适配中，欢迎反馈）
   - 注意需要提前建立数据库 `oneapi`，无需手动建表，程序将自动建表。
   - 如果使用本地数据库：部署命令可添加 `--network="host"` 以使得容器内的程序可以访问到宿主机上的 MySQL。
   - 如果使用云数据库：如果云服务器需要验证身份，需要在连接参数中添加 `?tls=skip-verify`。
   - 请根据你的数据库配置修改下列参数（或者保持默认值）：
     - `SQL_MAX_IDLE_CONNS`：最大空闲连接数，默认为 `100`。
     - `SQL_MAX_OPEN_CONNS`：最大打开连接数，默认为 `1000`。
       - 如果报错 `Error 1040: Too many connections`，请适当减小该值。
     - `SQL_CONN_MAX_LIFETIME`：连接的最大生命周期，默认为 `60`，单位分钟。
4. `FRONTEND_BASE_URL`：设置之后将重定向页面请求到指定的地址，仅限从服务器设置。
   - 例子：`FRONTEND_BASE_URL=https://openai.justsong.cn`
5. `MEMORY_CACHE_ENABLED`：启用内存缓存，会导致用户额度的更新存在一定的延迟，可选值为 `true` 和 `false`，未设置则默认为 `false`。
   - 例子：`MEMORY_CACHE_ENABLED=true`
6. `SYNC_FREQUENCY`：在启用缓存的情况下与数据库同步配置的频率，单位为秒，默认为 `600` 秒。
   - 例子：`SYNC_FREQUENCY=60`
7. `NODE_TYPE`：设置之后将指定节点类型，可选值为 `master` 和 `slave`，未设置则默认为 `master`。
   - 例子：`NODE_TYPE=slave`
8. `CHANNEL_UPDATE_FREQUENCY`：设置之后将定期更新渠道余额，单位为分钟，未设置则不进行更新。
   - 例子：`CHANNEL_UPDATE_FREQUENCY=1440`
9. `CHANNEL_TEST_FREQUENCY`：设置之后将定期检查渠道，单位为分钟，未设置则不进行检查。
   - 例子：`CHANNEL_TEST_FREQUENCY=1440`
10. `POLLING_INTERVAL`：批量更新渠道余额以及测试可用性时的请求间隔，单位为秒，默认无间隔。
    - 例子：`POLLING_INTERVAL=5`
11. `BATCH_UPDATE_ENABLED`：启用数据库批量更新聚合，会导致用户额度的更新存在一定的延迟可选值为 `true` 和 `false`，未设置则默认为 `false`。
    - 例子：`BATCH_UPDATE_ENABLED=true`
    - 如果你遇到了数据库连接数过多的问题，可以尝试启用该选项。
12. `BATCH_UPDATE_INTERVAL=5`：批量更新聚合的时间间隔，单位为秒，默认为 `5`。
    - 例子：`BATCH_UPDATE_INTERVAL=5`
13. 请求频率限制：
    - `GLOBAL_API_RATE_LIMIT`：全局 API 速率限制（除中继请求外），单 ip 三分钟内的最大请求数，默认为 `180`。
    - `GLOBAL_WEB_RATE_LIMIT`：全局 Web 速率限制，单 ip 三分钟内的最大请求数，默认为 `60`。
14. 编码器缓存设置：
    - `TIKTOKEN_CACHE_DIR`：默认程序启动时会联网下载一些通用的词元的编码，如：`gpt-3.5-turbo`，在一些网络环境不稳定，或者离线情况，可能会导致启动有问题，可以配置此目录缓存数据，可迁移到离线环境。
    - `DATA_GYM_CACHE_DIR`：目前该配置作用与 `TIKTOKEN_CACHE_DIR` 一致，但是优先级没有它高。
15. `RELAY_TIMEOUT`：中继超时设置，单位为秒，默认不设置超时时间。
16. `SQLITE_BUSY_TIMEOUT`：SQLite 锁等待超时设置，单位为毫秒，默认 `3000`。
17. `TG_BOT_API_KEY`： 你的 Telegram bot 的 API 密钥。你可以在 [BotFather](https://t.me/BotFather) 获取这个密钥。
18. `TG_WEBHOOK_SECRET`：（可选）你的 webhook 密钥。你可以自定义这个密钥。如果设置了这个密钥，将使用`webhook`的方式接收消息，否则使用轮询（Polling）的方式。
19. `USER_TOKEN_SECRET` ： 设置用户令牌签名密钥，必填，大于 32 位以上， 设置后请勿修改，否则会导致用户令牌失效。
20. `HASHIDS_SALT` ：Sqids 字母表，用于混淆用户令牌信息， 可空，如为空则使用默认字母表`abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`，如设置，则需要保证字母表中无重复字符。
21. `AUTO_PRICE_UPDATES`：自动更新价格，可选值为 `true` 和 `false`，未设置则默认为 `false`。开启后每次启动程序时，会检测数据库中的数据和程序中默认模型价格，如果数据库中的模型价格有缺失将会自动同步到数据库中。 开启带来的问题：你删不掉程序默认的模型价格，删除后，重启又回来了，这个选项适合跟官网一致价格的用户使用。
22. `AUTO_PRICE_UPDATES_MODE`：价格更新模式，可选值为 `add`:仅增加系统不存在的价格   `overwrite`：覆盖系统所有价格配置  `update`：仅仅更新现有数据   `system`:使用程序内置价格表配置初始化价格配置，默认为 `system`。建议生成环境使用`system`模式，手动去web的价格管理模块手动获取价格更新服务器数据并一一核对更新。
23. `AUTO_PRICE_UPDATES_INTERVAL` ：价格自动更新时间，单位分钟，仅`AUTO_PRICE_UPDATES_MODE`为`add`、`overwrite`时生效，系统将按照此时间周期性从价格更新服务器获取价格配置并更新系统价格。默认值：1440
24. `UPDATE_PRICE_SERVICE` ：设置之后将使用指定的价格服务更新价格。不设置则使用系统默认价格服务`https://raw.githubusercontent.com/MartialBE/one-api/prices/prices.json`

