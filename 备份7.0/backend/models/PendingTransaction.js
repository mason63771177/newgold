const { pool } = require('../config/database');

class PendingTransaction {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId || data.user_id;
    this.orderId = data.orderId || data.order_id;
    this.walletAddress = data.walletAddress || data.wallet_address;
    this.amount = parseFloat(data.amount);
    this.type = data.type; // activation, recharge
    this.status = data.status || 'pending'; // pending, confirming, confirmed, failed
    this.txHash = data.txHash || data.tx_hash || null;
    this.createdAt = data.createdAt || data.created_at || new Date();
    this.updatedAt = data.updatedAt || data.updated_at || new Date();
    this.expiresAt = data.expiresAt || data.expires_at || new Date(Date.now() + 30 * 60 * 1000); // 30分钟后过期
  }

  // 创建待确认交易
  static async create(transactionData) {
    try {
      const connection = await pool.getConnection();
      
      try {
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30分钟后过期
        
        const [result] = await connection.execute(
          `INSERT INTO pending_transactions (user_id, order_id, wallet_address, amount, type, status, expires_at, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, 'pending', ?, NOW(), NOW())`,
          [
            transactionData.userId,
            transactionData.orderId,
            transactionData.walletAddress,
            transactionData.amount,
            transactionData.type,
            expiresAt
          ]
        );
        
        return new PendingTransaction({
          id: result.insertId,
          ...transactionData,
          status: 'pending',
          expiresAt,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
      } finally {
        connection.release();
      }
      
    } catch (error) {
      // 如果数据库不可用，使用内存存储
      if (error.code === 'ECONNREFUSED' || error.code === 'ER_BAD_DB_ERROR') {
        console.warn('数据库不可用，使用内存存储待确认交易');
        
        if (!global.memoryPendingTransactions) {
          global.memoryPendingTransactions = [];
        }
        
        const transaction = new PendingTransaction({
          id: Date.now(),
          ...transactionData,
          status: 'pending',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        global.memoryPendingTransactions.push(transaction);
        return transaction;
      }
      
      console.error('创建待确认交易失败:', error);
      throw error;
    }
  }

  // 根据ID查找交易
  static async findById(id) {
    try {
      const connection = await pool.getConnection();
      
      try {
        const [rows] = await connection.execute(
          'SELECT * FROM pending_transactions WHERE id = ?',
          [id]
        );
        
        return rows.length > 0 ? new PendingTransaction(rows[0]) : null;
        
      } finally {
        connection.release();
      }
      
    } catch (error) {
      // 如果数据库不可用，从内存中查找
      if (error.code === 'ECONNREFUSED' || error.code === 'ER_BAD_DB_ERROR') {
        console.warn('数据库不可用，从内存中查找待确认交易');
        
        if (global.memoryPendingTransactions) {
          const transaction = global.memoryPendingTransactions.find(t => t.id === id);
          return transaction || null;
        }
        return null;
      }
      
      console.error('查找待确认交易失败:', error);
      throw error;
    }
  }

  // 根据订单ID查找交易
  static async findByOrderId(orderId) {
    try {
      const connection = await pool.getConnection();
      
      try {
        const [rows] = await connection.execute(
          'SELECT * FROM pending_transactions WHERE order_id = ?',
          [orderId]
        );
        
        return rows.length > 0 ? new PendingTransaction(rows[0]) : null;
        
      } finally {
        connection.release();
      }
      
    } catch (error) {
      // 如果数据库不可用，从内存中查找
      if (error.code === 'ECONNREFUSED' || error.code === 'ER_BAD_DB_ERROR') {
        console.warn('数据库不可用，从内存中查找待确认交易');
        
        if (global.memoryPendingTransactions) {
          const transaction = global.memoryPendingTransactions.find(t => t.orderId === orderId);
          return transaction || null;
        }
        return null;
      }
      
      console.error('查找待确认交易失败:', error);
      throw error;
    }
  }

  // 根据钱包地址查找交易
  static async findByWalletAddress(walletAddress) {
    try {
      const connection = await pool.getConnection();
      
      try {
        const [rows] = await connection.execute(
          'SELECT * FROM pending_transactions WHERE wallet_address = ? AND status IN (?, ?)',
          [walletAddress, 'pending', 'confirming']
        );
        
        return rows.map(row => new PendingTransaction(row));
        
      } finally {
        connection.release();
      }
      
    } catch (error) {
      // 如果数据库不可用，从内存中查找
      if (error.code === 'ECONNREFUSED' || error.code === 'ER_BAD_DB_ERROR') {
        console.warn('数据库不可用，从内存中查找待确认交易');
        
        if (global.memoryPendingTransactions) {
          return global.memoryPendingTransactions.filter(t => 
            t.walletAddress === walletAddress && 
            ['pending', 'confirming'].includes(t.status)
          );
        }
        return [];
      }
      
      console.error('查找待确认交易失败:', error);
      throw error;
    }
  }

  // 获取所有待确认的交易
  static async findPending() {
    try {
      const connection = await pool.getConnection();
      
      try {
        const [rows] = await connection.execute(
          'SELECT * FROM pending_transactions WHERE status IN (?, ?) AND expires_at > NOW()',
          ['pending', 'confirming']
        );
        
        return rows.map(row => new PendingTransaction(row));
        
      } finally {
        connection.release();
      }
      
    } catch (error) {
      // 如果数据库不可用，从内存中查找
      if (error.code === 'ECONNREFUSED' || error.code === 'ER_BAD_DB_ERROR') {
        console.warn('数据库不可用，从内存中查找待确认交易');
        
        if (global.memoryPendingTransactions) {
          const now = new Date();
          return global.memoryPendingTransactions.filter(t => 
            ['pending', 'confirming'].includes(t.status) && 
            new Date(t.expiresAt) > now
          );
        }
        return [];
      }
      
      console.error('查找待确认交易失败:', error);
      throw error;
    }
  }

  // 更新交易状态
  async updateStatus(status, txHash = null) {
    try {
      const connection = await pool.getConnection();
      
      try {
        this.status = status;
        this.updatedAt = new Date();
        
        if (txHash) {
          this.txHash = txHash;
        }
        
        await connection.execute(
          'UPDATE pending_transactions SET status = ?, tx_hash = ?, updated_at = NOW() WHERE id = ?',
          [status, txHash, this.id]
        );
        
      } finally {
        connection.release();
      }
      
    } catch (error) {
      // 如果数据库不可用，更新内存中的数据
      if (error.code === 'ECONNREFUSED' || error.code === 'ER_BAD_DB_ERROR') {
        console.warn('数据库不可用，更新内存中的待确认交易');
        
        if (global.memoryPendingTransactions) {
          const index = global.memoryPendingTransactions.findIndex(t => t.id === this.id);
          if (index !== -1) {
            global.memoryPendingTransactions[index].status = status;
            global.memoryPendingTransactions[index].updatedAt = new Date();
            if (txHash) {
              global.memoryPendingTransactions[index].txHash = txHash;
            }
          }
        }
        return;
      }
      
      console.error('更新交易状态失败:', error);
      throw error;
    }
  }

  // 确认交易
  async confirm(txHash) {
    await this.updateStatus('confirmed', txHash);
  }

  // 检查是否过期
  isExpired() {
    return new Date() > new Date(this.expiresAt);
  }

  // 根据ID删除交易
  static async deleteById(id) {
    try {
      const connection = await pool.getConnection();
      
      try {
        const [result] = await connection.execute(
          'DELETE FROM pending_transactions WHERE id = ?',
          [id]
        );
        
        return result.affectedRows > 0;
        
      } finally {
        connection.release();
      }
      
    } catch (error) {
      // 如果数据库不可用，从内存中删除
      if (error.code === 'ECONNREFUSED' || error.code === 'ER_BAD_DB_ERROR') {
        console.warn('数据库不可用，从内存中删除待确认交易');
        
        if (global.memoryPendingTransactions) {
          const index = global.memoryPendingTransactions.findIndex(t => t.id === id);
          if (index !== -1) {
            global.memoryPendingTransactions.splice(index, 1);
            return true;
          }
        }
        return false;
      }
      
      console.error('删除待确认交易失败:', error);
      throw error;
    }
  }

  // 清理过期交易
  static async cleanupExpired() {
    try {
      const connection = await pool.getConnection();
      
      try {
        const [result] = await connection.execute(
          'UPDATE pending_transactions SET status = ? WHERE expires_at < NOW() AND status IN (?, ?)',
          ['failed', 'pending', 'confirming']
        );
        
        console.log(`清理了 ${result.affectedRows} 个过期交易`);
        
      } finally {
        connection.release();
      }
      
    } catch (error) {
      // 如果数据库不可用，清理内存中的过期交易
      if (error.code === 'ECONNREFUSED' || error.code === 'ER_BAD_DB_ERROR') {
        console.warn('数据库不可用，清理内存中的过期交易');
        
        if (global.memoryPendingTransactions) {
          const now = new Date();
          let cleanedCount = 0;
          
          global.memoryPendingTransactions.forEach(transaction => {
            if (new Date(transaction.expiresAt) < now && 
                ['pending', 'confirming'].includes(transaction.status)) {
              transaction.status = 'failed';
              cleanedCount++;
            }
          });
          
          console.log(`清理了 ${cleanedCount} 个过期交易`);
        }
        return;
      }
      
      console.error('清理过期交易失败:', error);
      throw error;
    }
  }

  // 转换为安全对象（不包含敏感信息）
  toSafeObject() {
    return {
      id: this.id,
      orderId: this.orderId,
      walletAddress: this.walletAddress,
      amount: this.amount,
      type: this.type,
      status: this.status,
      txHash: this.txHash,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      expiresAt: this.expiresAt,
      isExpired: this.isExpired()
    };
  }
}

module.exports = PendingTransaction;