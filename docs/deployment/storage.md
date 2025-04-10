---
title: "图床配置"
layout: doc
outline: deep
lastUpdated: true
---

# 图床配置

因为图片生成有些供应商不提供 url，所以如果设置了图床，那么会上传到图床后返回链接。

在使用`gemini`支持图像输出的模型时，如果图床设置不正确，会导致图片返回失败。（gemini 原生 API 接口不需要配置）

可以设置多个图床， 上传失败后，会自动使用下一个图床上传。

```yaml
storage: # 存储设置 (可选,主要用于图片生成，有些供应商不提供url，只能返回base64图片，设置后可以正常返回url格式的图片生成)
  smms: # sm.ms 图床设置
    secret: "" # 你的 sm.ms API 密钥
  imgur:
    client_id: "" # 你的 imgur client_id
  alioss: # 阿里云OSS对象存储
    endpoint: "" # Endpoint（地域节点）,比如oss-cn-beijing.aliyuncs.com
    bucketName: "" # Bucket名称，比如zerodeng-superai
    accessKeyId: "" # 阿里授权KEY,在阿里云后台用户RAM控制部分获取
    accessKeySecret: "" # 阿里授权SECRET,在阿里云后台用户RAM控制部分获取
  s3: # AwsS3协议
    endpoint: "" # Endpoint（地域节点）,比如https://xxxxxx.r2.cloudflarestorage.com
    cdnurl: "" # 公共访问域名，比如https://pub-xxxxx.r2.dev，如果不配置则使用endpoint
    bucketName: "" # Bucket名称，比如zerodeng-superai
    accessKeyId: "" # accessKeyId
    accessKeySecret: "" # accessKeySecret
    expirationDays: 3
```
