# Tatum虚拟钱包与会员系统TRC20 USDT自动管理集成文档

## 概述

本文档详细说明了如何使用Tatum Virtual Accounts实现会员系统的TRC20 USDT自动管理，包括虚拟钱包创建、充值监听、自动归集和回调通知等功能。

## 系统架构

```
会员系统 ←→ Tatum虚拟钱包服务 ←→ Tatum API ←→ Tron区块链
    ↓              ↓                ↓
  数据库      Webhook回调      TRC20 USDT
```

## 核心功能

### 1. 虚拟钱包管理
- 为每个会员自动创建Tatum虚拟账户
- 生成专属TRC20 USDT充值地址
- 支持钱包信息查询和余额查询

### 2. 充值监听
- 自动监听链上TRC20 USDT入金交易
- 通过Webhook实时接收充值通知
- 自动更新会员余额和交易记录

### 3. 资金归集
- 支持单个用户资金归集
- 支持批量资金归集
- 自动转账到主钱包地址

### 4. 回调通知
- 向业务系统发送充值成功通知
- 包含会员ID、金额、时间、交易哈希等信息

## API接口文档

### 1. 创建虚拟钱包

**接口地址：** `POST /api/virtual-wallet/create`

**请求参数：**
```json
{
  "userId": "string",     // 会员ID（必填）
  "userName": "string"    // 会员名称（可选）
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "虚拟钱包创建成功",
  "data": {
    "userId": "user123",
    "virtualAccountId": "60f1b2e4c8d4f5a6b7c8d9e0",
    "depositAddress": "TQn9Y2khEsLJW1ChVbFVSyczK8QQWkcNFp",
    "currency": "USDT",
    "balance": "0",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. 获取钱包信息

**接口地址：** `GET /api/virtual-wallet/:userId`

**响应示例：**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "virtualAccountId": "60f1b2e4c8d4f5a6b7c8d9e0",
    "depositAddress": "TQn9Y2khEsLJW1ChVbFVSyczK8QQWkcNFp",
    "currency": "USDT",
    "balance": "100.50",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3. 获取钱包余额

**接口地址：** `GET /api/virtual-wallet/:userId/balance`

**响应示例：**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "currency": "USDT",
    "balance": "100.50",
    "lastUpdated": "2024-01-15T12:45:00.000Z"
  }
}
```

### 4. 获取充值历史

**接口地址：** `GET /api/virtual-wallet/:userId/deposits`

**查询参数：**
- `page`: 页码（默认1）
- `limit`: 每页数量（默认10）
- `startDate`: 开始日期
- `endDate`: 结束日期

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": "user123",
      "virtualAccountId": "60f1b2e4c8d4f5a6b7c8d9e0",
      "txHash": "0x1234567890abcdef...",
      "amount": "50.00",
      "currency": "USDT",
      "fromAddress": "TFromAddress123...",
      "toAddress": "TQn9Y2khEsLJW1ChVbFVSyczK8QQWkcNFp",
      "blockNumber": 12345678,
      "status": "confirmed",
      "createdAt": "2024-01-15T11:20:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### 5. 资金归集

**单用户归集：** `POST /api/virtual-wallet/:userId/consolidate`

**批量归集：** `POST /api/virtual-wallet/consolidate-all`

**响应示例：**
```json
{
  "success": true,
  "message": "资金归集成功",
  "data": {
    "consolidationId": "cons_123456",
    "userId": "user123",
    "amount": "100.50",
    "txHash": "0xabcdef1234567890...",
    "status": "completed",
    "createdAt": "2024-01-15T13:00:00.000Z"
  }
}
```

## Webhook回调

### 1. Tatum Webhook接收

**接口地址：** `POST /api/tatum/webhook`

**Tatum发送的数据格式：**
```json
{
  "subscriptionType": "INCOMING_FUNGIBLE_TX",
  "accountId": "60f1b2e4c8d4f5a6b7c8d9e0",
  "currency": "USDT",
  "amount": "50.00",
  "blockNumber": 12345678,
  "txId": "0x1234567890abcdef...",
  "from": "TFromAddress123...",
  "to": "TQn9Y2khEsLJW1ChVbFVSyczK8QQWkcNFp",
  "date": 1642248000000,
  "reference": "deposit_reference"
}
```

### 2. 业务系统回调

当检测到充值成功时，系统会向配置的业务回调URL发送通知：

**回调地址：** 配置在 `BUSINESS_CALLBACK_URL`

**回调数据格式：**
```json
{
  "type": "deposit_success",
  "userId": "user123",
  "amount": "50.00",
  "currency": "USDT",
  "txHash": "0x1234567890abcdef...",
  "depositAddress": "TQn9Y2khEsLJW1ChVbFVSyczK8QQWkcNFp",
  "fromAddress": "TFromAddress123...",
  "blockNumber": 12345678,
  "timestamp": 1642248000000,
  "reference": "deposit_reference"
}
```

## 配置说明

### 环境变量配置

```bash
# Tatum API配置
TATUM_API_KEY=t-68dbe5bcd40ba3ecd01e31dd-045e96ef02da4085857edebe
TATUM_NETWORK=tron-testnet
TATUM_ENVIRONMENT=testnet
TRON_GRID_API=https://api.shasta.trongrid.io
USDT_CONTRACT_ADDRESS=TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs
MASTER_WALLET_MNEMONIC=abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about

# Webhook配置
WEBHOOK_CALLBACK_URL=https://your-domain.com/api/tatum/webhook
BUSINESS_CALLBACK_URL=https://your-domain.com/api/business/deposit-callback
BUSINESS_API_KEY=your-business-api-key
```

### 数据库表结构

系统会自动创建以下数据表：

1. **member_virtual_accounts** - 会员虚拟账户信息
2. **member_deposits** - 会员充值记录
3. **fund_consolidations** - 资金归集记录
4. **webhook_subscriptions** - Webhook订阅记录
5. **balance_logs** - 余额变动日志
6. **webhook_logs** - Webhook日志

## 部署流程

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并配置相关参数。

### 3. 数据库迁移

```bash
mysql -u root gold7_game < database/migrations/create_virtual_accounts_tables.sql
```

### 4. 启动服务

```bash
npm start
```

### 5. 配置Webhook

系统启动后会自动配置Tatum Webhook订阅，监听TRC20 USDT入金交易。

## 测试流程

### 1. 运行测试脚本

```bash
node test/testVirtualWallet.js
```

### 2. 测试步骤

1. **创建虚拟钱包** - 为测试用户创建虚拟账户
2. **获取钱包信息** - 验证钱包创建成功
3. **模拟充值** - 发送模拟Webhook数据
4. **检查余额** - 验证余额更新
5. **查看历史** - 检查充值记录
6. **资金归集** - 测试归集功能

### 3. API测试

使用Postman或curl测试各个API接口：

```bash
# 创建虚拟钱包
curl -X POST http://localhost:3000/api/virtual-wallet/create \
  -H "Content-Type: application/json" \
  -d '{"userId":"test123","userName":"测试用户"}'

# 获取钱包信息
curl http://localhost:3000/api/virtual-wallet/test123

# 获取余额
curl http://localhost:3000/api/virtual-wallet/test123/balance
```

## 安全注意事项

1. **API密钥安全** - 妥善保管Tatum API密钥，不要泄露
2. **Webhook验证** - 验证Webhook来源的合法性
3. **数据加密** - 敏感数据进行加密存储
4. **访问控制** - 限制API访问权限
5. **日志记录** - 记录所有重要操作日志

## 监控和维护

1. **余额监控** - 定期检查虚拟账户余额
2. **交易监控** - 监控异常交易和失败交易
3. **Webhook监控** - 监控Webhook接收状态
4. **归集监控** - 监控资金归集执行情况

## 故障排除

### 常见问题

1. **Webhook接收失败**
   - 检查网络连接
   - 验证Webhook URL配置
   - 查看Webhook日志

2. **余额不更新**
   - 检查Tatum API连接
   - 验证交易确认状态
   - 查看数据库更新日志

3. **归集失败**
   - 检查主钱包余额
   - 验证网络手续费
   - 查看归集日志

### 日志查看

```bash
# 查看应用日志
tail -f logs/app.log

# 查看Webhook日志
tail -f logs/webhook.log

# 查看数据库日志
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 10;
```

## 联系支持

如有问题，请联系技术支持团队或查看Tatum官方文档：
- Tatum文档：https://docs.tatum.io/
- 技术支持：support@your-company.com