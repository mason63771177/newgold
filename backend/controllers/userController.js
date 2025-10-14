const User = require('../models/User');
const { validationResult } = require('express-validator');
const { pool } = require('../config/database');

/**
 * 用户控制器类
 * 处理用户相关的业务逻辑，包括用户信息管理、状态更新、团队信息等
 * @class UserController
 * @author H5游戏化金融产品开发团队
 * @version 1.0.0
 */
class UserController {
  /**
   * 获取用户详细信息
   * @static
   * @async
   * @param {Object} req - Express请求对象
   * @param {Object} req.user - 认证用户信息
   * @param {number} req.user.id - 用户ID
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>} 返回用户信息的JSON响应
   * @description 根据JWT token中的用户ID获取用户详细信息
   * @example
   * // GET /api/user/info
   * // Headers: Authorization: Bearer <token>
   * // Response: { success: true, data: { user: {...} } }
   */
  static async getUserInfo(req, res) {
    try {
      const userId = req.user.id; // 修改为使用id而不是userId
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      res.json({
        success: true,
        message: '获取用户信息成功',
        data: {
          user: user.toSafeObject()
        }
      });
    } catch (error) {
      console.error('获取用户信息失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 更新用户状态
   * @static
   * @async
   * @param {Object} req - Express请求对象
   * @param {Object} req.user - 认证用户信息
   * @param {number} req.user.id - 用户ID
   * @param {Object} req.body - 请求体
   * @param {number} req.body.status - 新的用户状态
   * @param {string} [req.body.countdownEndTime] - 倒计时结束时间
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>} 返回状态更新结果的JSON响应
   * @description 更新用户的状态，支持状态转换验证
   */
  static async updateUserStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '参数验证失败',
          errors: errors.array()
        });
      }

      const userId = req.user.id; // 修改为使用id而不是userId
      const { status, countdownEndTime } = req.body;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 验证状态切换的合法性
      const isValidTransition = UserController.validateStatusTransition(user.status, status);
      if (!isValidTransition) {
        return res.status(400).json({
          success: false,
          message: '无效的状态切换'
        });
      }

      // 更新用户状态
      await user.updateStatus(status, countdownEndTime);

      res.json({
        success: true,
        message: '状态更新成功',
        data: {
          status: status,
          countdownEndTime: countdownEndTime
        }
      });
    } catch (error) {
      console.error('更新用户状态失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取用户状态详情
   * @static
   * @async
   * @param {Object} req - Express请求对象
   * @param {Object} req.user - 认证用户信息
   * @param {number} req.user.id - 用户ID
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>} 返回用户状态详情的JSON响应
   * @description 获取用户当前状态、倒计时信息和各种权限状态
   * @example
   * // GET /api/user/status
   * // Headers: Authorization: Bearer <token>
   * // Response: { success: true, data: { status: 2, remainingHours: 24, ... } }
   */
  static async getUserStatus(req, res) {
    try {
      const userId = req.user.id; // 修改为使用id而不是userId
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 计算剩余时间
      let remainingHours = 0;
      if (user.countdown_end_time) {
        const now = new Date();
        const endTime = new Date(user.countdown_end_time);
        const diffMs = endTime.getTime() - now.getTime();
        remainingHours = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
      }

      // 判断各种权限
      const canActivate = user.status === 1; // 只有新手未入金状态可以激活
      const canGrabRedPacket = user.status === 2; // 已入金168小时倒计时
      const canReactivate = user.status === 3; // 挑战失败状态可以再次激活

      res.json({
        success: true,
        message: '获取状态成功',
        data: {
          status: user.status,
          statusName: user.getStatusName(),
          countdownEndTime: user.countdown_end_time,
          remainingHours: remainingHours,
          canActivate: canActivate,
          canGrabRedPacket: canGrabRedPacket,
          canReactivate: canReactivate,
          activationCount: user.activation_count,
          lastActivationTime: user.last_activation_time,
          balance: parseFloat(user.balance),
          frozenBalance: parseFloat(user.frozen_balance),
          totalEarnings: parseFloat(user.total_earnings),
          teamCount: user.team_count
        }
      });
    } catch (error) {
      console.error('获取用户状态失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 验证状态切换的合法性
   * @static
   * @param {number} currentStatus - 当前状态
   * @param {number} newStatus - 新状态
   * @returns {boolean} 返回状态切换是否合法
   * @description 验证用户状态切换是否符合业务规则
   * @example
   * // 验证从状态1切换到状态2是否合法
   * const isValid = UserController.validateStatusTransition(1, 2); // true
   */
  static validateStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      1: [2], // 新手未入金 -> 168小时倒计时中
      2: [3], // 168小时倒计时中 -> 倒计时结束未复购
      3: [2]  // 倒计时结束未复购 -> 168小时倒计时中（再次入金）
    };

    return validTransitions[currentStatus] && validTransitions[currentStatus].includes(newStatus);
  }

  /**
   * 获取用户团队信息
   * @static
   * @async
   * @param {Object} req - Express请求对象
   * @param {Object} req.user - 认证用户信息
   * @param {number} req.user.id - 用户ID
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>} 返回团队信息的JSON响应
   * @description 获取用户直接邀请的团队成员信息，包括总数和活跃成员数
   * @example
   * // GET /api/user/team
   * // Headers: Authorization: Bearer <token>
   * // Response: { success: true, data: { totalMembers: 5, activeMembers: 3, members: [...] } }
   */
  static async getUserTeam(req, res) {
    try {
      const userId = req.user.id;
      
      // 获取用户的邀请码
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }
      
      // 获取团队成员（直接邀请的用户）
      const [teamMembers] = await pool.execute(
        'SELECT * FROM users WHERE inviter_code = ?',
        [user.invite_code]
      );
      
      // 计算活跃团队成员数量（状态为2的成员）
      const activeMembers = teamMembers.filter(member => member.status === 2);
      
      res.json({
        success: true,
        data: {
          totalMembers: teamMembers.length,
          activeMembers: activeMembers.length,
          members: teamMembers.map(member => ({
            id: member.id,
            email: member.email,
            status: member.status,
            joinDate: member.created_at,
            isActive: member.status === 2
          }))
        }
      });
      
    } catch (error) {
      console.error('获取团队信息失败:', error);
      res.status(500).json({ error: '获取团队信息失败' });
    }
  }

  /**
   * 获取用户钱包信息
   * @static
   * @async
   * @param {Object} req - Express请求对象
   * @param {Object} req.user - 认证用户信息
   * @param {number} req.user.id - 用户ID
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>} 返回钱包信息的JSON响应
   * @description 获取用户的余额、冻结余额和总收益信息
   * @example
   * // GET /api/user/wallet
   * // Headers: Authorization: Bearer <token>
   * // Response: { success: true, data: { balance: 100.50, frozenBalance: 0, totalEarnings: 250.75 } }
   */
  static async getUserWallet(req, res) {
    try {
      const userId = req.user.id; // 修改为使用id而不是userId
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      res.json({
        success: true,
        message: '获取钱包信息成功',
        data: {
          balance: parseFloat(user.balance),
          frozenBalance: parseFloat(user.frozen_balance),
          totalEarnings: parseFloat(user.total_earnings),
          availableBalance: parseFloat(user.balance) - parseFloat(user.frozen_balance)
        }
      });
    } catch (error) {
      console.error('获取钱包信息失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
}

module.exports = UserController;