---
title: "升级"
layout: doc
outline: deep
lastUpdated: true
---

# 自动升级

### 宝塔用户

如果你是宝塔面板部署，可以很方便添加计划任务

添加计划任务-> Shell 脚本 -> 将以下内容粘贴进去即可。

使用 Docker Compose 部署的，记得修改`docker-compose.yml` 所在的目录

```
cd /www/wwwroot/
```

### 一般玩家

此脚本可以在 Crontab 中使用，但请确认你的 Crontab 可以找到正确的 Docker 命令。建议使用绝对路径。

配置 Crontab，每 5 分钟执行一次脚本：

```
*/5 * * * * /path/to/auto-update-lobe-chat.sh >> /path/to/auto-update-lobe-chat.log 2>&1
```

### Docker Compose 脚本

```sh
# 拉取最新镜像，并将输出存储在变量中
output=$(docker pull martialbe/one-api:latest 2>&1)

# 检查拉取命令是否成功执行
if [ $? -ne 0 ]; then
exit 1
fi

# 检查输出中是否包含特定字符串
echo "$output" | grep -q "Image is up to date for martialbe/one-api:latest"

# 如果镜像已经是最新的，则不执行任何操作
if [ $? -eq 0 ]; then
exit 0
fi

echo "检测到 one-api 更新"

# 移除旧的容器
echo "已移除: $(docker rm -f one-api)"

# 你需要首先导航到 `docker-compose.yml` 所在的目录
cd /www/wwwroot/

# 运行新的容器
echo "已启动: $(docker-compose up)"

# 打印更新时间和版本
echo "更新时间: $(date)"
echo "版本: $(docker inspect martialbe/one-api:latest | grep 'org.opencontainers.image.version' | awk -F'"' '{print $4}')"

# 清理未使用的镜像
docker images | grep 'martialbe/one-api' | grep -v 'latest' | awk '{print $3}' | xargs -r docker rmi > /dev/null 2>&1
echo "已移除旧的镜像."
```

### Docker 命令方式 脚本

```sh
# 拉取最新镜像，并将输出存储在变量中
output=$(docker pull martialbe/one-api:latest 2>&1)

# 检查拉取命令是否成功执行
if [ $? -ne 0 ]; then
exit 1
fi

# 检查输出中是否包含特定字符串
echo "$output" | grep -q "Image is up to date for martialbe/one-api:latest"

# 如果镜像已经是最新的，则不执行任何操作
if [ $? -eq 0 ]; then
exit 0
fi

echo "检测到 one-api 更新"

# 移除旧的容器
echo "已移除: $(docker rm -f one-api)"

# 你需要首先导航到 `docker-compose.yml` 所在的目录
cd /www/wwwroot/

# 运行新的容器 这里使用的是SQlite的docker命令，可以改成你自己想要的
echo "已启动: $(docker run -d -p 3000:3000 --name one-api --restart always -e TZ=Asia/Shanghai -v /home/ubuntu/data/one-api:/data ghcr.io/martialbe/one-api)"

# 打印更新时间和版本
echo "更新时间: $(date)"
echo "版本: $(docker inspect martialbe/one-api:latest | grep 'org.opencontainers.image.version' | awk -F'"' '{print $4}')"

# 清理未使用的镜像
docker images | grep 'martialbe/one-api' | grep -v 'latest' | awk '{print $3}' | xargs -r docker rmi > /dev/null 2>&1
echo "已移除旧的镜像."
```
