---
title: "价格更新"
layout: doc
outline: deep
lastUpdated: true
---

# 价格更新

目前定价管理是通过管理员账户下的`运营 --> 模型价格 --> 更新价格`进行配置的。

项目官方提供一张价格表：<https://raw.githubusercontent.com/MartialBE/one-api/prices/prices.json>

另外社区维护的价格表项目如下：

- [Oaklight/onehub_prices](https://github.com/Oaklight/onehub_prices)

  - 每 2 小时自动同步 Openrouter 和 Siliconflow 更新，定期手动核验其他供应商。
  - 供应商 id 映射：使用任何价格表前，请务必检查 [ownedby.json](https://raw.githubusercontent.com/Oaklight/onehub_prices/prices/ownedby.json) 以确保供应商 ID 与 价格表 channel id 对应，否则“可用模型”页面无法按供应商正确显示。
  - 完整价格表: 适用于 one-hub 的完整价格表，合并 MartialBE/one-hub 价格表，另外提供了更多供应商：<https://raw.githubusercontent.com/Oaklight/onehub_prices/prices/oneapi_prices.json>
  - 核心供应商价格表: 仅包含 MartialBE/one-hub 目前定义的供应商 id <= 1000 的核心供应商价格表：<https://raw.githubusercontent.com/Oaklight/onehub_prices/prices/onehub_only_prices.json>
  - siliconflow 价格表：<https://raw.githubusercontent.com/Oaklight/onehub_prices/prices/siliconflow_prices.json>
  - openrouter 价格表：<https://raw.githubusercontent.com/Oaklight/onehub_prices/prices/openrouter_prices.json>

- [woodchen-ink 维护](https://github.com/MartialBE/one-hub/issues/562#issuecomment-2746243372)

  - 价格连接：<https://aimodels-prices.q58.club/api/prices/rates>

需要明确的是，除了项目官方默认提供的供应商列表（`运营 --> 模型归属`）外，即 `id > 1000`的供应商，需要和项目价格表的供应商 id 能够匹配的上才可以正确显示价格。所以你需要同时关注：

- ownedby 列表，一般通过 onehub 网页`运营 --> 模型归属`维护。
- prices 列表，通过`运营 --> 模型价格`手动维护，或 json 连接更新。
- Oaklight/onehub_prices 项目提供了 [sync_price.py](https://raw.githubusercontent.com/Oaklight/onehub_prices/refs/heads/master/src/sync_pricing.py) 和 [sync_ownedby.py](https://raw.githubusercontent.com/Oaklight/onehub_prices/refs/heads/master/src/sync_ownedby.py) 两份自动同步脚本。用法见项目[README](https://github.com/Oaklight/onehub_prices?tab=readme-ov-file#%E4%BB%B7%E6%A0%BC%E5%90%8C%E6%AD%A5%E6%8C%87%E5%AF%BC)。
