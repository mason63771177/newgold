const { pool } = require('../config/database');
const crypto = require('crypto');

class WalletAddress {
  constructor(data) {
    this.id = data.id;
    this.address = data.address;
    this.userId = data.userId || null;
    this.status = data.status || 'available'; // available, assigned, used
    this.type = data.type || 'activation'; // activation, recharge
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.assignedAt = data.assignedAt || null;
  }

  // 创建钱包地址
  static async create(addressData) {
    try {
      const connection = await pool.getConnection();
      
      try {
        const [result] = await connection.execute(
          `INSERT INTO wallet_addresses (address, user_id, status, type, created_at, updated_at) 
           VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [
            addressData.address,
            addressData.userId || null,
            addressData.status || 'available',
            addressData.type || 'activation'
          ]
        );
        
        return new WalletAddress({
          id: result.insertId,
          ...addressData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
      } finally {
        connection.release();
      }
      
    } catch (error) {
      // 如果数据库不可用，使用内存存储
      if (error.code === 'ECONNREFUSED' || error.code === 'ER_BAD_DB_ERROR') {
        console.warn('数据库不可用，使用内存存储钱包地址');
        
        // 简单的内存存储实现
        if (!global.memoryWalletAddresses) {
          global.memoryWalletAddresses = [];
        }
        
        const walletAddress = new WalletAddress({
          id: Date.now(),
          ...addressData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        global.memoryWalletAddresses.push(walletAddress);
        return walletAddress;
      }
      
      console.error('创建钱包地址失败:', error);
      throw error;
    }
  }

  // 查找可用的钱包地址
  static async findAvailable(type = 'activation', limit = 1) {
    try {
      const connection = await pool.getConnection();
      
      try {
        const [rows] = await connection.execute(
          `SELECT * FROM wallet_addresses 
           WHERE status = 'available' AND type = ? 
           ORDER BY created_at ASC 
           LIMIT ?`,
          [type, limit]
        );
        
        return rows.map(row => new WalletAddress(row));
        
      } finally {
        connection.release();
      }
      
    } catch (error) {
      // 如果数据库不可用，使用内存存储
      if (error.code === 'ECONNREFUSED' || error.code === 'ER_BAD_DB_ERROR') {
        console.warn('数据库不可用，使用内存存储查找钱包地址');
        
        if (!global.memoryWalletAddresses) {
          return [];
        }
        
        return global.memoryWalletAddresses
          .filter(addr => addr.status === 'available' && addr.type === type)
          .slice(0, limit);
      }
      
      console.error('查找可用钱包地址失败:', error);
      throw error;
    }
  }

  // 分配钱包地址给用户
  static async assign(addressId, userId) {
    try {
      const connection = await pool.getConnection();
      
      try {
        await connection.execute(
          `UPDATE wallet_addresses 
           SET status = 'assigned', user_id = ?, assigned_at = NOW(), updated_at = NOW() 
           WHERE id = ? AND status = 'available'`,
          [userId, addressId]
        );
        
        return await WalletAddress.findById(addressId);
        
      } finally {
        connection.release();
      }
      
    } catch (error) {
      // 如果数据库不可用，使用内存存储
      if (error.code === 'ECONNREFUSED' || error.code === 'ER_BAD_DB_ERROR') {
        console.warn('数据库不可用，使用内存存储分配钱包地址');
        
        if (!global.memoryWalletAddresses) {
          return null;
        }
        
        const address = global.memoryWalletAddresses.find(addr => addr.id === addressId);
        if (address && address.status === 'available') {
          address.status = 'assigned';
          address.userId = userId;
          address.assignedAt = new Date();
          address.updatedAt = new Date();
          return address;
        }
        
        return null;
      }
      
      console.error('分配钱包地址失败:', error);
      throw error;
    }
  }

  // 根据ID查找钱包地址
  static async findById(id) {
    try {
      const connection = await pool.getConnection();
      
      try {
        const [rows] = await connection.execute(
          'SELECT * FROM wallet_addresses WHERE id = ?',
          [id]
        );
        
        return rows.length > 0 ? new WalletAddress(rows[0]) : null;
        
      } finally {
        connection.release();
      }
      
    } catch (error) {
      // 如果数据库不可用，使用内存存储
      if (error.code === 'ECONNREFUSED' || error.code === 'ER_BAD_DB_ERROR') {
        console.warn('数据库不可用，使用内存存储查找钱包地址');
        
        if (!global.memoryWalletAddresses) {
          return null;
        }
        
        return global.memoryWalletAddresses.find(addr => addr.id === id) || null;
      }
      
      console.error('查找钱包地址失败:', error);
      throw error;
    }
  }

  // 根据地址查找钱包地址
  static async findByAddress(address) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM wallet_addresses WHERE address = ?',
        [address]
      );
      
      return rows.length > 0 ? new WalletAddress(rows[0]) : null;
    } catch (error) {
      console.error('查找钱包地址失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // 获取可用的钱包地址
  static async getAvailableAddress() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM wallet_addresses WHERE status = "available" ORDER BY created_at ASC LIMIT 1'
      );
      
      return rows.length > 0 ? new WalletAddress(rows[0]) : null;
    } catch (error) {
      console.error('获取可用钱包地址失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // 分配钱包地址给用户
  async assignToUser(userId) {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `UPDATE wallet_addresses 
         SET user_id = ?, status = 'assigned', assigned_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [userId, this.id]
      );
      
      this.userId = userId;
      this.status = 'assigned';
      this.assignedAt = new Date();
      this.updatedAt = new Date();
      
      return this;
    } catch (error) {
      console.error('分配钱包地址失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // 根据用户ID查找钱包地址
  static async findByUserId(userId) {
    try {
      const connection = await pool.getConnection();
      
      try {
        const [rows] = await connection.execute(
          'SELECT * FROM wallet_addresses WHERE user_id = ? ORDER BY created_at DESC',
          [userId]
        );
        
        return rows.map(row => new WalletAddress(row));
        
      } finally {
        connection.release();
      }
      
    } catch (error) {
      // 如果数据库不可用，使用内存存储
      if (error.code === 'ECONNREFUSED' || error.code === 'ER_BAD_DB_ERROR') {
        console.warn('数据库不可用，使用内存存储查找用户钱包地址');
        
        if (!global.memoryWalletAddresses) {
          return [];
        }
        
        return global.memoryWalletAddresses
          .filter(addr => addr.userId === userId)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      
      console.error('查找用户钱包地址失败:', error);
      throw error;
    }
  }

  // 释放钱包地址（重新设为可用）
  async release() {
    try {
      const connection = await pool.getConnection();
      
      try {
        await connection.execute(
          `UPDATE wallet_addresses 
           SET status = 'available', user_id = NULL, assigned_at = NULL, updated_at = NOW() 
           WHERE id = ?`,
          [this.id]
        );
        
        this.status = 'available';
        this.userId = null;
        this.assignedAt = null;
        this.updatedAt = new Date();
        
      } finally {
        connection.release();
      }
      
    } catch (error) {
      // 如果数据库不可用，使用内存存储
      if (error.code === 'ECONNREFUSED' || error.code === 'ER_BAD_DB_ERROR') {
        console.warn('数据库不可用，使用内存存储释放钱包地址');
        
        this.status = 'available';
        this.userId = null;
        this.assignedAt = null;
        this.updatedAt = new Date();
        return;
      }
      
      console.error('释放钱包地址失败:', error);
      throw error;
    }
  }

  // 标记钱包地址为已使用
  async markAsUsed() {
    try {
      const connection = await pool.getConnection();
      
      try {
        await connection.execute(
          'UPDATE wallet_addresses SET status = "used", updated_at = NOW() WHERE id = ?',
          [this.id]
        );
        
        this.status = 'used';
        this.updatedAt = new Date();
        
      } finally {
        connection.release();
      }
      
    } catch (error) {
      // 如果数据库不可用，使用内存存储
      if (error.code === 'ECONNREFUSED' || error.code === 'ER_BAD_DB_ERROR') {
        console.warn('数据库不可用，使用内存存储标记钱包地址');
        
        this.status = 'used';
        this.updatedAt = new Date();
        return;
      }
      
      console.error('标记钱包地址失败:', error);
      throw error;
    }
  }

  // 转换为安全对象（用于API响应）
  toSafeObject() {
    return {
      id: this.id,
      address: this.address,
      status: this.status,
      type: this.type,
      assignedAt: this.assignedAt,
      createdAt: this.createdAt
    };
  }
}

module.exports = WalletAddress;