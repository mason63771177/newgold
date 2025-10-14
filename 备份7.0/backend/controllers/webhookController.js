const UserService = require('../services/userService');
const TatumService = require('../services/tatumService');
const pool = require('../config/database');

/**
 * Webhook控制器
 * 处理区块链交易通知
 */
class WebhookController {
  
  /**
   * 处理Tatum充值通知
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  static async handleTatumWebhook(req, res) {
    try {
      console.log('📨 收到Tatum Webhook通知:', JSON.stringify(req.body, null, 2));
      
      const { 
        subscriptionType,
        txId,
        blockNumber,
        address,
        amount,
        asset,
        counterAddress,
        direction
      } = req.body;
      
      // 只处理入账交易
      if (direction !== 'in') {
        console.log('⏭️ 跳过出账交易:', txId);
        return res.status(200).json({ status: 'ignored', reason: 'outgoing transaction' });
      }
      
      // 只处理USDT交易
      if (asset !== 'USDT') {
        console.log('⏭️ 跳过非USDT交易:', txId, 'asset:', asset);
        return res.status(200).json({ status: 'ignored', reason: 'not USDT transaction' });
      }
      
      // 查找对应的用户
      const connection = await pool.getConnection();
      try {
        const [users] = await connection.execute(
          'SELECT id, username, balance FROM users WHERE deposit_address = ?',
          [address]
        );
        
        if (users.length === 0) {
          console.log('⚠️ 未找到对应用户的充值地址:', address);
          return res.status(200).json({ status: 'ignored', reason: 'address not found' });
        }
        
        const user = users[0];
        const depositAmount = parseFloat(amount);
        
        console.log(`💰 用户 ${user.username} (ID: ${user.id}) 充值 ${depositAmount} USDT`);
        
        // 检查交易是否已处理
        const [existingTx] = await connection.execute(
          'SELECT id FROM transactions WHERE tx_hash = ?',
          [txId]
        );
        
        if (existingTx.length > 0) {
          console.log('⚠️ 交易已处理:', txId);
          return res.status(200).json({ status: 'ignored', reason: 'transaction already processed' });
        }
        
        // 开始事务
        await connection.beginTransaction();
        
        try {
          // 更新用户余额
          await connection.execute(
            'UPDATE users SET balance = balance + ?, total_earnings = total_earnings + ? WHERE id = ?',
            [depositAmount, depositAmount, user.id]
          );
          
          // 记录交易
          await connection.execute(
            `INSERT INTO transactions (
              user_id, type, amount, status, tx_hash, 
              from_address, to_address, block_number, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              user.id,
              'deposit',
              depositAmount,
              'completed',
              txId,
              counterAddress,
              address,
              blockNumber
            ]
          );
          
          // 提交事务
          await connection.commit();
          
          console.log(`✅ 充值处理完成: 用户${user.id} +${depositAmount} USDT`);
          
          res.status(200).json({ 
            status: 'success', 
            message: 'Deposit processed successfully',
            userId: user.id,
            amount: depositAmount
          });
          
        } catch (error) {
          await connection.rollback();
          throw error;
        }
        
      } finally {
        connection.release();
      }
      
    } catch (error) {
      console.error('❌ Webhook处理失败:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Internal server error' 
      });
    }
  }
  
  /**
   * 测试webhook端点
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  static async testWebhook(req, res) {
    try {
      res.json({ 
        status: 'ok', 
        message: 'Webhook endpoint is working',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('测试webhook失败:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = WebhookController;