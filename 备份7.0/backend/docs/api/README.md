# API 文档

## 概述

本文档描述了H5游戏化金融产品后端系统的所有API端点。

## 认证

所有需要认证的API都使用JWT Token进行验证。

### 获取Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

### 使用Token

在请求头中添加Authorization字段：

```http
Authorization: Bearer <your_jwt_token>
```

## 用户管理 API

### 获取用户信息

```http
GET /api/user/info
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "user123",
    "email": "user@example.com",
    "status": 2,
    "balance": 100.50,
    "invite_code": "ABC123"
  }
}
```

### 获取用户状态

```http
GET /api/user/status
Authorization: Bearer <token>
```

### 获取团队信息

```http
GET /api/user/team
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "totalMembers": 5,
    "activeMembers": 3,
    "members": [
      {
        "id": 2,
        "username": "member1",
        "created_at": "2024-01-01T00:00:00.000Z",
        "status": 2
      }
    ]
  }
}
```

## 钱包管理 API

### 获取钱包信息

```http
GET /api/wallet/info
Authorization: Bearer <token>
```

### 提现申请

```http
POST /api/wallet/withdraw
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 50.00,
  "toAddress": "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH",
  "network": "TRC20"
}
```

## 任务系统 API

### 获取任务列表

```http
GET /api/tasks/list
Authorization: Bearer <token>
```

### 完成任务

```http
POST /api/tasks/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "taskId": 1
}
```

## 红包系统 API

### 获取红包状态

```http
GET /api/redpacket/status
Authorization: Bearer <token>
```

### 抢红包

```http
POST /api/redpacket/grab
Authorization: Bearer <token>
```

## 排行榜 API

### 获取排行榜

```http
GET /api/ranking/list
Authorization: Bearer <token>
```

## 管理员 API

### 管理员登录

```http
POST /api/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin_password"
}
```

### 获取用户列表

```http
GET /api/admin/users
Authorization: Bearer <admin_token>
```

### 获取系统统计

```http
GET /api/admin/stats
Authorization: Bearer <admin_token>
```

## 错误处理

所有API都遵循统一的错误响应格式：

```json
{
  "success": false,
  "message": "错误描述",
  "code": "ERROR_CODE"
}
```

### 常见错误码

| 错误码 | HTTP状态码 | 描述 |
|--------|------------|------|
| INVALID_TOKEN | 401 | 无效的访问令牌 |
| INSUFFICIENT_BALANCE | 400 | 余额不足 |
| USER_NOT_FOUND | 404 | 用户不存在 |
| INVALID_PARAMS | 400 | 参数错误 |
| SERVER_ERROR | 500 | 服务器内部错误 |

## 请求限制

- 每个IP每分钟最多100次请求
- 登录接口每个IP每分钟最多5次请求
- 提现接口每个用户每天最多10次请求

## 数据格式

- 所有时间字段使用ISO 8601格式
- 金额字段保留2位小数
- 布尔值使用true/false
- 空值使用null