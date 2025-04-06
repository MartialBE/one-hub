---
title: "添加 VertexAI"
layout: doc
outline: deep
lastUpdated: true
---

# 添加 VertexAI

1. 创建服务凭证
   [打开此页面](https://console.cloud.google.com/iam-admin/serviceaccounts)。选择你的项目，然后点击“创建服务帐号”。
   <img width="1099" alt="iShot_2024-07-12_20 53 21" src="https://github.com/user-attachments/assets/6d0412df-a219-4133-9c0e-283f665a8ed9">

2. 服务账号详情，自己填一个名称
   <img width="604" alt="iShot_2024-07-12_20 54 53" src="https://github.com/user-attachments/assets/f6d2cbed-88f2-46a9-9d80-ec6268722e83">

3. 选择角色， 请在上面的过滤器中输入`Vertex AI User` 和 `Service Account Token Creator`，然后选择这两个角色。

<img width="582" alt="iShot_2024-07-12_20 55 22" src="https://github.com/user-attachments/assets/679a63a2-a6b4-4669-b583-a90d66029f97">
<img width="593" alt="iShot_2024-07-12_20 56 25" src="https://github.com/user-attachments/assets/71910d72-e622-4f06-9b60-d9df70dc3d26">

4. 点击“继续”，然后点击“完成”。

5. 点击你刚才创建的服务账号，然后点击“密钥”，选择“创建新密钥”，然后选择“JSON”，然后点击“创建”。
   <img width="598" alt="iShot_2024-07-12_20 57 14" src="https://github.com/user-attachments/assets/f75956e2-9d43-492a-a622-5145b6edc65b">
   <img width="454" alt="iShot_2024-07-12_20 58 29" src="https://github.com/user-attachments/assets/6729b086-1674-4995-9d57-58f366db81b1">

<img width="386" alt="iShot_2024-07-12_20 58 45" src="https://github.com/user-attachments/assets/ae0df568-dc93-4bf2-a570-829e86c3090a">

6. 创建成功后，下载 JSON 文件，在本地打开 JSON 文件，将里面所有的内容复制到渠道的`Key`中。

7. 最后在[这里](https://console.cloud.google.com/apis/library/iamcredentials.googleapis.com)，启用`IAM Service Account Credentials API`。
