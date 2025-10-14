const crypto = require('crypto');
const WalletAddress = require('../models/WalletAddress');
const PendingTransaction = require('../models/PendingTransaction');
const TatumService = require('./tatumService');

class TRC20Service {
  constructor() {
    this.isInitialized = false;
    this.addressPool = [];
    this.monitoringAddresses = new Map();
    this.tatumService = new TatumService(); // 添加TatumService实例
  }

  // 初始化服务
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // 初始化TatumService
      await this.tatumService.init();
      
      // 预生成钱包地址池
      await this.generateAddressPool(50);
      
      // 启动交易监听器
      this.startTransactionMonitor();
      
      this.isInitialized = true;
      console.log('TRC20Service 初始化完成');
    } catch (error) {
      console.error('TRC20Service 初始化失败:', error);
      throw error;
    }
  }

  // 生成钱包地址池
  async generateAddressPool(count = 50) {
    try {
      console.log(`开始生成 ${count} 个钱包地址...`);
      
      for (let i = 0; i < count; i++) {
        const addressData = await this.generateTRC20Address(); // 添加await
        await WalletAddress.create(addressData);
      }
      
      console.log(`成功生成 ${count} 个钱包地址`);
    } catch (error) {
      console.error('生成钱包地址池失败:', error);
      throw error;
    }
  }

  // 生成TRC20地址（使用Tatum生成真实可控地址）
  async generateTRC20Address(userId = null) {
    try {
      // 如果没有提供userId，生成一个唯一的ID用于地址派生
      const addressUserId = userId || `pool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 使用TatumService生成真实可控的地址
      const addressInfo = await this.tatumService.generateUserDepositAddress(addressUserId);
      
      return {
        address: addressInfo.address,
        privateKey: addressInfo.privateKey,
        derivationIndex: addressInfo.derivationIndex,
        userId: null // 地址池中的地址不分配给特定用户，设为null
      };
    } catch (error) {
      console.error('生成TRC20地址失败:', error);
      throw error;
    }
  }

  // 为用户分配钱包地址（使用Tatum生成）
  async assignWalletAddress(userId, type = 'activation') {
    try {
      // 直接为用户生成专属的Tatum地址
      console.log(`为用户${userId}生成专属TRC20地址...`);
      const addressInfo = await this.tatumService.generateUserDepositAddress(userId);
      
      // 创建钱包地址记录
      const walletAddress = await WalletAddress.create({
        address: addressInfo.address,
        userId: userId,
        status: 'assigned',
        type: type,
        derivationIndex: addressInfo.derivationIndex,
        privateKey: addressInfo.privateKey // 注意：生产环境中应该加密存储
      });
      
      // 开始监听这个地址
      this.startAddressMonitoring(addressInfo.address);
      
      console.log(`✅ 为用户${userId}分配地址成功: ${addressInfo.address}`);
      return walletAddress;
    } catch (error) {
      console.error('分配钱包地址失败:', error);
      throw error;
    }
  }

  // 开始监听地址
  startAddressMonitoring(address) {
    if (this.monitoringAddresses.has(address)) {
      return; // 已在监听中
    }
    
    console.log(`开始监听地址: ${address}`);
    this.monitoringAddresses.set(address, {
      startTime: Date.now(),
      lastCheck: Date.now()
    });
  }

  // 停止监听地址
  stopAddressMonitoring(address) {
    if (this.monitoringAddresses.has(address)) {
      console.log(`停止监听地址: ${address}`);
      this.monitoringAddresses.delete(address);
    }
  }

  // 启动交易监听器
  startTransactionMonitor() {
    console.log('启动交易监听器...');
    
    // 每30秒检查一次待确认交易
    setInterval(async () => {
      try {
        await this.checkPendingTransactions();
      } catch (error) {
        console.error('检查待确认交易失败:', error);
      }
    }, 30000);

    // 每5分钟清理过期交易
    setInterval(async () => {
      try {
        const cleaned = await PendingTransaction.cleanupExpiredTransactions();
        if (cleaned > 0) {
          console.log(`清理了 ${cleaned} 个过期交易`);
        }
      } catch (error) {
        console.error('清理过期交易失败:', error);
      }
    }, 5 * 60 * 1000);

    // 模拟链上交易确认（每分钟随机确认一些交易）
    setInterval(async () => {
      try {
        await this.simulateTransactionConfirmations();
      } catch (error) {
        console.error('模拟交易确认失败:', error);
      }
    }, 60000);
  }

  // 检查待确认交易
  async checkPendingTransactions() {
    try {
      const pendingTransactions = await PendingTransaction.findPending();
      
      for (const transaction of pendingTransactions) {
        // 检查是否过期
        if (transaction.isExpired()) {
          await transaction.updateStatus('failed');
          this.stopAddressMonitoring(transaction.walletAddress);
          continue;
        }
        
        // 模拟查询链上交易状态
        const chainStatus = await this.queryChainTransaction(transaction.walletAddress);
        
        if (chainStatus.found) {
          await this.processFoundTransaction(transaction, chainStatus);
        }
      }
    } catch (error) {
      console.error('检查待确认交易失败:', error);
    }
  }

  // 查询链上交易（模拟）
  async queryChainTransaction(address) {
    // 模拟链上查询延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 30% 概率找到交易
    const found = Math.random() < 0.3;
    
    if (found) {
      return {
        found: true,
        txHash: this.generateTxHash(),
        amount: 100, // 模拟金额
        confirmations: Math.floor(Math.random() * 3) + 1,
        blockNumber: Math.floor(Math.random() * 1000000) + 50000000,
        timestamp: Date.now()
      };
    }
    
    return { found: false };
  }

  // 处理找到的交易
  async processFoundTransaction(transaction, chainStatus) {
    try {
      // 验证金额
      if (Math.abs(chainStatus.amount - transaction.expectedAmount) > 0.01) {
        console.log(`交易金额不匹配: 期望 ${transaction.expectedAmount}, 实际 ${chainStatus.amount}`);
        return;
      }
      
      // 更新交易状态
      if (chainStatus.confirmations >= transaction.requiredConfirmations) {
        // 足够确认数，标记为已确认
        await transaction.updateStatus('confirmed', chainStatus.txHash, chainStatus.amount, chainStatus.confirmations);
        
        // 处理业务逻辑
        await this.processConfirmedTransaction(transaction);
        
        // 停止监听
        this.stopAddressMonitoring(transaction.walletAddress);
      } else {
        // 确认数不足，标记为确认中
        await transaction.updateStatus('confirming', chainStatus.txHash, chainStatus.amount, chainStatus.confirmations);
      }
    } catch (error) {
      console.error('处理找到的交易失败:', error);
    }
  }

  // 处理已确认的交易
  async processConfirmedTransaction(transaction) {
    try {
      console.log(`交易已确认: ${transaction.orderId}, 金额: ${transaction.actualAmount} USDT`);
      
      // 根据交易类型处理业务逻辑
      switch (transaction.type) {
        case 'activation':
          await this.processActivationConfirmation(transaction);
          break;
        case 'recharge':
          await this.processRechargeConfirmation(transaction);
          break;
        default:
          console.log(`未知交易类型: ${transaction.type}`);
      }
    } catch (error) {
      console.error('处理已确认交易失败:', error);
    }
  }

  // 处理激活确认
  async processActivationConfirmation(transaction) {
    try {
      const User = require('../models/User');
      const user = await User.findById(transaction.userId);
      
      if (!user) {
        console.error(`用户不存在: ${transaction.userId}`);
        return;
      }
      
      // 设置168小时倒计时
      const countdownEndTime = new Date(Date.now() + 168 * 60 * 60 * 1000);
      
      // 更新用户状态为已激活
      await user.updateStatus(2, countdownEndTime);
      
      // 如果有邀请人，发放奖励
      if (user.inviter_id) {
        await this.processInviterReward(user.inviter_id, user.id, 10);
      }
      
      console.log(`用户 ${transaction.userId} 激活成功`);
    } catch (error) {
      console.error('处理激活确认失败:', error);
    }
  }

  // 处理充值确认
  async processRechargeConfirmation(transaction) {
    try {
      const User = require('../models/User');
      const user = await User.findById(transaction.userId);
      
      if (!user) {
        console.error(`用户不存在: ${transaction.userId}`);
        return;
      }
      
      // 增加用户余额
      await user.updateBalance(transaction.actualAmount);
      
      console.log(`用户 ${transaction.userId} 充值 ${transaction.actualAmount} USDT 成功`);
    } catch (error) {
      console.error('处理充值确认失败:', error);
    }
  }

  // 检查支付是否已收到
  async checkPaymentReceived(walletAddress, expectedAmount) {
    try {
      // 查找对应的待确认交易
      const pendingTransactions = await PendingTransaction.findPending();
      const transaction = pendingTransactions.find(tx => 
        tx.walletAddress === walletAddress && 
        parseFloat(tx.amount) === parseFloat(expectedAmount)
      );
      
      if (!transaction) {
        console.log(`未找到对应的待确认交易: ${walletAddress}, ${expectedAmount}`);
        return false;
      }
      
      console.log(`检查交易: ${transaction.orderId}, 创建时间: ${transaction.createdAt}`);
      
      // 模拟检查链上交易状态
      // 在实际应用中，这里应该调用Tatum API或其他区块链API
      const chainStatus = await this.queryChainTransaction(walletAddress);
      
      if (chainStatus && chainStatus.confirmed) {
        console.log(`检测到支付确认: ${walletAddress}, 金额: ${chainStatus.amount}`);
        return true;
      }
      
      // 为了测试目的，添加一个简单的模拟逻辑
      // 如果交易创建超过30秒，模拟为已确认
      const now = new Date();
      const createdAt = new Date(transaction.createdAt || transaction.created_at);
      const transactionAge = now - createdAt;
      
      console.log(`交易年龄: ${transactionAge}ms (${Math.floor(transactionAge/1000)}秒)`);
      
      if (transactionAge > 30000) { // 30秒
        console.log(`模拟支付确认 (测试模式): ${walletAddress}, 交易年龄: ${Math.floor(transactionAge/1000)}秒`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('检查支付状态失败:', error);
      return false;
    }
  }

  // 处理邀请人奖励
  async processInviterReward(inviterId, inviteeId, amount) {
    try {
      const User = require('../models/User');
      const Transaction = require('../models/Transaction');
      
      const inviter = await User.findById(inviterId);
      if (!inviter) return;
      
      // 增加邀请人余额
      await inviter.updateBalance(amount);
      
      // 记录奖励交易
      await Transaction.create({
        userId: inviterId,
        type: 'invitation_reward',
        amount: amount,
        status: 'completed',
        description: `邀请奖励 - 用户${inviteeId}激活`
      });
      
      console.log(`邀请人 ${inviterId} 获得奖励 ${amount} USDT`);
    } catch (error) {
      console.error('处理邀请人奖励失败:', error);
    }
  }

  // 模拟交易确认
  async simulateTransactionConfirmations() {
    try {
      const confirmingTransactions = await PendingTransaction.getPendingTransactions();
      const confirmingOnly = confirmingTransactions.filter(tx => tx.status === 'confirming');
      
      for (const transaction of confirmingOnly) {
        // 50% 概率增加确认数
        if (Math.random() < 0.5) {
          const newConfirmations = transaction.confirmations + 1;
          
          if (newConfirmations >= transaction.requiredConfirmations) {
            // 达到所需确认数
            await transaction.updateStatus('confirmed', transaction.txHash, transaction.actualAmount, newConfirmations);
            await this.processConfirmedTransaction(transaction);
            this.stopAddressMonitoring(transaction.walletAddress);
          } else {
            // 更新确认数
            await transaction.updateStatus('confirming', transaction.txHash, transaction.actualAmount, newConfirmations);
          }
        }
      }
    } catch (error) {
      console.error('模拟交易确认失败:', error);
    }
  }

  // 生成交易哈希
  generateTxHash() {
    return crypto.randomBytes(32).toString('hex');
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

  // 格式化USDT金额
  static formatUSDT(amount) {
    return parseFloat(amount).toFixed(2);
  }

  // 获取服务状态
  getStatus() {
    return {
      initialized: this.isInitialized,
      monitoringAddresses: this.monitoringAddresses.size,
      addressPool: this.addressPool.length
    };
  }
}

// 创建单例实例
const trc20Service = new TRC20Service();

module.exports = trc20Service;