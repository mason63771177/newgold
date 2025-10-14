/**
 * 用户服务
 * 处理用户注册、激活时的TRC20地址生成和相关业务逻辑
 */

const User = require('../models/User');
const TatumService = require('./tatumService');
const { pool } = require('../config/database');

class UserService {
  constructor() {
    this.tatumService = new TatumService();
  }

  /**
   * 初始化服务
   */
  async init() {
    await this.tatumService.init();
  }

  /**
   * 创建用户并生成专属TRC20地址
   * @param {Object} userData - 用户数据
   * @returns {Object} 创建的用户对象
   */
  async createUserWithTRC20Address(userData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 1. 创建用户（使用原有的User.create方法）
      const user = await User.create(userData);
      
      // 2. 为用户生成专属TRC20充值地址
      const addressInfo = await this.tatumService.generateUserDepositAddress(user.id);
      
      // 3. 更新用户表，添加充值地址信息
      await connection.execute(
        `UPDATE users SET 
          deposit_address = ?, 
          address_derivation_index = ?, 
          deposit_address_created_at = NOW()
        WHERE id = ?`,
        [addressInfo.address, addressInfo.derivationIndex, user.id]
      );
      
      // 4. 创建地址监控订阅
      try {
        const subscriptionId = await this.tatumService.createAddressSubscription(addressInfo.address);
        
        // 更新订阅ID
        await connection.execute(
          'UPDATE users SET tatum_subscription_id = ? WHERE id = ?',
          [subscriptionId, user.id]
        );
        
        console.log(`✅ 用户${user.id}的地址监控订阅创建成功: ${subscriptionId}`);
      } catch (subscriptionError) {
        console.warn(`⚠️ 用户${user.id}的地址监控订阅创建失败:`, subscriptionError);
        // 监控订阅失败不影响用户创建，继续执行
      }
      
      await connection.commit();
      
      // 5. 重新获取完整的用户信息
      const updatedUser = await User.findById(user.id);
      
      console.log(`✅ 用户${user.id}创建成功，充值地址: ${addressInfo.address}`);
      
      return {
        user: updatedUser,
        depositAddress: addressInfo.address,
        derivationIndex: addressInfo.derivationIndex
      };
      
    } catch (error) {
      await connection.rollback();
      console.error('创建用户失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 激活用户时的处理逻辑
   * @param {number} userId - 用户ID
   * @returns {Object} 激活结果
   */
  async activateUser(userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 1. 获取用户信息
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }
      
      // 2. 检查用户是否已有充值地址，如果没有则生成
      if (!user.deposit_address) {
        const addressInfo = await this.tatumService.generateUserDepositAddress(userId);
        
        await connection.execute(
          `UPDATE users SET 
            deposit_address = ?, 
            address_derivation_index = ?, 
            deposit_address_created_at = NOW()
          WHERE id = ?`,
          [addressInfo.address, addressInfo.derivationIndex, userId]
        );
        
        // 创建地址监控订阅
        try {
          const subscriptionId = await this.tatumService.createAddressSubscription(addressInfo.address);
          await connection.execute(
            'UPDATE users SET tatum_subscription_id = ? WHERE id = ?',
            [subscriptionId, userId]
          );
        } catch (subscriptionError) {
          console.warn(`⚠️ 用户${userId}的地址监控订阅创建失败:`, subscriptionError);
        }
        
        console.log(`✅ 为激活用户${userId}生成充值地址: ${addressInfo.address}`);
      }
      
      // 3. 更新用户状态为已激活
      await connection.execute(
        `UPDATE users SET 
          status = 2, 
          last_activation_time = NOW(),
          countdown_end_time = DATE_ADD(NOW(), INTERVAL 168 HOUR),
          activation_count = activation_count + 1
        WHERE id = ?`,
        [userId]
      );
      
      await connection.commit();
      
      const updatedUser = await User.findById(userId);
      
      console.log(`✅ 用户${userId}激活成功`);
      
      return {
        success: true,
        user: updatedUser
      };
      
    } catch (error) {
      await connection.rollback();
      console.error('激活用户失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 获取用户的充值地址信息
   * @param {number} userId - 用户ID
   * @returns {Object} 充值地址信息
   */
  async getUserDepositInfo(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }
      
      // 如果用户没有充值地址，生成一个
      if (!user.deposit_address) {
        const result = await this.createDepositAddressForUser(userId);
        return result;
      }
      
      // 获取地址余额
      const balances = await this.tatumService.getAddressBalances(user.deposit_address);
      
      return {
        address: user.deposit_address,
        derivationIndex: user.address_derivation_index,
        subscriptionId: user.tatum_subscription_id,
        createdAt: user.deposit_address_created_at,
        balances: balances
      };
      
    } catch (error) {
      console.error('获取用户充值信息失败:', error);
      throw error;
    }
  }

  /**
   * 为现有用户创建充值地址
   * @param {number} userId - 用户ID
   * @returns {Object} 地址信息
   */
  async createDepositAddressForUser(userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 确保TatumService已初始化
      await this.tatumService.ensureInitialized();
      
      const addressInfo = await this.tatumService.generateUserDepositAddress(userId);
      
      await connection.execute(
        `UPDATE users SET 
          deposit_address = ?, 
          address_derivation_index = ?, 
          deposit_address_created_at = NOW()
        WHERE id = ?`,
        [addressInfo.address, addressInfo.derivationIndex, userId]
      );
      
      // 创建地址监控订阅
      try {
        const subscriptionId = await this.tatumService.createAddressSubscription(addressInfo.address);
        await connection.execute(
          'UPDATE users SET tatum_subscription_id = ? WHERE id = ?',
          [subscriptionId, userId]
        );
        
        addressInfo.subscriptionId = subscriptionId;
      } catch (subscriptionError) {
        console.warn(`⚠️ 用户${userId}的地址监控订阅创建失败:`, subscriptionError);
      }
      
      await connection.commit();
      
      console.log(`✅ 为用户${userId}创建充值地址: ${addressInfo.address}`);
      
      return addressInfo;
      
    } catch (error) {
      await connection.rollback();
      console.error('为用户创建充值地址失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = UserService;