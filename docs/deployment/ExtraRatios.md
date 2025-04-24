---
title: "扩展价格设置"
layout: doc
outline: deep
lastUpdated: true
---

# 扩展价格设置

由于现在多模态模型的价格设置比较复杂，所以增加了扩展价格设置的功能。

目前支持以下扩展价格设置：

- input_audio_tokens：输入音频令牌 (输入价格)
- output_audio_tokens：输出音频令牌 (输出价格)
- cached_tokens：缓存令牌 (输入价格)
- cached_write_tokens：缓存写入令牌 (输入价格)
- cached_read_tokens：缓存读取令牌 (输入价格)
- reasoning_tokens：推理令牌 (输出价格)
- input_text_tokens：输入文字令牌 (输入价格)
- output_text_tokens：输出文字令牌 (输出价格)
- input_image_tokens：输入图片令牌 (输入价格)

## 计费方法

按照倍率计算， 上面括号中的 xx 价格，就是和哪个价格进行绑定的。
例如：
gpt-image-1 的价格为 图片输入价格 10/M， 图片输出价格 40/M， 文字输入价格： 5/M，

我们在定价时，只要设置`gpt-image-1`的价格为图片的输入/输出价格， 在扩展价格中设置 `"input_text_tokens": 0.5` 即可。

如果设置了`input_text_tokens`， 那么文字输入价格就是 10 \* 0.5 = 5/M。

## 格式

格式如下：

```json
{
  "gpt-4o-audio-preview": {
    "input_audio_tokens": 40,
    "output_audio_tokens": 20
  },
  "gpt-4o-audio-preview-2024-10-01": {
    "input_audio_tokens": 40,
    "output_audio_tokens": 20
  },
  "gpt-4o-audio-preview-2024-12-17": {
    "input_audio_tokens": 16,
    "output_audio_tokens": 8
  },
  "gpt-4o-mini-audio-preview": {
    "input_audio_tokens": 67,
    "output_audio_tokens": 34
  },
  "gpt-4o-mini-audio-preview-2024-12-17": {
    "input_audio_tokens": 67,
    "output_audio_tokens": 34
  },
  "gpt-4o-realtime-preview": {
    "input_audio_tokens": 20,
    "output_audio_tokens": 10
  },
  "gpt-4o-realtime-preview-2024-10-01": {
    "input_audio_tokens": 20,
    "output_audio_tokens": 10
  },
  "gpt-4o-realtime-preview-2024-12-17": {
    "input_audio_tokens": 8,
    "output_audio_tokens": 4
  },
  "gpt-4o-mini-realtime-preview": {
    "input_audio_tokens": 17,
    "output_audio_tokens": 8.4
  },
  "gpt-4o-mini-realtime-preview-2024-12-17": {
    "input_audio_tokens": 17,
    "output_audio_tokens": 8.4
  },
  "gemini-2.5-flash-preview-04-17": {
    "reasoning_tokens": 5.833
  },
  "gpt-image-1": {
    "input_text_tokens": 0.5
  }
}
```
