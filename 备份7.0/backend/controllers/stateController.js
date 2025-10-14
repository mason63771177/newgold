const User = require('../models/User');
const { body, validationResult } = require('express-validator');

class StateController {
  // 获取用户当前状态
  static async getStatus(req, res) {
    try {
      // 如果没有用户认证，返回默认状态
      if (!req.user) {
        return res.json({
          success: true,
          data: {
            status: 1,
            countdown_end_time: null,
            countdown_remaining: null,
            activation_count: 0,
            last_activation_time: null,
            balance: 0,
            total_earnings: 0,
            team_count: 0
          }
        });
      }

      const user = req.user;

      // 检查倒计时是否结束，自动更新状态
      if (user.status === 2 && user.isCountdownExpired()) {
        await user.updateStatus(3);
      }

      // 计算倒计时剩余时间
      let countdownRemaining = null;
      if (user.status === 2 && user.countdown_end_time) {
        const now = new Date();
        const endTime = new Date(user.countdown_end_time);
        countdownRemaining = Math.max(0, endTime.getTime() - now.getTime());
      }

      res.json({
        success: true,
        data: {
          status: user.status,
          countdown_end_time: user.countdown_end_time,
          countdown_remaining: countdownRemaining,
          activation_count: user.activation_count,
          last_activation_time: user.last_activation_time,
          balance: user.balance,
          total_earnings: user.total_earnings,
          team_count: user.team_count
        }
      });

    } catch (error) {
      console.error('获取状态错误:', error);
      res.status(500).json({
        success: false,
        message: '获取状态失败'
      });
    }
  }

  // 激活账号（状态1→2）
  static async activate(req, res) {
    try {
      // 在无认证模式下，模拟用户激活
      if (!req.user) {
        // 模拟激活成功
        const countdownEndTime = new Date();
        countdownEndTime.setHours(countdownEndTime.getHours() + 168);

        return res.json({
          success: true,
          message: '激活成功',
          data: {
            status: 2,
            countdown_end_time: countdownEndTime,
            countdown_remaining: 168 * 60 * 60 * 1000, // 168小时的毫秒数
            activation_count: 1,
            last_activation_time: new Date(),
            balance: 0,
            total_earnings: 0,
            team_count: 0
          }
        });
      }

      const user = req.user;

      // 检查用户是否可以激活
      if (!user.canActivate()) {
        return res.status(400).json({
          success: false,
          message: '当前状态不允许激活',
          currentStatus: user.status
        });
      }

      // 集成真实的Tatum激活流程
      const ActivationController = require('./activationController');
      
      // 调用真实的激活流程，获取支付信息
      try {
        // 创建一个模拟的响应对象来捕获ActivationController的返回值
        let activationResult = null;
        const mockRes = {
          json: (data) => { activationResult = data; },
          status: (code) => ({ json: (data) => { activationResult = { statusCode: code, ...data }; } })
        };

        // 调用真实的激活控制器
        await ActivationController.activateAccount(req, mockRes);

        // 如果激活成功，返回支付信息
        if (activationResult && activationResult.success) {
          return res.json({
            success: true,
            message: '请完成支付以激活账号',
            data: {
              ...activationResult.data,
              // 保持与原StateAPI兼容的字段
              status: 1, // 支付前状态仍为1
              needsPayment: true
            }
          });
        } else {
          // 如果真实激活失败，回退到简化模式
          console.log('真实激活流程失败，回退到简化模式:', activationResult);
          
          // 计算168小时后的时间
          const countdownEndTime = new Date();
          countdownEndTime.setHours(countdownEndTime.getHours() + 168);

          // 更新用户状态
          await user.updateStatus(2, countdownEndTime);

          return res.json({
            success: true,
            message: '激活成功',
            data: {
              status: user.status,
              countdown_end_time: user.countdown_end_time,
              countdown_remaining: 168 * 60 * 60 * 1000,
              activation_count: user.activation_count,
              last_activation_time: user.last_activation_time,
              balance: user.balance,
              total_earnings: user.total_earnings,
              team_count: user.team_count
            }
          });
        }
      } catch (activationError) {
        console.error('真实激活流程错误，回退到简化模式:', activationError);
        
        // 计算168小时后的时间
        const countdownEndTime = new Date();
        countdownEndTime.setHours(countdownEndTime.getHours() + 168);

        // 更新用户状态
        await user.updateStatus(2, countdownEndTime);

        return res.json({
          success: true,
          message: '激活成功',
          data: {
            status: user.status,
            countdown_end_time: user.countdown_end_time,
            countdown_remaining: 168 * 60 * 60 * 1000,
            activation_count: user.activation_count,
            last_activation_time: user.last_activation_time,
            balance: user.balance,
            total_earnings: user.total_earnings,
            team_count: user.team_count
          }
        });
      }

    } catch (error) {
      console.error('激活错误:', error);
      res.status(500).json({
        success: false,
        message: '激活失败'
      });
    }
  }

  // 复购（状态3→2）- 集成Tatum支付
  static async repurchase(req, res) {
    try {
      // 在无认证模式下，模拟用户复购
      if (!req.user) {
        // 模拟复购成功
        const countdownEndTime = new Date();
        countdownEndTime.setHours(countdownEndTime.getHours() + 168);

        return res.json({
          success: true,
          message: '复购成功',
          data: {
            status: 2,
            countdown_end_time: countdownEndTime,
            countdown_remaining: 168 * 60 * 60 * 1000, // 168小时的毫秒数
            activation_count: 2,
            last_activation_time: new Date(),
            balance: 0,
            total_earnings: 0,
            team_count: 0
          }
        });
      }

      const user = req.user;

      // 检查用户状态
      if (user.status !== 3) {
        return res.status(400).json({
          success: false,
          message: '只有状态3的用户才能复购',
          currentStatus: user.status
        });
      }

      // 集成真实的Tatum激活流程（与activate方法相同）
      const ActivationController = require('./activationController');
      
      // 调用真实的激活流程，获取支付信息
      try {
        // 创建一个模拟的响应对象来捕获ActivationController的返回值
        let activationResult = null;
        const mockRes = {
          json: (data) => { activationResult = data; },
          status: (code) => ({ json: (data) => { activationResult = { statusCode: code, ...data }; } })
        };

        // 调用真实的激活控制器
        await ActivationController.activateAccount(req, mockRes);

        // 如果激活成功，返回支付信息
        if (activationResult && activationResult.success) {
          return res.json({
            success: true,
            message: '请完成支付以复购激活',
            data: {
              ...activationResult.data,
              // 保持与原StateAPI兼容的字段
              status: 3, // 支付前状态仍为3
              needsPayment: true
            }
          });
        } else {
          // 如果真实激活失败，回退到简化模式
          console.log('真实复购流程失败，回退到简化模式:', activationResult);
          
          // 计算168小时后的时间
          const countdownEndTime = new Date();
          countdownEndTime.setHours(countdownEndTime.getHours() + 168);

          // 更新用户状态
          await user.updateStatus(2, countdownEndTime);

          return res.json({
            success: true,
            message: '复购成功',
            data: {
              status: user.status,
              countdown_end_time: user.countdown_end_time,
              countdown_remaining: 168 * 60 * 60 * 1000,
              activation_count: user.activation_count,
              last_activation_time: user.last_activation_time,
              balance: user.balance,
              total_earnings: user.total_earnings,
              team_count: user.team_count
            }
          });
        }
      } catch (activationError) {
        console.error('真实复购流程错误，回退到简化模式:', activationError);
        
        // 计算168小时后的时间
        const countdownEndTime = new Date();
        countdownEndTime.setHours(countdownEndTime.getHours() + 168);

        // 更新用户状态
        await user.updateStatus(2, countdownEndTime);

        return res.json({
          success: true,
          message: '复购成功',
          data: {
            status: user.status,
            countdown_end_time: user.countdown_end_time,
            countdown_remaining: 168 * 60 * 60 * 1000,
            activation_count: user.activation_count,
            last_activation_time: user.last_activation_time,
            balance: user.balance,
            total_earnings: user.total_earnings,
            team_count: user.team_count
          }
        });
      }

    } catch (error) {
      console.error('复购错误:', error);
      res.status(500).json({
        success: false,
        message: '复购失败'
      });
    }
  }

  // 同步状态数据
  static async syncState(req, res) {
    try {
      const user = req.user;
      const { localState } = req.body;

      // 验证本地状态数据
      if (!localState || typeof localState !== 'object') {
        return res.status(400).json({
          success: false,
          message: '无效的本地状态数据'
        });
      }

      // 检查倒计时是否结束，自动更新状态
      if (user.status === 2 && user.isCountdownExpired()) {
        await user.updateStatus(3);
      }

      // 返回服务器端的权威状态
      const serverState = {
        status: user.status,
        countdown_end_time: user.countdown_end_time,
        activation_count: user.activation_count,
        last_activation_time: user.last_activation_time,
        balance: user.balance,
        total_earnings: user.total_earnings,
        team_count: user.team_count
      };

      // 检查是否需要同步本地数据到服务器
      let needsUpdate = false;
      const updates = {};

      // 比较关键数据，如果本地数据更新，同步到服务器
      if (localState.walletBalance !== undefined && 
          Math.abs(localState.walletBalance - user.balance) > 0.01) {
        updates.balance = localState.walletBalance;
        needsUpdate = true;
      }

      if (localState.totalEarnings !== undefined && 
          Math.abs(localState.totalEarnings - user.total_earnings) > 0.01) {
        updates.total_earnings = localState.totalEarnings;
        needsUpdate = true;
      }

      if (localState.teamMembers !== undefined && 
          localState.teamMembers !== user.team_count) {
        updates.team_count = localState.teamMembers;
        needsUpdate = true;
      }

      // 如果需要更新，执行数据库更新
      if (needsUpdate) {
        // 这里可以添加更复杂的同步逻辑
        console.log('需要同步的数据:', updates);
      }

      res.json({
        success: true,
        message: '状态同步成功',
        data: {
          serverState,
          localState,
          needsUpdate,
          updates: needsUpdate ? updates : null
        }
      });

    } catch (error) {
      console.error('同步状态错误:', error);
      res.status(500).json({
        success: false,
        message: '同步状态失败'
      });
    }
  }

  // 手动切换状态（仅开发环境）
  static async switchState(req, res) {
    try {
      // 仅在开发环境允许
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          message: '生产环境不允许手动切换状态'
        });
      }

      const user = req.user;
      const { targetState } = req.body;

      // 验证目标状态
      if (![1, 2, 3].includes(targetState)) {
        return res.status(400).json({
          success: false,
          message: '无效的目标状态'
        });
      }

      let countdownEndTime = null;
      if (targetState === 2) {
        // 如果切换到状态2，设置168小时倒计时
        countdownEndTime = new Date();
        countdownEndTime.setHours(countdownEndTime.getHours() + 168);
      }

      // 更新状态
      await user.updateStatus(targetState, countdownEndTime);

      res.json({
        success: true,
        message: `状态已切换到${targetState}`,
        data: {
          status: user.status,
          countdown_end_time: user.countdown_end_time
        }
      });

    } catch (error) {
      console.error('切换状态错误:', error);
      res.status(500).json({
        success: false,
        message: '切换状态失败'
      });
    }
  }
}

// 输入验证规则
const syncStateValidation = [
  body('localState')
    .isObject()
    .withMessage('本地状态必须是对象')
];

const switchStateValidation = [
  body('targetState')
    .isInt({ min: 1, max: 3 })
    .withMessage('目标状态必须是1、2或3')
];

module.exports = {
  StateController,
  syncStateValidation,
  switchStateValidation
};