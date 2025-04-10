---
title: "命令行参数"
layout: doc
outline: deep
lastUpdated: true
---

# 命令行参数

1. `--port <port_number>`: 指定服务器监听的端口号，默认为 `3000`。
   - 例子：`--port 3000`
2. `--log-dir <log_dir>`: 指定日志文件夹，如果没有设置，默认保存至工作目录的 `logs` 文件夹下。
   - 例子：`--log-dir ./logs`
3. `--version`: 打印系统版本号并退出。
4. `--help`: 查看命令的使用帮助和参数说明。
5. `--config <config_file>`: 指定配置文件路径，程序将会读取该文件中的配置。配置文件详见[config.example.yaml](https://raw.githubusercontent.com/MartialBE/one-api/main/config.example.yaml)
   - 例子：`--config ./config.yaml`
