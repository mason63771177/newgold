# 手续费利润管理 API 文档

## 概述

手续费利润管理模块用于处理提币时的手续费利润分离功能。系统会自动计算客户支付的手续费与 Tatum 实际收取手续费之间的差额，并将利润转入指定的利润钱包。

## 基础信息

- **基础路径**: `/api/fee-profit`
- **认证方式**: Bearer Token (JWT)
- **内容类型**: `application/json`

## API 接口

### 1. 获取手续费利润统计

获取指定天数内的手续费利润统计数据。

**请求**
```
GET /api/fee-profit/stats?days=30
```

**查询参数**
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| days | number | 否 | 30 | 统计天数 |

**响应示例**
```json
{
  "success": true,
  "data": [
    {
      "profit_date": "2024-01-15",
      "total_records": 25,
      "completed_records": 23,
      "total_profit": 46.50,
      "avg_profit": 2.02,
      "max_profit": 5.00,
      "min_profit": 1.00
    }
  ],
  "message": "获取手续费利润统计成功"
}
```

### 2. 获取利润钱包余额

获取利润钱包的当前 USDT 余额。

**请求**
```
GET /api/fee-profit/balance
```

**响应示例**
```json
{
  "success": true,
  "data": {
    "balance": 1250.75,
    "address": "TProfit1234567890123456789012345"
  },
  "message": "获取利润钱包余额成功"
}
```

### 3. 获取手续费利润记录列表

分页获取手续费利润转账记录。

**请求**
```
GET /api/fee-profit/records?page=1&limit=20&status=completed
```

**查询参数**
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 20 | 每页数量 |
| status | string | 否 | null | 状态筛选 (pending/completed/failed) |
| startDate | string | 否 | null | 开始日期 (YYYY-MM-DD) |
| endDate | string | 否 | null | 结束日期 (YYYY-MM-DD) |

**响应示例**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": 1,
        "withdrawal_id": "12345",
        "original_amount": 100.00,
        "customer_fee": 3.00,
        "tatum_fee": 1.00,
        "profit_amount": 2.00,
        "profit_margin": 66.67,
        "profit_tx_hash": "0xabc123...",
        "profit_wallet_address": "TProfit1234567890123456789012345",
        "status": "completed",
        "error_message": null,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:31:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  },
  "message": "获取手续费利润记录成功"
}
```

### 4. 手动触发手续费利润转账

手动触发指定提币记录的手续费利润转账。

**请求**
```
POST /api/fee-profit/transfer/12345
```

**请求体**
```json
{
  "amount": 100.00,
  "txHash": "0xoriginal123..."
}
```

**参数说明**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| amount | number | 是 | 原始提币金额 |
| txHash | string | 是 | 原始提币交易哈希 |

**响应示例**
```json
{
  "success": true,
  "data": {
    "success": true,
    "profit": 2.00,
    "txHash": "0xprofit456...",
    "withdrawalId": "12345"
  },
  "message": "手续费利润转账成功"
}
```

### 5. 获取手续费配置信息

获取当前的手续费配置参数。

**请求**
```
GET /api/fee-profit/config
```

**响应示例**
```json
{
  "success": true,
  "data": {
    "customerFixedFee": 2.00,
    "customerPercentageFeeMin": 0.01,
    "customerPercentageFeeMax": 0.05,
    "tatumActualFee": 1.00,
    "profitWalletAddress": "TProfit1234567890123456789012345"
  },
  "message": "获取手续费配置成功"
}
```

## 错误响应

所有接口在发生错误时都会返回统一的错误格式：

```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息"
}
```

**常见错误码**
- `400`: 请求参数错误
- `401`: 未授权访问
- `404`: 资源不存在
- `500`: 服务器内部错误

## 手续费计算逻辑

### 客户手续费计算
- **固定手续费**: 2 USDT
- **百分比手续费**: 提币金额的 1% ~ 5%
- **总手续费**: 固定手续费 + 百分比手续费

### 利润计算
- **利润金额**: 客户手续费 - Tatum 实际手续费
- **利润率**: (利润金额 / 客户手续费) × 100%

### 示例计算
提币金额: 100 USDT
- 客户固定手续费: 2 USDT
- 客户百分比手续费: 100 × 1% = 1 USDT
- 客户总手续费: 2 + 1 = 3 USDT
- Tatum 实际手续费: 1 USDT
- 利润金额: 3 - 1 = 2 USDT
- 利润率: (2 / 3) × 100% = 66.67%

## 使用说明

1. **自动处理**: 用户提币时，系统会自动计算并转账手续费利润
2. **异步处理**: 利润转账采用异步处理，不会阻塞主要的提币流程
3. **错误重试**: 转账失败时会记录错误信息，可通过手动接口重试
4. **统计查询**: 提供多维度的利润统计和记录查询功能

## 安全注意事项

1. 所有接口都需要有效的 JWT Token 认证
2. 利润钱包私钥安全存储在环境变量中
3. 转账操作会记录完整的审计日志
4. 支持按日期和状态筛选记录，便于对账