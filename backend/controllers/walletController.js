const UserService = require('../services/userService');
const TatumService = require('../services/tatumService');
const { pool } = require('../config/database');

/**
 * 钱包控制器
 * 处理钱包相关的业务逻辑
 */
class WalletController {
  constructor() {
    // 钱包配置
    this.walletConfig = {
      withdrawFee: 5.0,        // 提现手续费 USDT
      minWithdraw: 10.0,       // 最小提现金额 USDT
      maxWithdraw: 10000.0,    // 最大提现金额 USDT
      dailyWithdrawLimit: 50000.0, // 每日提现限额 USDT
      supportedNetworks: ['TRC20'], // 支持的网络
      processingTime: '1-30分钟'    // 处理时间
    };
  }

  /**
   * 获取用户充值地址
   */
  async getDepositAddress(req, res) {
    try {
      const userId = req.query?.userId || req.user?.id;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }

      // 获取或创建用户充值地址
      const userService = new UserService();
      const result = await userService.createDepositAddressForUser(userId);
      
      res.json({
        success: true,
        data: {
          address: result.address,
          network: 'TRC20'
        }
      });
      
    } catch (error) {
      console.error('获取充值地址失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取钱包信息
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getWalletInfo(req, res) {
    try {
      const userId = req.user.id;
      
      const connection = await pool.getConnection();
      try {
        // 获取用户余额信息
        const [users] = await connection.execute(
          'SELECT balance, frozen_balance, total_earnings, deposit_address FROM users WHERE id = ?',
          [userId]
        );
        
        if (users.length === 0) {
          return res.status(404).json({
            success: false,
            message: '用户不存在'
          });
        }
        
        const user = users[0];
        
        // 如果用户没有充值地址，生成一个
        let depositAddress = user.deposit_address;
        if (!depositAddress) {
          const addressInfo = await UserService.getUserDepositInfo(userId);
          depositAddress = addressInfo.address;
        }
        
        res.json({
          success: true,
          data: {
            balance: parseFloat(user.balance) || 0,
            frozenBalance: parseFloat(user.frozen_balance) || 0,
            totalEarnings: parseFloat(user.total_earnings) || 0,
            depositAddress: depositAddress,
            config: this.walletConfig
          }
        });
        
      } finally {
        connection.release();
      }
      
    } catch (error) {
      console.error('获取钱包信息失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取用户余额
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getBalance(req, res) {
    try {
      const userId = req.user.id;
      
      const connection = await pool.getConnection();
      try {
        const [users] = await connection.execute(
          'SELECT balance, frozen_balance FROM users WHERE id = ?',
          [userId]
        );
        
        if (users.length === 0) {
          return res.status(404).json({
            success: false,
            message: '用户不存在'
          });
        }
        
        const user = users[0];
        
        res.json({
          success: true,
          data: {
            balance: parseFloat(user.balance) || 0,
            frozenBalance: parseFloat(user.frozen_balance) || 0,
            availableBalance: (parseFloat(user.balance) || 0) - (parseFloat(user.frozen_balance) || 0)
          }
        });
        
      } finally {
        connection.release();
      }
      
    } catch (error) {
      console.error('获取余额失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * USDT提现
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async withdraw(req, res) {
    try {
      const userId = req.user.id;
      const { amount, toAddress, network = 'TRC20' } = req.body;
      
      // 参数验证
      if (!amount || !toAddress) {
        return res.status(400).json({
          success: false,
          message: '提现金额和地址不能为空'
        });
      }
      
      const withdrawAmount = parseFloat(amount);
      if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: '提现金额必须大于0'
        });
      }
      
      if (withdrawAmount < this.walletConfig.minWithdraw) {
        return res.status(400).json({
          success: false,
          message: `最小提现金额为 ${this.walletConfig.minWithdraw} USDT`
        });
      }
      
      if (withdrawAmount > this.walletConfig.maxWithdraw) {
        return res.status(400).json({
          success: false,
          message: `最大提现金额为 ${this.walletConfig.maxWithdraw} USDT`
        });
      }
      
      // 验证地址格式（TRON地址）- 放宽验证规则
      if (network === 'TRC20' && (!toAddress.startsWith('T') || toAddress.length < 30 || toAddress.length > 40)) {
        return res.status(400).json({
          success: false,
          message: '无效的TRON地址格式'
        });
      }
      
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        
        // 获取用户余额
        const [users] = await connection.execute(
          'SELECT balance, frozen_balance FROM users WHERE id = ? FOR UPDATE',
          [userId]
        );
        
        if (users.length === 0) {
          await connection.rollback();
          return res.status(404).json({
            success: false,
            message: '用户不存在'
          });
        }
        
        const user = users[0];
        const currentBalance = parseFloat(user.balance) || 0;
        const frozenBalance = parseFloat(user.frozen_balance) || 0;
        const availableBalance = currentBalance - frozenBalance;
        const totalAmount = withdrawAmount + this.walletConfig.withdrawFee;
        
        // 检查余额是否足够
        if (availableBalance < totalAmount) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: `余额不足，可用余额: ${availableBalance.toFixed(2)} USDT，需要: ${totalAmount.toFixed(2)} USDT（含手续费 ${this.walletConfig.withdrawFee} USDT）`
          });
        }
        
        // 检查每日提现限额
        const today = new Date().toISOString().split('T')[0];
        const [dailyWithdraws] = await connection.execute(
          `SELECT COALESCE(SUM(amount), 0) as daily_total 
           FROM transactions 
           WHERE user_id = ? AND type = 'withdrawal' 
           AND DATE(created_at) = ? AND status IN ('pending', 'completed')`,
          [userId, today]
        );
        
        const dailyTotal = parseFloat(dailyWithdraws[0].daily_total) || 0;
        if (dailyTotal + withdrawAmount > this.walletConfig.dailyWithdrawLimit) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: `超出每日提现限额，今日已提现: ${dailyTotal.toFixed(2)} USDT，限额: ${this.walletConfig.dailyWithdrawLimit} USDT`
          });
        }
        
        // 冻结提现金额
        await connection.execute(
          'UPDATE users SET frozen_balance = frozen_balance + ? WHERE id = ?',
          [totalAmount, userId]
        );
        
        // 创建提现记录
        const [result] = await connection.execute(
          `INSERT INTO transactions (
            user_id, type, amount, fee, status, to_address, network, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [userId, 'withdrawal', withdrawAmount, this.walletConfig.withdrawFee, 'pending', toAddress, network]
        );
        
        const transactionId = result.insertId;
        
        await connection.commit();
        
        // 异步处理提现（实际项目中应该使用队列）
        this.processWithdrawal(transactionId).catch(error => {
          console.error('处理提现失败:', error);
        });
        
        res.json({
          success: true,
          message: '提现申请已提交，正在处理中',
          data: {
            transactionId: transactionId,
            amount: withdrawAmount,
            fee: this.walletConfig.withdrawFee,
            toAddress: toAddress,
            network: network,
            estimatedTime: this.walletConfig.processingTime
          }
        });
        
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
      
    } catch (error) {
      console.error('提现失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 处理提现（异步）
   * @param {number} transactionId - 交易ID
   */
  async processWithdrawal(transactionId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // 获取交易信息
      const [transactions] = await connection.execute(
        `SELECT t.*, u.balance, u.frozen_balance 
         FROM transactions t 
         JOIN users u ON t.user_id = u.id 
         WHERE t.id = ? AND t.status = 'pending'`,
        [transactionId]
      );
      
      if (transactions.length === 0) {
        console.log('交易不存在或已处理:', transactionId);
        return;
      }
      
      const transaction = transactions[0];
      const totalAmount = parseFloat(transaction.amount) + parseFloat(transaction.fee);
      
      try {
        // 使用Tatum API进行真实的TRC20 USDT提现
        console.log(`🚀 处理提现: ${transaction.amount} USDT 到 ${transaction.to_address}`);
        
        // 初始化Tatum服务
        const tatumService = new TatumService();
        await tatumService.init();
        
        // 发送USDT到目标地址
        const txHash = await tatumService.sendUsdt(
          process.env.PAYMENT_PRIVATE_KEY,
          transaction.to_address,
          transaction.amount
        );
        
        console.log(`✅ 区块链交易成功: TxHash ${txHash}`);
        
        // 更新交易状态为成功
        await connection.execute(
          'UPDATE transactions SET status = ?, tx_hash = ?, processed_at = NOW() WHERE id = ?',
          ['completed', txHash, transactionId]
        );
        
        // 扣除用户余额和解冻
        await connection.execute(
          'UPDATE users SET balance = balance - ?, frozen_balance = frozen_balance - ? WHERE id = ?',
          [totalAmount, totalAmount, transaction.user_id]
        );
        
        await connection.commit();
        
        console.log(`✅ 提现完成: 交易ID ${transactionId}, TxHash: ${txHash}`);
        
      } catch (error) {
        console.error('区块链交易失败:', error);
        
        // 更新交易状态为失败
        await connection.execute(
          'UPDATE transactions SET status = ?, error_message = ? WHERE id = ?',
          ['failed', error.message, transactionId]
        );
        
        // 解冻资金
        await connection.execute(
          'UPDATE users SET frozen_balance = frozen_balance - ? WHERE id = ?',
          [totalAmount, transaction.user_id]
        );
        
        await connection.commit();
        
        console.log(`❌ 提现失败: 交易ID ${transactionId}, 已解冻资金`);
      }
      
    } catch (error) {
      await connection.rollback();
      console.error('处理提现异常:', error);
    } finally {
      connection.release();
    }
  }

  /**
   * 获取交易历史
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getTransactions(req, res) {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 20, type } = req.query || {};
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      let whereClause = 'WHERE user_id = ?';
      let params = [userId];
      
      if (type && ['deposit', 'withdrawal'].includes(type)) {
        whereClause += ' AND type = ?';
        params.push(type);
      }
      
      const connection = await pool.getConnection();
      try {
        // 获取交易记录 - 使用字符串拼接而不是参数绑定LIMIT和OFFSET
        const [transactions] = await connection.execute(
          `SELECT id, type, amount, fee, status, tx_hash, to_address, from_address, 
                  network, error_message, created_at, processed_at
           FROM transactions 
           ${whereClause}
           ORDER BY created_at DESC 
           LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
          params
        );
        
        // 获取总数 - 使用相同的参数绑定方式
        const [countResult] = await connection.execute(
          `SELECT COUNT(*) as total FROM transactions ${whereClause}`,
          params
        );
        
        const total = countResult[0].total;
        
        res.json({
          success: true,
          data: {
            transactions: transactions.map(tx => ({
              ...tx,
              amount: parseFloat(tx.amount),
              fee: parseFloat(tx.fee) || 0
            })),
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: total,
              pages: Math.ceil(total / parseInt(limit))
            }
          }
        });
        
      } finally {
        connection.release();
      }
      
    } catch (error) {
      console.error('获取交易历史失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 绑定提现地址
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async bindAddress(req, res) {
    try {
      const userId = req.user.id;
      const { address, network = 'TRC20', label } = req.body;
      
      if (!address) {
        return res.status(400).json({
          success: false,
          message: '地址不能为空'
        });
      }
      
      // 验证地址格式
      if (network === 'TRC20' && (!address.startsWith('T') || address.length !== 34)) {
        return res.status(400).json({
          success: false,
          message: '无效的TRON地址格式'
        });
      }
      
      const connection = await pool.getConnection();
      try {
        // 检查地址是否已绑定
        const [existing] = await connection.execute(
          'SELECT id FROM user_addresses WHERE user_id = ? AND address = ?',
          [userId, address]
        );
        
        if (existing.length > 0) {
          return res.status(400).json({
            success: false,
            message: '该地址已绑定'
          });
        }
        
        // 绑定地址
        await connection.execute(
          `INSERT INTO user_addresses (user_id, address, network, label, created_at) 
           VALUES (?, ?, ?, ?, NOW())`,
          [userId, address, network, label || '']
        );
        
        res.json({
          success: true,
          message: '地址绑定成功'
        });
        
      } finally {
        connection.release();
      }
      
    } catch (error) {
      console.error('绑定地址失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取绑定的地址列表
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getAddresses(req, res) {
    try {
      const userId = req.user.id;
      
      const connection = await pool.getConnection();
      try {
        const [addresses] = await connection.execute(
          'SELECT id, address, network, label, created_at FROM user_addresses WHERE user_id = ? ORDER BY created_at DESC',
          [userId]
        );
        
        res.json({
          success: true,
          data: addresses
        });
        
      } finally {
        connection.release();
      }
      
    } catch (error) {
      console.error('获取地址列表失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 兼容旧版本的方法
  async withdrawLegacy(req, res) {
    return this.withdraw(req, res);
  }

  async getTransactionsLegacy(req, res) {
    return this.getTransactions(req, res);
  }
}

module.exports = {
  getWalletInfo: (req, res) => new WalletController().getWalletInfo(req, res),
  getBalance: (req, res) => new WalletController().getBalance(req, res),
  getDepositAddress: (req, res) => new WalletController().getDepositAddress(req, res),
  withdraw: (req, res) => new WalletController().withdraw(req, res),
  getTransactions: (req, res) => new WalletController().getTransactions(req, res),
  bindAddress: (req, res) => new WalletController().bindAddress(req, res),
  getAddresses: (req, res) => new WalletController().getAddresses(req, res),
  withdrawLegacy: (req, res) => new WalletController().withdrawLegacy(req, res),
  getTransactionsLegacy: (req, res) => new WalletController().getTransactionsLegacy(req, res),
  processWithdrawal: (transactionId) => new WalletController().processWithdrawal(transactionId)
};