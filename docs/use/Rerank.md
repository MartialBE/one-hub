---
title: "Rerank 接口"
layout: doc
outline: deep
lastUpdated: true
---

# Rerank 接口

由于 rerank 接口目前没有统一标准，每家都有各自的实现方案。目前本项目支持下述几种 rerank 返回格式，分别为 Jina、Cohere、Siliconflow。

通常对于提供 rerank 模型的供应商而言，会选择三者之一的 JSON 结构作为其返回形式，差别主要在于 Usage 的返回方案。目前项目代码仅以下三种供应商渠道类型包含 rerank 的解析方案。

请在添加 Rerank 模型时，创建一个新的渠道，按照供应商文档以及实测得到的 JSON 结构，确定以上三种其中之一为渠道类型。自定义渠道实为 OpenAI 的类型，其下不包含 rerank 接口。

## Jina

```json
{
  "model": "jina-reranker-v2-base-multilingual",
  "usage": {
    "total_tokens": 815
  },
  "results": [
    {
      "index": 0,
      "document": {
        "text": "Organic skincare for sensitive skin with aloe vera and chamomile: Imagine the soothing embrace of nature with our organic skincare range, crafted specifically for sensitive skin. Infused with the calming properties of aloe vera and chamomile, each product provides gentle nourishment and protection. Say goodbye to irritation and hello to a glowing, healthy complexion."
      },
      "relevance_score": 0.8783142566680908
    },
    {
      "index": 6,
      "document": {
        "text": "针对敏感肌专门设计的天然有机护肤产品：体验由芦荟和洋甘菊提取物带来的自然呵护。我们的护肤产品特别为敏感肌设计，温和滋润，保护您的肌肤不受刺激。让您的肌肤告别不适，迎来健康光彩。"
      },
      "relevance_score": 0.8783142566680908
    },
    {
      "index": 4,
      "document": {
        "text": "Cuidado de la piel orgánico para piel sensible con aloe vera y manzanilla: Descubre el poder de la naturaleza con nuestra línea de cuidado de la piel orgánico, diseñada especialmente para pieles sensibles. Enriquecidos con aloe vera y manzanilla, estos productos ofrecen una hidratación y protección suave. Despídete de las irritaciones y saluda a una piel radiante y saludable."
      },
      "relevance_score": 0.8624675869941711
    }
  ]
}
```

## Cohere

```json
{
  "id": "e6b994e7-1158-4216-bdec-3ea4246434d0",
  "results": [
    {
      "index": 0,
      "relevance_score": 0.9197076
    },
    {
      "index": 4,
      "relevance_score": 0.9008183
    },
    {
      "index": 8,
      "relevance_score": 0.8800674
    }
  ],
  "meta": {
    "api_version": {
      "version": "2"
    },
    "billed_units": {
      "search_units": 1
    }
  }
}
```

## Siliconflow

```json
{
  "id": "0195c4bc8788725da3006f0779171780",
  "results": [
    { "index": 8, "relevance_score": 0.9983834 },
    { "index": 0, "relevance_score": 0.9983059 },
    { "index": 6, "relevance_score": 0.9961606 }
  ],
  "meta": {
    "billed_units": {
      "input_tokens": 896,
      "output_tokens": 0,
      "search_units": 0,
      "classifications": 0
    },
    "tokens": { "input_tokens": 896, "output_tokens": 0 }
  }
}
```
