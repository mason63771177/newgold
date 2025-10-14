# API接口规范文档

## 基础规范

### 请求格式
- 协议：HTTPS
- 方法：GET, POST, PUT, DELETE
- 内容类型：application/json
- 字符编码：UTF-8

### 响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": 1640995200000
}
```

### 状态码规范
- 200：成功
- 400：请求参数错误
- 401：未授权
- 403：禁止访问
- 404：资源不存在
- 500：服务器内部错误

## 用户系统接口

### 1. 用户注册
```
POST /api/user/register
```
**请求参数：**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "inviteCode": "ABC123"
}
```
**响应数据：**
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "userId": "12345",
    "email": "user@example.com",
    "status": 1,
    "inviterInfo": {
      "username": "inviter_name",
      "telegramId": "inviter_telegram"
    }
  }
}
```

### 2. 用户登录
```
POST /api/user/login
```
**请求参数：**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**响应数据：**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "jwt_token_here",
    "userInfo": {
      "userId": "12345",
      "email": "user@example.com",
      "status": 2,
      "countdownEndTime": 1640995200000
    }
  }
}
```

### 3. 获取用户信息
```
GET /api/user/info
```
**请求头：**
```
Authorization: Bearer jwt_token_here
```
**响应数据：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "userId": "12345",
    "email": "user@example.com",
    "status": 2,
    "countdownEndTime": 1640995200000,
    "walletBalance": 150.50,
    "inviteCode": "ABC123",
    "teamCount": 25
  }
}
```

## 状态管理接口

### 1. 获取用户状态
```
GET /api/user/status
```
**响应数据：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "status": 2,
    "statusName": "已入金168小时倒计时",
    "countdownEndTime": 1640995200000,
    "remainingHours": 120,
    "canActivate": false,
    "canGrabRedPacket": true
  }
}
```

### 2. 激活账号（入金）
```
POST /api/user/activate
```
**响应数据：**
```json
{
  "code": 200,
  "message": "激活成功",
  "data": {
    "walletAddress": "TRC20_WALLET_ADDRESS",
    "amount": 100,
    "currency": "USDT",
    "orderId": "ORDER_12345"
  }
}
```

## 任务系统接口

### 1. 获取任务列表
```
GET /api/task/list
```
**响应数据：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "newbieTasks": [
      {
        "taskId": 1,
        "taskName": "直接推荐1人",
        "description": "让玩家发展下线，初尝甜头",
        "reward": 10,
        "status": "completed",
        "progress": "1/1"
      }
    ],
    "quizTasks": [
      {
        "taskId": "quiz_1",
        "question": "如何正确发展下线？",
        "options": ["A选项", "B选项", "C选项", "D选项"],
        "status": "pending"
      }
    ],
    "masterTasks": [
      {
        "taskId": "master_1",
        "taskName": "大神任务一",
        "description": "完美裂变 直推2人 × 2层 = 6人",
        "targetCount": 6,
        "currentCount": 3,
        "reward": 50,
        "status": "in_progress"
      }
    ]
  }
}
```

### 2. 完成任务
```
POST /api/task/complete
```
**请求参数：**
```json
{
  "taskId": 1,
  "taskType": "newbie"
}
```
**响应数据：**
```json
{
  "code": 200,
  "message": "任务完成",
  "data": {
    "reward": 10,
    "newBalance": 160.50
  }
}
```

### 3. 答题
```
POST /api/task/quiz/answer
```
**请求参数：**
```json
{
  "questionId": "quiz_1",
  "answer": "A"
}
```
**响应数据：**
```json
{
  "code": 200,
  "message": "回答正确",
  "data": {
    "correct": true,
    "feeReduction": 0.2,
    "currentFeeRate": 4.8
  }
}
```

## 抢红包系统接口

### 1. 获取红包状态
```
GET /api/redpacket/status
```
**响应数据：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "isActive": true,
    "nextTime": "12:00:00",
    "remainingSeconds": 45,
    "canGrab": true,
    "totalPool": 5000.00
  }
}
```

### 2. 抢红包
```
POST /api/redpacket/grab
```
**响应数据：**
```json
{
  "code": 200,
  "message": "抢红包成功",
  "data": {
    "amount": 25.50,
    "newBalance": 186.00,
    "rank": 5,
    "totalGrabbed": 150
  }
}
```

## 钱包系统接口

### 1. 获取钱包信息
```
GET /api/wallet/info
```
**响应数据：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "balance": 186.00,
    "withdrawFeeRate": 4.8,
    "fixedFee": 2.0,
    "dailyWithdrawLimit": 50000,
    "singleWithdrawLimit": {
      "min": 20,
      "max": 2000
    }
  }
}
```

### 2. 提现
```
POST /api/wallet/withdraw
```
**请求参数：**
```json
{
  "amount": 100,
  "walletAddress": "TRC20_WALLET_ADDRESS"
}
```
**响应数据：**
```json
{
  "code": 200,
  "message": "提现申请成功",
  "data": {
    "orderId": "WITHDRAW_12345",
    "amount": 100,
    "fee": 7.0,
    "actualAmount": 93.0,
    "status": "pending"
  }
}
```

### 3. 交易记录
```
GET /api/wallet/transactions
```
**查询参数：**
- page: 页码
- limit: 每页数量
- type: 交易类型（activate/withdraw/redpacket/task）

**响应数据：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "transactions": [
      {
        "id": "TX_12345",
        "type": "redpacket",
        "amount": 25.50,
        "balance": 186.00,
        "createTime": 1640995200000,
        "description": "抢红包收入"
      }
    ]
  }
}
```

## 团队系统接口

### 1. 获取团队信息
```
GET /api/team/info
```
**响应数据：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalMembers": 127,
    "directMembers": 8,
    "teamStructure": [
      {
        "level": 1,
        "members": [
          {
            "userId": "user_1",
            "username": "member1",
            "joinTime": 1640995200000,
            "status": 2
          }
        ]
      }
    ]
  }
}
```

### 2. 生成邀请链接
```
POST /api/team/invite-link
```
**响应数据：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "inviteLink": "https://domain.com/register?code=ABC123",
    "inviteCode": "ABC123",
    "expiryTime": 1640995200000,
    "remainingHours": 120
  }
}
```

## 排行榜接口

### 1. 团队排行榜
```
GET /api/ranking/team
```
**查询参数：**
- type: 排行类型（total/direct）
- period: 时间周期（personal/week/month）

**响应数据：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "rankings": [
      {
        "rank": 1,
        "username": "top_user",
        "teamCount": 500,
        "directCount": 25
      }
    ],
    "myRank": {
      "rank": 15,
      "teamCount": 127,
      "directCount": 8
    }
  }
}
```

### 2. 红包排行榜
```
GET /api/ranking/redpacket
```
**响应数据：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "rankings": [
      {
        "rank": 1,
        "username": "lucky_user",
        "totalAmount": 1250.50
      }
    ],
    "myRank": {
      "rank": 8,
      "totalAmount": 325.75
    }
  }
}
```

### 3. 大神排行榜
```
GET /api/ranking/master
```
**响应数据：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "rankings": [
      {
        "rank": 1,
        "username": "master_user",
        "masterLevel": 3,
        "teamCount": 500,
        "achieveTime": 1640995200000
      }
    ],
    "myRank": {
      "rank": 12,
      "masterLevel": 1,
      "teamCount": 127
    }
  }
}
```

## WebSocket实时通信

### 连接地址
```
wss://domain.com/ws?token=jwt_token_here
```

### 消息格式
```json
{
  "type": "notification",
  "data": {
    "title": "红包提醒",
    "message": "红包活动即将开始",
    "timestamp": 1640995200000
  }
}
```

### 消息类型
- `countdown_update`: 倒计时更新
- `redpacket_start`: 红包开始
- `redpacket_end`: 红包结束
- `task_complete`: 任务完成
- `team_update`: 团队更新
- `balance_update`: 余额更新

## 错误处理

### 常见错误码
- 1001: 用户不存在
- 1002: 密码错误
- 1003: 邀请码无效
- 2001: 用户状态不允许此操作
- 2002: 余额不足
- 2003: 提现限额超出
- 3001: 红包活动未开始
- 3002: 没有抢红包资格
- 4001: 任务不存在
- 4002: 任务已完成

### 错误响应示例
```json
{
  "code": 1002,
  "message": "密码错误",
  "data": null,
  "timestamp": 1640995200000
}
```