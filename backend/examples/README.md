# Tatum 钱包管理演示

本目录包含 Tatum 钱包管理系统的演示脚本和示例代码。

## 📁 文件说明

### `wallet-management-demo.js`
完整的钱包管理演示脚本，展示：
- 主钱包生成
- 用户独有地址生成
- 余额查询
- 资金汇总
- 地址验证

## 🚀 运行演示

### 1. 环境准备
确保已安装必要依赖：
```bash
npm install @tatumio/tatum tronweb bip39 hdkey dotenv
```

### 2. 环境变量配置
在项目根目录的 `.env` 文件中添加：
```env
# Tatum API 配置
TATUM_API_KEY=your_tatum_api_key_here
TATUM_NETWORK=testnet  # 或 mainnet

# 主钱包配置（可选，演示会生成）
TATUM_MASTER_WALLET_MNEMONIC=your_master_wallet_mnemonic_here

# USDT 合约地址
USDT_CONTRACT_ADDRESS=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t

# 模拟模式（推荐用于演示）
TATUM_MOCK_MODE=true
```

### 3. 运行演示
```bash
# 进入后端目录
cd backend

# 运行完整演示
node examples/wallet-management-demo.js
```

## 📋 演示内容

### 1. 主钱包生成演示
- 生成12个单词的助记词
- 创建扩展公钥(xpub)
- 显示安全保存提示

### 2. 用户地址生成演示
- 为不同类型的用户ID生成地址
- 展示派生索引机制
- 验证地址唯一性

### 3. 余额检查演示
- 查询USDT余额
- 查询TRX余额
- 显示余额信息

### 4. 地址验证演示
- 验证TRON地址格式
- 测试有效和无效地址
- 展示验证结果

### 5. 批量资金汇总演示
- 检查用户地址余额
- 执行资金汇总操作
- 显示汇总结果统计

## 🔧 自定义配置

### 修改用户ID列表
在 `demoGenerateUserAddresses()` 方法中修改：
```javascript
const userIds = ['user_001', 'user_002', 'user_003', 12345, 67890];
```

### 修改汇总阈值
在 `demoBatchConsolidation()` 方法中修改：
```javascript
const minAmount = 0.1; // 最小汇总金额阈值
```

### 修改主钱包地址
在 `demoBatchConsolidation()` 方法中修改：
```javascript
const masterWalletAddress = 'TYourMasterWalletAddressHere123456789';
```

## ⚠️ 注意事项

1. **测试环境**：建议先在测试网(testnet)运行演示
2. **模拟模式**：设置 `TATUM_MOCK_MODE=true` 避免真实交易
3. **私钥安全**：演示中的私钥仅用于展示，生产环境需加密存储
4. **API限制**：注意Tatum API的调用频率限制

## 🔗 相关资源

- [Tatum官方文档](https://docs.tatum.io/)
- [TRON开发者文档](https://developers.tron.network/)
- [完整教程](../Tatum钱包管理教程.md)

## 📞 技术支持

如有问题，请参考：
1. 项目主目录的完整教程文档
2. Tatum官方文档
3. 项目的其他示例代码