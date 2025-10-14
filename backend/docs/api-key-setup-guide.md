# Tatum API密钥配置指南

## 概述
本指南将帮助您获取和配置Tatum API密钥，以便在裂金7日项目中使用Tatum的区块链服务。

## 获取API密钥

### 1. 注册Tatum账户
访问 [Tatum Dashboard](https://dashboard.tatum.io) 并注册一个免费账户。

### 2. 创建API密钥
1. 登录到Tatum Dashboard
2. 点击 "Create API key" 按钮
3. 选择计划（免费计划足够开发使用）
4. 设置API密钥名称并选择 **testnet**（测试网）
5. 点击 "Create API key"
6. 点击 "Show" 按钮并复制您的API密钥

### 3. 配置环境变量
将获取的API密钥配置到 `.env` 文件中：

```bash
# Tatum配置
TATUM_API_KEY=your_actual_testnet_api_key_here
TATUM_TESTNET=true
TATUM_NETWORK=testnet
```

## API密钥认证方法

Tatum支持多种认证方法，我们的项目使用 `x-api-key` 头部认证：

### 推荐方法：X-API-Key头部
```bash
curl 'https://tron-testnet.gateway.tatum.io' \
--header 'content-type: application/json' \
--header 'x-api-key: YOUR_API_KEY' \
--data '{
    "jsonrpc":"2.0",
    "method":"web3_clientVersion",
    "params":[],
    "id":1
}'
```

### 其他支持的认证方法
1. **Bearer Token**
   ```bash
   --header 'authorization: bearer YOUR_API_KEY'
   ```

2. **Basic Authentication**
   ```bash
   'https://x-api-key:YOUR_API_KEY@tron-testnet.gateway.tatum.io'
   ```

## 安全注意事项

⚠️ **重要安全提示：**
- 永远不要在客户端代码中暴露API密钥
- 不要将API密钥提交到版本控制系统
- 使用环境变量存储敏感信息
- 定期轮换API密钥

## 测试API密钥
配置完成后，运行以下命令测试API密钥是否正常工作：

```bash
cd backend
node tests/rpcIntegrationTest.js
```

如果配置正确，您应该看到大部分测试通过。

## 故障排除

### 401认证错误
- 检查API密钥是否正确复制
- 确认使用的是测试网API密钥
- 验证环境变量是否正确加载

### 获取更多帮助
- [Tatum官方文档](https://docs.tatum.io/docs/authentication)
- [Tatum Dashboard](https://dashboard.tatum.io)

## 免费账户限制
- 每秒5个API调用
- 每月有限的总请求数
- 如需更高限制，可升级到付费计划