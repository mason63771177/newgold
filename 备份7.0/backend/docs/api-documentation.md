# 裂金7日 - API接口文档

## 概述

本文档描述了裂金7日项目的所有API接口，包括认证、钱包、用户管理、交易等功能模块。

### 基础信息

- **基础URL**: `http://localhost:3000/api`
- **认证方式**: Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

### 通用响应格式

```json
{
  "success": true|false,
  "message": "响应消息",
  "data": {}, // 响应数据（可选）
  "error": {} // 错误信息（可选）
}
```

### 错误代码

| 代码 | 说明 |
|------|------|
| 400 | 请求参数错误 |
| 401 | 未授权访问 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

---

## 认证模块 (Authentication)

### 用户注册

**接口**: `POST /auth/register`

**描述**: 用户注册新账户

**请求参数**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "inviteCode": "INVITE123" // 可选
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "userId": 123,
    "email": "user@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 用户登录

**接口**: `POST /auth/login`

**描述**: 用户登录获取访问令牌

**请求参数**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "userId": 123,
    "email": "user@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

---

## 钱包模块 (Wallet)

### 获取钱包余额

**接口**: `GET /wallet/balance`

**描述**: 获取用户钱包余额信息

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "balance": 1000.50,
    "frozenBalance": 50.00,
    "totalEarnings": 2500.75,
    "depositAddress": "TXYZabc123...",
    "config": {
      "withdrawFee": 2.0,
      "minWithdraw": 10.0,
      "maxWithdraw": 10000.0,
      "dailyWithdrawLimit": 50000.0,
      "supportedNetworks": ["TRC20"],
      "processingTime": "1-3分钟"
    }
  }
}
```

### 获取充值地址

**接口**: `GET /wallet/deposit-address`

**描述**: 获取用户专属充值地址

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "address": "TXYZabc123...",
    "network": "TRC20",
    "currency": "USDT",
    "qrCode": "data:image/png;base64,..."
  }
}
```

### 申请提现

**接口**: `POST /wallet/withdraw`

**描述**: 申请提现到指定地址

**请求头**:
```
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "toAddress": "TReceiver123...",
  "amount": 100.0,
  "password": "password123" // 可选，用于二次验证
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "提现申请已提交",
  "data": {
    "withdrawalId": "WD123456789",
    "amount": 100.0,
    "fee": 3.0,
    "actualAmount": 97.0,
    "toAddress": "TReceiver123...",
    "status": "pending",
    "estimatedTime": "1-3分钟"
  }
}
```

### 获取交易历史

**接口**: `GET /wallet/transactions`

**描述**: 获取用户交易历史记录

**请求头**:
```
Authorization: Bearer <token>
```

**查询参数**:
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20）
- `type`: 交易类型（deposit/withdraw/all）
- `status`: 交易状态（pending/completed/failed/all）

**响应示例**:
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "TX123456789",
        "type": "deposit",
        "amount": 100.0,
        "fee": 0,
        "status": "completed",
        "txHash": "0xabc123...",
        "fromAddress": "TSender123...",
        "toAddress": "TReceiver123...",
        "createdAt": "2024-01-01T12:00:00Z",
        "completedAt": "2024-01-01T12:05:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

## 管理员模块 (Admin)

### 管理员登录

**接口**: `POST /admin/login`

**描述**: 管理员登录

**请求参数**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

### 获取用户列表

**接口**: `GET /admin/users`

**描述**: 获取系统用户列表

**请求头**:
```
Authorization: Bearer <admin-token>
```

**查询参数**:
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20）
- `search`: 搜索关键词
- `status`: 用户状态

**响应示例**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 123,
        "email": "user@example.com",
        "username": "user123",
        "balance": 1000.50,
        "status": "active",
        "createdAt": "2024-01-01T12:00:00Z",
        "lastLoginAt": "2024-01-02T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 500,
      "totalPages": 25
    }
  }
}
```

### 获取交易记录

**接口**: `GET /admin/transactions`

**描述**: 获取系统交易记录

**请求头**:
```
Authorization: Bearer <admin-token>
```

**查询参数**:
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20）
- `type`: 交易类型
- `status`: 交易状态
- `userId`: 用户ID
- `startDate`: 开始日期
- `endDate`: 结束日期

### 资金归集

**接口**: `POST /admin/consolidate`

**描述**: 执行资金归集操作

**请求头**:
```
Authorization: Bearer <admin-token>
```

**请求参数**:
```json
{
  "minAmount": 10.0, // 最小归集金额
  "maxAddresses": 50 // 最大处理地址数
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "资金归集已启动",
  "data": {
    "taskId": "CONSOLIDATE123",
    "processedAddresses": 25,
    "totalAmount": 5000.0,
    "estimatedTime": "10-15分钟"
  }
}
```

---

## 实时钱包模块 (Real Wallet)

### 获取实时余额

**接口**: `GET /real-wallet/balance`

**描述**: 获取Tatum钱包实时余额

### 计算手续费

**接口**: `POST /real-wallet/calculate-fee`

**描述**: 计算提现手续费

**请求参数**:
```json
{
  "amount": 100.0,
  "toAddress": "TReceiver123..."
}
```

### 检测充值

**接口**: `GET /real-wallet/detect-deposits`

**描述**: 检测新的充值交易

---

## 余额模块 (Balance)

### 获取TRX余额

**接口**: `GET /balance/trx/:address`

**描述**: 获取指定地址的TRX余额

### 获取USDT余额

**接口**: `GET /balance/usdt/:address`

**描述**: 获取指定地址的USDT余额

### 获取完整余额

**接口**: `GET /balance/full/:address`

**描述**: 获取指定地址的完整余额信息

---

## 交易验证模块 (Transaction)

### 验证交易

**接口**: `GET /transaction/verify/:txHash`

**描述**: 验证单个交易状态

### 批量验证交易

**接口**: `POST /transaction/verify-batch`

**描述**: 批量验证多个交易状态

**请求参数**:
```json
{
  "txHashes": ["0xabc123...", "0xdef456..."]
}
```

---

## Webhook模块

### Tatum Webhook

**接口**: `POST /webhook/tatum`

**描述**: 接收Tatum的Webhook通知

---

## 监控模块 (Monitoring)

### 健康检查

**接口**: `GET /monitoring/health`

**描述**: 系统健康状态检查

**响应示例**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T12:00:00Z",
    "services": {
      "database": "connected",
      "redis": "connected",
      "tatum": "connected"
    },
    "uptime": 86400
  }
}
```

### 系统指标

**接口**: `GET /monitoring/metrics`

**描述**: 获取系统性能指标

### 系统信息

**接口**: `GET /monitoring/system`

**描述**: 获取系统基本信息

### 日志查询

**接口**: `GET /monitoring/logs`

**描述**: 查询系统日志

---

## 速率限制

不同接口有不同的速率限制策略：

| 接口类型 | 时间窗口 | 最大请求数 |
|----------|----------|------------|
| 登录 | 15分钟 | 10次 |
| 注册 | 1小时 | 3次 |
| 提现 | 1小时 | 10次 |
| 钱包操作 | 5分钟 | 30次 |
| 管理员操作 | 5分钟 | 100次 |
| 一般查询 | 15分钟 | 200次 |

---

## 安全说明

1. **认证**: 所有需要认证的接口都需要在请求头中包含有效的Bearer Token
2. **HTTPS**: 生产环境必须使用HTTPS协议
3. **速率限制**: 所有接口都有速率限制，防止滥用
4. **输入验证**: 所有输入参数都会进行严格验证
5. **日志记录**: 所有操作都会记录详细日志用于审计

---

## 错误处理

### 常见错误响应

```json
{
  "success": false,
  "message": "错误描述",
  "error": {
    "code": "ERROR_CODE",
    "details": "详细错误信息"
  }
}
```

### 验证错误

```json
{
  "success": false,
  "message": "输入验证失败",
  "error": {
    "code": "VALIDATION_ERROR",
    "fields": {
      "email": "请输入有效的邮箱地址",
      "amount": "金额必须大于0"
    }
  }
}
```

---

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 实现基础认证、钱包、管理员功能
- 集成Tatum API
- 添加速率限制和安全防护

---

## 联系方式

如有问题或建议，请联系开发团队。