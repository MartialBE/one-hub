---
title: "部署说明"
layout: doc
outline: deep
lastUpdated: true
---

# 部署说明

## 配置说明

系统支持两种配置方式：

1. 环境变量
2. 配置文件 (config.yaml)

::: tip 配置优先级
环境变量 > 配置文件
:::

### 必要配置

- `USER_TOKEN_SECRET`: 必填，用于生成用户令牌的密钥
- `SESSION_SECRET`: 推荐填写，用于保持用户登录状态，如果不设置，每次重启后已登录用户需要重新登录

## Docker 部署

### 准备工作

1. 创建数据目录：

```bash
# 创建主数据目录
sudo mkdir -p /data/one-hub
cd /data/one-hub
```

2. 确保 Docker 已正确安装并启动：

```bash
# 检查 Docker 状态
sudo systemctl status docker
# 如果未启动，则启动 Docker
sudo systemctl start docker
```

::: warning 注意

- `-p 3000:3000` 中的第一个 `3000` 是宿主机的端口，可以根据需要进行修改。
- 数据和日志将会保存在宿主机的 `/data/one-hub` 目录，请确保该目录存在且具有写入权限，或者更改为合适的目录。
- 如果启动失败，请添加 `--privileged=true`，具体参考 [issue #482](https://github.com/songquanpeng/one-api/issues/482)。
- 如果你的并发量较大，**务必**设置 `SQL_DSN`。
  :::

### 使用环境变量部署

更多环境变量说明请参考 [环境变量](./env.md)。

#### 使用 SQLite

```shell
docker run -d -p 3000:3000 \
  --name one-hub \
  --restart always \
  -e TZ=Asia/Shanghai \
  -e USER_TOKEN_SECRET="user_token_secret" \
  -e SESSION_SECRET="session_secret" \
  -v /data/one-hub:/data \
  ghcr.io/martialbe/one-api
```

#### 使用 MySQL

在 SQLite 的基础上，添加 `-e SQL_DSN="root:123456@tcp(localhost:3306)/oneapi"`。请根据实际情况修改数据库连接参数。

```shell
docker run -d -p 3000:3000 \
  --name one-hub \
  --restart always \
  -e TZ=Asia/Shanghai \
  -e USER_TOKEN_SECRET="user_token_secret" \
  -e SESSION_SECRET="session_secret" \
  -e SQL_DSN="root:123456@tcp(localhost:3306)/oneapi" \
  -v /data/one-hub:/data \
  ghcr.io/martialbe/one-api

```

#### 使用 PostgreSQL

```shell
docker run -d -p 3000:3000 \
  --name one-hub \
  --restart always \
  -e TZ=Asia/Shanghai \
  -e USER_TOKEN_SECRET="user_token_secret" \
  -e SESSION_SECRET="session_secret" \
  -e SQL_DSN="postgres://postgres:123456@localhost:5432/oneapi" \
  -v /data/one-hub:/data \
  ghcr.io/martialbe/one-api
```

部署完毕后，访问 `http://localhost:3000` 即可。

### 使用配置文件部署

1. 下载配置文件模板：

```bash
cd /data/one-hub
wget https://raw.githubusercontent.com/MartialBE/one-hub/refs/heads/main/config.example.yaml -O config.yaml
```

2. 根据需要修改配置文件内容，常用配置项包括：

```yaml
# 必要配置
user_token_secret: "your-secret-key" # 用户令牌密钥
session_secret: "your-session-secret" # 会话密钥

# 数据库配置
sql_dsn: "root:123456@tcp(localhost:3306)/oneapi" # MySQL配置示例
```

3. 运行容器

```shell
docker run -d -p 3000:3000 \
  --name one-hub \
  --restart always \
  -e TZ=Asia/Shanghai \
  -v /data/one-hub:/data \
  ghcr.io/martialbe/one-api
```

## Docker Compose 部署

### 准备工作

1. 创建必要的目录结构：

```bash
# 创建主目录
sudo mkdir -p /data/one-hub
cd /data/one-hub
# 创建子目录
mkdir data
```

2. 下载配置文件：

```bash
# 下载 docker-compose 配置文件
wget https://raw.githubusercontent.com/MartialBE/one-api/main/docker-compose.yml


```

3. 编辑 `docker-compose.yml` 文件，修改环境变量值。

如果使用配置文件，执行下面命令，并删除 `docker-compose.yml` 文件中的 `SQL_DSN`/`REDIS_CONN_STRING`/`SESSION_SECRET` / `USER_TOKEN_SECRET` 参数：

```shell
# 下载应用配置文件模板
wget https://raw.githubusercontent.com/MartialBE/one-api/main/config.example.yaml -O ./data/config.yaml
```

### 启动服务

```shell
docker-compose up -d
```

启动服务后，你可以通过运行以下命令来查看部署状态：

```shell
docker-compose ps
```

请确保所有的服务都已经成功启动，并且状态为 'Up'。

部署完毕后，访问 `http://localhost:3000` 即可。

## 手动部署

1. **获取源码**：从 [GitHub Releases](https://github.com/MartialBE/one-hub/releases/latest) 下载最新的可执行文件，或者直接从源码编译。如果你选择编译源码，可以使用以下命令：

   ```shell
   git clone https://github.com/MartialBE/one-hub.git
   ```

2. **构建**：进入代码目录，构建：

   ```shell
   cd one-hub
   make
   ```

3. **运行应用**：为构建的应用添加执行权限，并运行：

   ```shell
   chmod u+x one-api
   ./one-api --port 3000 --log-dir ./logs
   ```

4. **访问应用**：在浏览器中访问 `http://localhost:3000` 并登录。初始账号用户名为 `root`，密码为 `123456`。

5. **重新编译**：如果需要重新编译，可以使用以下命令：

   ```shell
   make clean
   make
   ```

请确保在执行以上步骤时，你的环境已经安装了必要的工具，如 Git、Node.js、yarn 和 Go。

## 多机部署

### 准备工作

1. 确保所有服务器都安装了必要的组件：

- Docker 或 手动部署所需的组件
- Redis（如果需要使用缓存）
- MySQL 客户端（如果使用远程 MySQL）

2. 网络配置：

- 确保所有服务器能够访问主数据库
- 如果使用 Redis，确保可以访问 Redis 服务器
- 检查服务器间的防火墙设置

1. 所有服务器 `SESSION_SECRET` 设置一样的值。
2. 必须设置 `SQL_DSN`，使用 MySQL 数据库而非 SQLite，所有服务器连接同一个数据库。
3. 所有从服务器必须设置 `NODE_TYPE` 为 `slave`，不设置则默认为主服务器。
4. 设置 `SYNC_FREQUENCY` 后服务器将定期从数据库同步配置，在使用远程数据库的情况下，推荐设置该项并启用 Redis，无论主从。
5. 从服务器可以选择设置 `FRONTEND_BASE_URL`，以重定向页面请求到主服务器。
6. 从服务器上**分别**装好 Redis，设置好 `REDIS_CONN_STRING`，这样可以做到在缓存未过期的情况下数据库零访问，可以减少延迟。
7. 如果主服务器访问数据库延迟也比较高，则也需要启用 Redis，并设置 `SYNC_FREQUENCY`，以定期从数据库同步配置。
