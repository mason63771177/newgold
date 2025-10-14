const PendingTransaction = require('../models/PendingTransaction');
const WalletAddress = require('../models/WalletAddress');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

class TransactionMonitor {
  constructor() {
    this.isRunning = false;
    this.checkInterval = 30000; // 30秒检查一次
    this.intervalId = null;
  }

  // 启动交易监听器
  start() {
    if (this.isRunning) {
      console.log('交易监听器已在运行中');
      return;
    }

    this.isRunning = true;
    console.log('启动交易监听器...');
    
    // 立即执行一次检查
    this.checkPendingTransactions();
    
    // 设置定时检查
    this.intervalId = setInterval(() => {
      this.checkPendingTransactions();
    }, this.checkInterval);
  }

  // 停止交易监听器
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('交易监听器已停止');
  }

  // 检查待确认交易
  async checkPendingTransactions() {
    try {
      console.log('检查待确认交易...');
      
      // 获取所有待确认的交易
      const pendingTransactions = await PendingTransaction.findPending();
      
      for (const transaction of pendingTransactions) {
        await this.processTransaction(transaction);
      }

      // 清理过期交易
      await this.cleanupExpiredTransactions();
      
    } catch (error) {
      console.error('检查交易时发生错误:', error);
    }
  }

  // 处理单个交易
  async processTransaction(transaction) {
    try {
      // 检查交易是否过期
      if (transaction.isExpired()) {
        console.log(`交易 ${transaction.id} 已过期，标记为失败`);
        await transaction.updateStatus('failed');
        return;
      }

      // 模拟链上确认检查
      const isConfirmed = await this.simulateTransactionConfirmation(transaction);
      
      if (isConfirmed) {
        console.log(`交易 ${transaction.id} 已确认`);
        await this.handleConfirmedTransaction(transaction);
      } else {
        // 更新为确认中状态
        if (transaction.status === 'pending') {
          await transaction.updateStatus('confirming');
        }
      }
      
    } catch (error) {
      console.error(`处理交易 ${transaction.id} 时发生错误:`, error);
      await transaction.updateStatus('failed');
    }
  }

  // 模拟交易确认（在实际项目中应调用区块链API）
  async simulateTransactionConfirmation(transaction) {
    // 模拟确认逻辑：交易创建后2-5分钟内随机确认
    const now = new Date();
    const createdAt = new Date(transaction.createdAt);
    const timeDiff = now - createdAt;
    
    // 2分钟内不确认
    if (timeDiff < 2 * 60 * 1000) {
      return false;
    }
    
    // 2-5分钟内随机确认
    if (timeDiff < 5 * 60 * 1000) {
      // 30%的概率确认
      return Math.random() < 0.3;
    }
    
    // 5分钟后必定确认
    return true;
  }

  // 处理已确认的交易
  async handleConfirmedTransaction(transaction) {
    try {
      // 更新交易状态为已确认
      await transaction.updateStatus('confirmed');
      
      // 根据交易类型处理业务逻辑
      switch (transaction.type) {
        case 'activation':
          await this.handleActivationTransaction(transaction);
          break;
        case 'recharge':
          await this.handleRechargeTransaction(transaction);
          break;
        default:
          console.log(`未知交易类型: ${transaction.type}`);
      }
      
    } catch (error) {
      console.error('处理已确认交易时发生错误:', error);
      throw error;
    }
  }

  // 处理激活交易
  async handleActivationTransaction(transaction) {
    try {
      console.log(`处理激活交易: ${transaction.orderId}`);
      
      // 获取用户信息
      const user = await User.findById(transaction.userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      // 更新用户状态为已激活
      await user.updateStatus(2);
      
      // 创建交易记录
      await Transaction.create({
        userId: transaction.userId,
        type: 'activation',
        amount: transaction.amount,
        status: 'completed',
        orderId: transaction.orderId,
        walletAddress: transaction.walletAddress,
        txHash: transaction.txHash || `mock_tx_${Date.now()}`
      });

      // 处理邀请人奖励
      if (user.invitedBy) {
        await this.handleInviterReward(user.invitedBy, transaction.amount);
      }

      console.log(`用户 ${user.id} 激活成功`);
      
    } catch (error) {
      console.error('处理激活交易失败:', error);
      throw error;
    }
  }

  // 处理充值交易
  async handleRechargeTransaction(transaction) {
    try {
      console.log(`处理充值交易: ${transaction.orderId}`);
      
      // 获取用户信息
      const user = await User.findById(transaction.userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      // 增加用户余额
      await user.addBalance(transaction.amount);
      
      // 创建交易记录
      await Transaction.create({
        userId: transaction.userId,
        type: 'recharge',
        amount: transaction.amount,
        status: 'completed',
        orderId: transaction.orderId,
        walletAddress: transaction.walletAddress,
        txHash: transaction.txHash || `mock_tx_${Date.now()}`
      });

      console.log(`用户 ${user.id} 充值 ${transaction.amount} USDT 成功`);
      
    } catch (error) {
      console.error('处理充值交易失败:', error);
      throw error;
    }
  }

  // 处理邀请人奖励
  async handleInviterReward(inviterId, activationAmount) {
    try {
      const inviter = await User.findById(inviterId);
      if (!inviter) {
        console.log(`邀请人 ${inviterId} 不存在`);
        return;
      }

      // 计算奖励金额（激活金额的10%）
      const rewardAmount = activationAmount * 0.1;
      
      // 增加邀请人余额
      await inviter.addBalance(rewardAmount);
      
      // 创建奖励交易记录
      await Transaction.create({
        userId: inviterId,
        type: 'invitation_reward',
        amount: rewardAmount,
        status: 'completed',
        orderId: `reward_${Date.now()}_${inviterId}`,
        description: `邀请奖励 - 被邀请人激活`
      });

      console.log(`邀请人 ${inviterId} 获得奖励 ${rewardAmount} USDT`);
      
    } catch (error) {
      console.error('处理邀请人奖励失败:', error);
    }
  }

  // 清理过期交易
  async cleanupExpiredTransactions() {
    try {
      await PendingTransaction.cleanupExpired();
    } catch (error) {
      console.error('清理过期交易失败:', error);
    }
  }

  // 获取监听器状态
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
      lastCheck: new Date().toISOString()
    };
  }
}

module.exports = new TransactionMonitor();