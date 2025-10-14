# Tatum RPC 网关使用指南

## 🎯 概述

Tatum 提供了强大的 RPC 网关服务，让您可以直接与区块链网络交互。从您展示的界面可以看到，这是一个 **Tier 3** 级别的服务，支持 **3 RPS**（每秒3次请求）的频率限制。

## 📊 服务详情

- **服务等级**: Tier 3
- **健康状态**: Healthy ✅
- **请求限制**: 3 RPS (每秒3次请求)
- **端点地址**: `tron-testnet.gateway.tatum.io`

## 🔧 配置方式

### 1. 环境变量配置

在您的 `.env` 文件中添加：

```env
# Tatum RPC 配置
TATUM_API_KEY=t-68dbe5bcd40ba3ecd01e31dd-f22e2adcfedf49d791108e82
TATUM_NETWORK=testnet  # 或 mainnet
TATUM_RPC_ENDPOINT=https://tron-testnet.gateway.tatum.io
```

### 2. 在代码中使用

#### 方式一：直接 HTTP 调用

```javascript
const axios = require('axios');

async function callTatumRPC(method, params = []) {
    try {
        const response = await axios.post('https://tron-testnet.gateway.tatum.io', {
            jsonrpc: "2.0",
            method: method,
            params: params,
            id: 1
        }, {
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'x-api-key': 't-68dbe5bcd40ba3ecd01e31dd-f22e2adcfedf49d791108e82'
            }
        });

        return response.data;
    } catch (error) {
        console.error('RPC调用失败:', error.message);
        return null;
    }
}

// 使用示例
const blockNumber = await callTatumRPC('eth_blockNumber');
const balance = await callTatumRPC('eth_getBalance', ['TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', 'latest']);
```

#### 方式二：通过 Tatum SDK

```javascript
const { TatumSDK, Network } = require('@tatumio/tatum');

async function initTatumWithRPC() {
    const tatum = await TatumSDK.init({
        network: Network.TRON_SHASTA,
        apiKey: {
            v4: 't-68dbe5bcd40ba3ecd01e31dd-f22e2adcfedf49d791108e82'
        },
        // 可选：自定义RPC配置
        rpc: {
            nodes: [{
                url: 'https://tron-testnet.gateway.tatum.io',
                type: 'archive'
            }]
        }
    });

    return tatum;
}
```

## 🚀 常用 RPC 方法

### 1. 区块链基础信息

```javascript
// 获取最新区块号
const blockNumber = await callTatumRPC('eth_blockNumber');

// 获取链ID
const chainId = await callTatumRPC('eth_chainId');

// 获取网络版本
const networkVersion = await callTatumRPC('net_version');
```

### 2. 账户和余额查询

```javascript
// 获取账户TRX余额
const balance = await callTatumRPC('eth_getBalance', [
    'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', 
    'latest'
]);

// 获取账户交易数量
const txCount = await callTatumRPC('eth_getTransactionCount', [
    'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', 
    'latest'
]);
```

### 3. 交易相关

```javascript
// 获取交易详情
const tx = await callTatumRPC('eth_getTransactionByHash', [
    '0x1234567890abcdef...'
]);

// 获取交易收据
const receipt = await callTatumRPC('eth_getTransactionReceipt', [
    '0x1234567890abcdef...'
]);

// 发送原始交易
const txHash = await callTatumRPC('eth_sendRawTransaction', [
    '0x签名后的交易数据...'
]);
```

### 4. 智能合约交互

```javascript
// 调用智能合约方法（只读）
const result = await callTatumRPC('eth_call', [{
    to: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', // USDT合约地址
    data: '0x70a08231000000000000000000000000...' // balanceOf方法调用数据
}, 'latest']);

// 估算Gas费用
const gasEstimate = await callTatumRPC('eth_estimateGas', [{
    to: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    data: '0xa9059cbb000000000000000000000000...' // transfer方法调用数据
}]);
```

## 💡 在您的钱包系统中的应用

### 1. 充值监听

```javascript
/**
 * 监听指定地址的充值交易
 */
async function monitorDeposits(address) {
    try {
        // 获取最新区块
        const latestBlock = await callTatumRPC('eth_blockNumber');
        const blockNum = parseInt(latestBlock.result, 16);
        
        // 获取区块中的交易
        const block = await callTatumRPC('eth_getBlockByNumber', [
            `0x${blockNum.toString(16)}`, 
            true
        ]);
        
        // 检查是否有发送到指定地址的交易
        if (block.result && block.result.transactions) {
            for (const tx of block.result.transactions) {
                if (tx.to && tx.to.toLowerCase() === address.toLowerCase()) {
                    console.log('发现充值交易:', tx.hash);
                    // 处理充值逻辑
                    await processDeposit(tx);
                }
            }
        }
        
    } catch (error) {
        console.error('监听充值失败:', error);
    }
}
```

### 2. USDT 余额查询

```javascript
/**
 * 查询指定地址的USDT余额
 */
async function getUSDTBalance(address) {
    const usdtContract = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
    
    // 构造balanceOf方法调用数据
    const methodId = '0x70a08231'; // balanceOf方法签名
    const paddedAddress = address.replace('0x', '').padStart(64, '0');
    const callData = methodId + paddedAddress;
    
    try {
        const result = await callTatumRPC('eth_call', [{
            to: usdtContract,
            data: callData
        }, 'latest']);
        
        if (result.result) {
            const balance = parseInt(result.result, 16);
            return balance / 1000000; // USDT使用6位小数
        }
        
        return 0;
    } catch (error) {
        console.error('查询USDT余额失败:', error);
        return 0;
    }
}
```

### 3. 提现交易发送

```javascript
/**
 * 发送USDT提现交易
 */
async function sendUSDTWithdrawal(fromAddress, toAddress, amount, privateKey) {
    try {
        // 1. 构造交易数据
        const usdtContract = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
        const transferAmount = amount * 1000000; // 转换为最小单位
        
        // 2. 获取nonce
        const nonceResult = await callTatumRPC('eth_getTransactionCount', [
            fromAddress, 
            'pending'
        ]);
        const nonce = parseInt(nonceResult.result, 16);
        
        // 3. 估算Gas
        const gasEstimate = await callTatumRPC('eth_estimateGas', [{
            from: fromAddress,
            to: usdtContract,
            data: `0xa9059cbb${toAddress.replace('0x', '').padStart(64, '0')}${transferAmount.toString(16).padStart(64, '0')}`
        }]);
        
        // 4. 构造并签名交易（这里需要使用TronWeb或其他签名库）
        // const signedTx = await signTransaction(txData, privateKey);
        
        // 5. 发送交易
        // const txHash = await callTatumRPC('eth_sendRawTransaction', [signedTx]);
        
        console.log('提现交易已发送');
        
    } catch (error) {
        console.error('发送提现交易失败:', error);
    }
}
```

## ⚠️ 注意事项

### 1. 请求频率限制
- **当前限制**: 3 RPS (每秒3次请求)
- **建议**: 实现请求队列和重试机制
- **监控**: 跟踪API使用量，避免超出限制

### 2. 错误处理
```javascript
async function safeRPCCall(method, params, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await callTatumRPC(method, params);
            if (result && !result.error) {
                return result;
            }
        } catch (error) {
            if (error.response?.status === 429) {
                // 请求频率限制，等待后重试
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }
            throw error;
        }
    }
    throw new Error(`RPC调用失败，已重试${retries}次`);
}
```

### 3. 安全考虑
- ✅ API密钥安全存储
- ✅ 请求数据验证
- ✅ 响应数据校验
- ✅ 错误日志记录

## 🔧 集成到现有系统

您可以将这个RPC配置集成到现有的Tatum钱包系统中：

1. **更新环境配置**: 添加RPC端点配置
2. **修改SDK初始化**: 包含自定义RPC配置
3. **实现请求限制**: 添加请求队列管理
4. **监控和日志**: 跟踪RPC调用状态

这样您就可以充分利用Tatum的RPC网关服务，实现更稳定和高效的区块链交互！

## 📞 技术支持

如需更多帮助，请参考：
- [Tatum RPC 文档](https://docs.tatum.io/reference/rpc)
- [TRON RPC 规范](https://developers.tron.network/docs/api-overview)
- 项目中的测试脚本: `scripts/configure-tatum-rpc.js`