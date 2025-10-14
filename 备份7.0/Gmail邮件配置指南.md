# Gmail 邮件配置指南

## 📧 Gmail SMTP 配置步骤

### 1. 准备 Gmail 账号
- 确保您有一个 Gmail 账号
- 建议使用专门的邮箱账号用于系统邮件发送

### 2. 启用两步验证
1. 登录 Gmail 账号
2. 访问 [Google 账号设置](https://myaccount.google.com/)
3. 点击"安全性"
4. 启用"两步验证"

### 3. 生成应用专用密码
1. 在"安全性"页面中，找到"应用专用密码"
2. 选择"邮件"和您的设备
3. 点击"生成"
4. **保存生成的16位密码**（这将用作 SMTP_PASS）

### 4. 更新环境变量
编辑 `backend/.env` 文件，替换以下配置：

```env
# 邮件配置 - Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=您的Gmail邮箱@gmail.com
SMTP_PASS=您的应用专用密码
FROM_EMAIL=您的Gmail邮箱@gmail.com
FROM_NAME=Gold7 Game
FRONTEND_URL=http://localhost:8000
```

### 5. 重启后端服务
配置完成后，需要重启后端服务以加载新的环境变量：

```bash
cd backend
npm start
```

## 🔧 配置示例

```env
# 示例配置（请替换为您的实际信息）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=goldgame2024@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
FROM_EMAIL=goldgame2024@gmail.com
FROM_NAME=Gold7 Game
FRONTEND_URL=http://localhost:8000
```

## ⚠️ 注意事项

1. **应用专用密码**：必须使用应用专用密码，不能使用普通登录密码
2. **两步验证**：必须先启用两步验证才能生成应用专用密码
3. **安全性**：不要将密码提交到版本控制系统
4. **测试**：配置完成后建议先测试邮件发送功能

## 🚀 测试邮件发送

配置完成后，您可以通过以下方式测试：

1. 访问测试接口：`http://localhost:3000/api/test/email-status`
2. 发送测试邮件：`http://localhost:3000/api/test/send-verification-email`
3. 查看后端控制台日志确认发送状态

## 🔍 故障排除

如果遇到问题，请检查：

1. Gmail 账号是否启用了两步验证
2. 应用专用密码是否正确生成和配置
3. 网络连接是否正常
4. 后端服务是否重启
5. 环境变量是否正确加载

## 📞 技术支持

如需帮助，请查看：
- 后端控制台日志
- Gmail 安全设置
- 网络防火墙设置