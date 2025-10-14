const { pool } = require('../config/database');

class Transaction {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.type = data.type;
    this.amount = data.amount;
    this.status = data.status;
    this.description = data.description;
    this.orderId = data.order_id;
    this.walletAddress = data.wallet_address;
    this.txHash = data.tx_hash;
    this.relatedUserId = data.related_user_id;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // 创建交易记录
  static async create(transactionData) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        `INSERT INTO transactions (
          user_id, type, amount, status, description, 
          order_id, wallet_address, related_user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionData.userId,
          transactionData.type,
          transactionData.amount,
          transactionData.status || 'pending',
          transactionData.description,
          transactionData.orderId || null,
          transactionData.walletAddress || null,
          transactionData.relatedUserId || null
        ]
      );
      
      return await Transaction.findById(result.insertId);
    } finally {
      connection.release();
    }
  }

  // 根据ID查找交易
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM transactions WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? new Transaction(rows[0]) : null;
  }

  // 根据订单ID查找交易
  static async findByOrderId(orderId) {
    const [rows] = await pool.execute(
      'SELECT * FROM transactions WHERE order_id = ?',
      [orderId]
    );
    return rows.length > 0 ? new Transaction(rows[0]) : null;
  }

  // 根据用户ID和类型查找交易
  static async findByUserIdAndType(userId, type, limit = 50) {
    let query = `SELECT * FROM transactions 
       WHERE user_id = ? AND type = ? 
       ORDER BY created_at DESC`;
    let params = [userId, type];
    
    if (limit && limit > 0) {
      query += ` LIMIT ${parseInt(limit)}`;
    }
    
    const [rows] = await pool.execute(query, params);
    return rows.map(row => new Transaction(row));
  }

  // 根据用户ID查找所有交易
  static async findByUserId(userId, limit = 50) {
    let query = `SELECT * FROM transactions 
       WHERE user_id = ? 
       ORDER BY created_at DESC`;
    let params = [userId];
    
    if (limit && limit > 0) {
      query += ` LIMIT ${parseInt(limit)}`;
    }
    
    const [rows] = await pool.execute(query, params);
    return rows.map(row => new Transaction(row));
  }

  // 更新交易状态
  async updateStatus(newStatus, txHash = null) {
    const connection = await pool.getConnection();
    try {
      let query = 'UPDATE transactions SET status = ?, updated_at = NOW()';
      let params = [newStatus];
      
      if (txHash) {
        query += ', tx_hash = ?';
        params.push(txHash);
      }
      
      query += ' WHERE id = ?';
      params.push(this.id);
      
      await connection.execute(query, params);
      
      this.status = newStatus;
      if (txHash) {
        this.txHash = txHash;
      }
      
      return true;
    } finally {
      connection.release();
    }
  }

  // 获取用户交易统计
  static async getUserTransactionStats(userId) {
    const [rows] = await pool.execute(
      `SELECT 
        type,
        COUNT(*) as count,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_expense
      FROM transactions 
      WHERE user_id = ? AND status = 'completed'
      GROUP BY type`,
      [userId]
    );
    
    return rows;
  }

  // 获取系统交易统计
  static async getSystemStats() {
    const [rows] = await pool.execute(
      `SELECT 
        DATE(created_at) as date,
        type,
        COUNT(*) as count,
        SUM(ABS(amount)) as total_amount
      FROM transactions 
      WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at), type
      ORDER BY date DESC`
    );
    
    return rows;
  }

  // 获取待处理的激活交易
  static async getPendingActivations() {
    const [rows] = await pool.execute(
      `SELECT t.*, u.email, u.invite_code 
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       WHERE t.type = 'activation' AND t.status = 'pending'
       ORDER BY t.created_at ASC`
    );
    
    return rows.map(row => ({
      transaction: new Transaction(row),
      user: {
        email: row.email,
        inviteCode: row.invite_code
      }
    }));
  }

  // 转换为安全对象（用于API响应）
  toSafeObject() {
    return {
      id: this.id,
      type: this.type,
      amount: this.amount,
      status: this.status,
      description: this.description,
      orderId: this.orderId,
      walletAddress: this.walletAddress,
      txHash: this.txHash,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // 获取交易类型的中文名称
  getTypeDisplayName() {
    const typeNames = {
      'activation': '激活缴费',
      'repurchase': '复购缴费',
      'referral_reward': '邀请奖励',
      'task_reward': '任务奖励',
      'redpacket_reward': '红包奖励',
      'withdraw': '提现',
      'withdraw_fee': '提现手续费'
    };
    
    return typeNames[this.type] || this.type;
  }

  // 获取状态的中文名称
  getStatusDisplayName() {
    const statusNames = {
      'pending': '待确认',
      'completed': '已完成',
      'failed': '失败',
      'cancelled': '已取消'
    };
    
    return statusNames[this.status] || this.status;
  }
}

module.exports = Transaction;