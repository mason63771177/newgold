const crypto = require('crypto');
const trc20Service = require('../services/TRC20Service');

class WalletUtils {
  // 生成TRC20钱包地址（使用TRC20服务）
  static async generateWalletAddress(userId, type = 'activation') {
    try {
      // 使用TRC20服务分配钱包地址
      const walletAddress = await trc20Service.assignWalletAddress(userId, type);
      return walletAddress.address;
    } catch (error) {
      console.error('生成钱包地址失败:', error);
      throw new Error('钱包地址生成失败');
    }
  }

  // 验证TRC20地址格式
  static validateTRC20Address(address) {
    if (!address || typeof address !== 'string') {
      return false;
    }
    
    // TRC20地址格式：T开头，34位字符
    const trc20Regex = /^T[A-Za-z0-9]{33}$/;
    return trc20Regex.test(address);
  }

  // 检查交易状态（模拟）
  static async checkTransactionStatus(txHash) {
    try {
      // 在实际项目中，这里应该调用TronGrid API查询交易状态
      // 目前返回模拟数据
      
      if (!txHash) {
        throw new Error('交易哈希不能为空');
      }

      // 模拟交易查询结果
      return {
        success: true,
        confirmed: true,
        amount: 100,
        from: 'TUserWalletAddress...',
        to: 'TSystemWalletAddress...',
        blockNumber: 12345678,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('查询交易状态失败:', error);
      return {
        success: false,
        confirmed: false,
        error: error.message
      };
    }
  }

  // 生成订单ID
  static generateOrderId(prefix = 'ORDER', userId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${userId}_${random}`;
  }

  // 格式化USDT金额
  static formatUSDT(amount) {
    return parseFloat(amount).toFixed(2);
  }

  // 验证USDT金额
  static validateUSDTAmount(amount, expectedAmount = null) {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      return {
        valid: false,
        message: '金额必须大于0'
      };
    }

    if (expectedAmount && Math.abs(numAmount - expectedAmount) > 0.01) {
      return {
        valid: false,
        message: `金额不匹配，期望${expectedAmount} USDT`
      };
    }

    return {
      valid: true,
      amount: numAmount
    };
  }
}

module.exports = WalletUtils;