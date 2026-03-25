# 微信小程序发布配置说明

## 1. 获取微信小程序凭证

### 步骤:
1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入"开发" -> "开发管理" -> "开发设置"
3. 获取以下信息:
   - **AppID**: 小程序ID
   - **AppSecret**: 小程序密钥 (点击"重置"或"生成"获取)

## 2. 配置后端环境变量

在 `backend/.env` 文件中添加或修改以下配置:

```env
WECHAT_APPID=your-actual-appid
WECHAT_APPSECRET=your-actual-appsecret
```

将 `your-actual-appid` 和 `your-actual-appsecret` 替换为实际获取的值。

## 3. 配置服务器IP白名单

在微信公众平台的"开发设置"中,将后端服务器的IP地址添加到"服务器域名白名单"。

## 4. 小程序发布流程

### 发布流程说明:
1. **配置管理**: 设置小程序AppID和AppSecret
2. **创建发布任务**: 选择小程序类型(观众端/商家端)、版本号、描述
3. **自动构建**: 系统自动清理依赖、压缩代码包
4. **上传代码**: 将代码包上传到微信服务器
5. **提交审核**: 提交给微信审核
6. **审核通过**: 审核通过后可以发布
7. **正式发布**: 发布到线上环境

### 状态说明:
- `pending`: 待处理
- `building`: 构建中
- `uploading`: 上传中
- `auditing`: 审核中
- `success`: 成功
- `failed`: 失败
- `rolling_back`: 回滚中
- `rolled_back`: 已回滚

## 5. API端点

### 获取配置
```
GET /api/platform/miniprogram/config
```

### 更新配置
```
PUT /api/platform/miniprogram/config
Body: { appId, appName }
```

### 创建发布任务
```
POST /api/platform/miniprogram/publish
Body: { type, version, desc }
```

### 获取发布状态
```
GET /api/platform/miniprogram/publish/status/:taskId
```

### 获取发布历史
```
GET /api/platform/miniprogram/publish/history?page=1&limit=10
```

### 发布小程序
```
POST /api/platform/miniprogram/publish/:taskId/release
```

### 回滚发布
```
POST /api/platform/miniprogram/publish/:taskId/rollback
```

### 删除发布记录
```
DELETE /api/platform/miniprogram/publish/:id
```

## 6. 权限要求

以下用户权限需要正确配置:
- `miniprogram:config`: 配置管理权限
- `miniprogram:publish`: 发布权限
- `miniprogram:rollback`: 回滚权限

## 7. 注意事项

1. **代码包大小限制**: 微信小程序代码包主包大小限制为2MB
2. **审核时间**: 微信审核通常需要1-3个工作日
3. **发布限制**: 每个小程序每天最多发布5次
4. **版本号规范**: 建议使用语义化版本号 (如 1.0.0, 1.1.0)
5. **测试**: 建议先在体验版中测试完整流程

## 8. 常见问题

### Q: 提示"微信小程序AppID或AppSecret未配置"
A: 检查 `.env` 文件中的 `WECHAT_APPID` 和 `WECHAT_APPSECRET` 是否正确配置

### Q: 上传代码失败
A: 检查代码包大小是否超过限制,网络连接是否正常

### Q: 审核被拒
A: 查看微信审核反馈,修改内容后重新提交

### Q: 回滚失败
A: 只有审核通过或已发布的版本才能回滚

## 9. 技术支持

如有问题,请查看:
- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [微信开放平台文档](https://developers.weixin.qq.com/doc/oplatform/Mobile_App/Access_Guide/Android.html)
