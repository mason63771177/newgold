const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
    this.telegram_id = data.telegram_id;
    this.telegram_username = data.telegram_username;
    this.invite_code = data.invite_code;
    this.inviter_code = data.inviter_code;
    this.inviter_id = data.inviter_id;
    this.status = data.status || 1;
    this.balance = data.balance || 0;
    this.frozen_balance = data.frozen_balance || 0;
    this.total_earnings = data.total_earnings || 0;
    this.team_count = data.team_count || 0;
    this.activation_count = data.activation_count || 0;
    this.last_activation_time = data.last_activation_time;
    this.countdown_end_time = data.countdown_end_time;
    this.email_verified = data.email_verified || false;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // 创建用户
  static async create(userData) {
    const connection = await pool.getConnection();
    try {
      // 生成唯一邀请码
      const inviteCode = await User.generateUniqueInviteCode();
      
      // 加密密码
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // 查找邀请人
      let inviterId = null;
      if (userData.inviterCode) {
        const inviter = await User.findByInviteCode(userData.inviterCode);
        if (!inviter) {
          throw new Error('邀请码无效');
        }
        inviterId = inviter.id;
      }
      
      const [result] = await connection.execute(
        `INSERT INTO users (
          email, password, invite_code, inviter_code, inviter_id, 
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userData.email,
          hashedPassword,
          inviteCode,
          userData.inviterCode || null,
          inviterId,
          1 // 默认状态1：未激活
        ]
      );
      
      // 如果有邀请人，更新邀请人的团队数量
      if (inviterId) {
        await connection.execute(
          'UPDATE users SET team_count = team_count + 1 WHERE id = ?',
          [inviterId]
        );
        
        // 创建团队关系记录
        await connection.execute(
          `INSERT INTO team_relations (
            user_id, inviter_id, level, created_at
          ) VALUES (?, ?, 1, NOW())`,
          [result.insertId, inviterId]
        );
      }
      
      return await User.findById(result.insertId);
    } finally {
      connection.release();
    }
  }

  // 根据ID查找用户
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? new User(rows[0]) : null;
  }

  // 根据邮箱查找用户
  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows.length > 0 ? new User(rows[0]) : null;
  }

  // 根据邀请码查找用户
  static async findByInviteCode(inviteCode) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE invite_code = ?',
      [inviteCode]
    );
    return rows.length > 0 ? new User(rows[0]) : null;
  }

  // 验证密码
  async validatePassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  // 更新用户状态
  async updateStatus(newStatus, countdownEndTime = null) {
    const connection = await pool.getConnection();
    try {
      let query = 'UPDATE users SET status = ?, updated_at = NOW()';
      let params = [newStatus, this.id];
      
      if (countdownEndTime) {
        query += ', countdown_end_time = ?';
        params.splice(1, 0, countdownEndTime);
      }
      
      if (newStatus === 2) {
        // 激活时更新相关字段
        query += ', activation_count = activation_count + 1, last_activation_time = NOW()';
      }
      
      query += ' WHERE id = ?';
      
      await connection.execute(query, params);
      
      this.status = newStatus;
      if (countdownEndTime) {
        this.countdown_end_time = countdownEndTime;
      }
      
      return true;
    } finally {
      connection.release();
    }
  }

  // 更新余额
  async updateBalance(amount, type = 'add') {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      if (type === 'add') {
        await connection.execute(
          'UPDATE users SET balance = balance + ?, total_earnings = total_earnings + ?, updated_at = NOW() WHERE id = ?',
          [amount, amount, this.id]
        );
        this.balance += amount;
        this.total_earnings += amount;
      } else if (type === 'subtract') {
        // 检查余额是否足够
        if (this.balance < amount) {
          throw new Error('余额不足');
        }
        await connection.execute(
          'UPDATE users SET balance = balance - ?, updated_at = NOW() WHERE id = ?',
          [amount, this.id]
        );
        this.balance -= amount;
      }
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 获取团队信息
  async getTeamInfo() {
    const [rows] = await pool.execute(
      `SELECT 
        tr.level,
        COUNT(*) as count,
        SUM(CASE WHEN u.status >= 2 THEN 1 ELSE 0 END) as activated_count
      FROM team_relations tr
      JOIN users u ON tr.user_id = u.id
      WHERE tr.inviter_id = ? AND tr.level <= 7
      GROUP BY tr.level
      ORDER BY tr.level`,
      [this.id]
    );
    
    return rows;
  }

  // 设置邮箱验证token
  async setVerificationToken(token) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24小时后过期
    
    await pool.execute(
      'UPDATE users SET verification_token = ?, verification_token_expires = ?, updated_at = NOW() WHERE id = ?',
      [token, expiresAt, this.id]
    );
    
    this.verification_token = token;
    this.verification_token_expires = expiresAt;
  }

  // 验证邮箱
  async verifyEmail(token) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE verification_token = ? AND verification_token_expires > NOW()',
      [token]
    );
    
    if (rows.length === 0) {
      return { success: false, message: '验证链接无效或已过期' };
    }
    
    const user = rows[0];
    if (user.id !== this.id) {
      return { success: false, message: '验证链接与用户不匹配' };
    }
    
    await pool.execute(
      'UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL, updated_at = NOW() WHERE id = ?',
      [this.id]
    );
    
    this.email_verified = true;
    this.verification_token = null;
    this.verification_token_expires = null;
    
    return { success: true, message: '邮箱验证成功' };
  }

  // 根据验证token查找用户
  static async findByVerificationToken(token) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE verification_token = ? AND verification_token_expires > NOW()',
      [token]
    );
    return rows.length > 0 ? new User(rows[0]) : null;
  }

  // 设置密码重置token
  async setPasswordResetToken(token) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1小时后过期
    
    await pool.execute(
      'UPDATE users SET password_reset_token = ?, password_reset_expires = ?, updated_at = NOW() WHERE id = ?',
      [token, expiresAt, this.id]
    );
    
    this.password_reset_token = token;
    this.password_reset_expires = expiresAt;
  }

  // 根据密码重置token查找用户
  static async findByPasswordResetToken(token) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW()',
      [token]
    );
    return rows.length > 0 ? new User(rows[0]) : null;
  }

  // 重置密码
  async resetPassword(newPassword, token) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW()',
      [token]
    );
    
    if (rows.length === 0) {
      return { success: false, message: '重置链接无效或已过期' };
    }
    
    const user = rows[0];
    if (user.id !== this.id) {
      return { success: false, message: '重置链接与用户不匹配' };
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await pool.execute(
      'UPDATE users SET password = ?, password_reset_token = NULL, password_reset_expires = NULL, updated_at = NOW() WHERE id = ?',
      [hashedPassword, this.id]
    );
    
    this.password = hashedPassword;
    this.password_reset_token = null;
    this.password_reset_expires = null;
    
    return { success: true, message: '密码重置成功' };
  }

  // 重新发送验证邮件（检查是否可以重新发送）
  canResendVerificationEmail() {
    if (this.email_verified) {
      return { canSend: false, message: '邮箱已验证' };
    }
    
    // 如果没有token或token已过期，可以重新发送
    if (!this.verification_token || !this.verification_token_expires) {
      return { canSend: true };
    }
    
    const now = new Date();
    const tokenExpires = new Date(this.verification_token_expires);
    
    if (now > tokenExpires) {
      return { canSend: true };
    }
    
    // 检查是否距离上次发送超过5分钟
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const tokenCreated = new Date(tokenExpires.getTime() - 24 * 60 * 60 * 1000);
    
    if (tokenCreated < fiveMinutesAgo) {
      return { canSend: true };
    }
    
    return { canSend: false, message: '请等待5分钟后再重新发送' };
  }

  // 生成唯一邀请码
  static async generateUniqueInviteCode() {
    let inviteCode;
    let isUnique = false;
    
    while (!isUnique) {
      // 生成6位随机邀请码（数字+字母）
      inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // 检查是否已存在
      const existing = await User.findByInviteCode(inviteCode);
      if (!existing) {
        isUnique = true;
      }
    }
    
    return inviteCode;
  }

  // 获取用户的安全信息（不包含密码）
  toSafeObject() {
    const safeUser = { ...this };
    delete safeUser.password;
    return safeUser;
  }

  // 检查用户是否可以激活
  canActivate() {
    return this.status === 1 || this.status === 3;
  }

  // 检查倒计时是否结束
  isCountdownExpired() {
    if (!this.countdown_end_time) return false;
    return new Date() > new Date(this.countdown_end_time);
  }

  /**
   * 获取状态名称
   * @returns {string} 状态名称
   * @description 根据用户状态返回对应的中文名称
   */
  getStatusName() {
    const statusNames = {
      1: '新手未入金',
      2: '已入金168小时倒计时',
      3: '挑战失败'
    };
    return statusNames[this.status] || '未知状态';
  }
}

module.exports = User;