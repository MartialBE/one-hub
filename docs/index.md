---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "One Hub 文档"
  actions:
    - theme: brand
      text: 开始使用
      link: /deployment/index
    - theme: alt
      text: 项目地址
      link: https://github.com/MartialBE/one-hub

features:
  - title: 部署
    icon: 🚀
    details: 部署One Hub
    link: /deployment/index
  - title: 使用方法
    icon: 📖
    details: 使用One Hub
    link: /use/index
  - title: 常见问题
    icon: 💬
    details: 常见问题
    link: /use/FAQ
---

::: tip 说明
本项目是基于[one-api](https://github.com/songquanpeng/one-api)二次开发而来的，主要将原项目中的模块代码分离，模块化，并修改了前端界面。本项目同样遵循 MIT 协议。
:::

::: warning 注意
请不要和原版混用，因为新增功能，数据库与原版不兼容
:::

<div style="text-align: center">

[演示网站](https://one-hub.xiao5.info)

</div>

## 功能变化

- 全新的 UI 界面
- 新增用户仪表盘
- 新增管理员分析数据统计界面
- 重构了中转`供应商`模块
- 支持使用`Azure Speech`模拟`TTS`功能
- 渠道可配置单独的 http/socks5 代理
- 支持动态返回用户模型列表
- 支持自定义测速模型
- 日志增加请求耗时
- 支持和优化非 OpenAI 模型的函数调用（支持的模型可以在 lobe-chat 直接使用）
- 支持完成倍率自定义
- 支持完整的分页和排序
- 支持`Telegram bot`
- 支持模型按次收费
- 支持模型通配符
- 支持使用配置文件启动程序
- 支持消息通知
