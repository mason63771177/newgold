const { pool, redisClient } = require('../config/database');
const webSocketService = require('../services/WebSocketService');
const moment = require('moment');

class RedpacketController {
  constructor() {
    // 红包时间窗口配置
    this.timeWindows = [
      { hour: 9, minute: 0 },   // 09:00
      { hour: 12, minute: 0 },  // 12:00
      { hour: 20, minute: 0 }   // 20:00
    ];
    this.windowDuration = 77; // 77秒
    
    // 红包池配置
    this.totalPool = 5000.00;
    this.minAmount = 1.0;
    this.maxAmount = 100.0;
  }

  // 获取红包状态（符合API规范）
  getRedpacketStatus = async (req, res) => {
    try {
      const userId = req.user?.id || 'default';
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      // 检查当前是否在时间窗口内
      let isActive = false;
      let nextWindow = null;
      let remainingSeconds = 0;
      
      for (const window of this.timeWindows) {
        const windowStart = window.hour * 60 + window.minute;
        const windowEnd = windowStart + Math.floor(this.windowDuration / 60);
        
        if (currentTime >= windowStart && currentTime <= windowEnd) {
          isActive = true;
          const elapsed = (currentTime - windowStart) * 60 + now.getSeconds();
          remainingSeconds = this.windowDuration - elapsed;
          break;
        }
      }
      
      // 如果不在窗口内，找到下一个窗口
      if (!isActive) {
        for (const window of this.timeWindows) {
          const windowStart = window.hour * 60 + window.minute;
          if (currentTime < windowStart) {
            nextWindow = `${String(window.hour).padStart(2, '0')}:${String(window.minute).padStart(2, '0')}:00`;
            remainingSeconds = (windowStart - currentTime) * 60 - now.getSeconds();
            break;
          }
        }
        
        // 如果今天的窗口都过了，设置为明天第一个窗口
        if (!nextWindow) {
          nextWindow = `${String(this.timeWindows[0].hour).padStart(2, '0')}:${String(this.timeWindows[0].minute).padStart(2, '0')}:00`;
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(this.timeWindows[0].hour, this.timeWindows[0].minute, 0, 0);
          remainingSeconds = Math.floor((tomorrow.getTime() - now.getTime()) / 1000);
        }
      }
      
      // 检查用户是否可以抢红包（需要状态2）
      const canGrab = isActive; // 这里应该结合用户状态判断
      
      // 发送红包开始通知
      webSocketService.sendRedpacketStart({
        totalAmount: 1000, // 可以从配置中获取
        duration: 77,
        message: '红包活动开始，快来抢红包！'
      });

      // 发送红包结束通知
      webSocketService.sendRedpacketEnd({
        totalAmount: 1000,
        participantCount: 0, // 可以从数据库查询实际参与人数
        distributedAmount: 0, // 可以从数据库查询实际分发金额
        message: '红包活动已结束'
      });

      res.json({
        code: 200,
        message: 'success',
        data: {
          isActive,
          nextTime: nextWindow,
          remainingSeconds: Math.max(0, remainingSeconds),
          canGrab,
          totalPool: this.totalPool
        },
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('获取红包状态失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取红包状态失败',
        timestamp: Date.now()
      });
    }
  }

  // 抢红包（符合API规范）
  grabRedpacket = async (req, res) => {
    try {
      const userId = req.user?.id || 'default';
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      // 检查是否在时间窗口内
      let isInWindow = false;
      let currentWindow = null;
      
      for (const window of this.timeWindows) {
        const windowStart = window.hour * 60 + window.minute;
        const windowEnd = windowStart + Math.floor(this.windowDuration / 60);
        
        if (currentTime >= windowStart && currentTime <= windowEnd) {
          isInWindow = true;
          currentWindow = `${String(window.hour).padStart(2, '0')}:${String(window.minute).padStart(2, '0')}`;
          break;
        }
      }
      
      if (!isInWindow) {
        return res.status(400).json({
          code: 400,
          message: '不在抢红包时间窗口内',
          timestamp: Date.now()
        });
      }
      
      // 检查用户今天是否已经抢过这个时间段的红包
      const connection = await pool.getConnection();
      try {
        const today = new Date().toISOString().split('T')[0];
        const [existingRecords] = await connection.execute(
          'SELECT id FROM redpacket_records WHERE user_id = ? AND DATE(created_at) = ? AND time_window = ?',
          [userId, today, currentWindow]
        );
        
        if (existingRecords.length > 0) {
          return res.status(400).json({
            code: 400,
            message: '今日该时间段已抢过红包',
            timestamp: Date.now()
          });
        }
        
        // 调用红包分配算法获取真实金额和排名
        const redpacketResult = await this.allocateRedpacket(userId, currentWindow);
        
        // 记录抢红包结果到数据库
        const [result] = await connection.execute(
          'INSERT INTO redpacket_records (user_id, amount, time_window, rank, created_at) VALUES (?, ?, ?, ?, NOW())',
          [userId, redpacketResult.amount, currentWindow, redpacketResult.rank]
        );
        
        // 更新用户余额
        await connection.execute(
          'UPDATE users SET balance = balance + ? WHERE id = ?',
          [redpacketResult.amount, userId]
        );
        
        // 获取更新后的余额
        const [userBalance] = await connection.execute(
          'SELECT balance FROM users WHERE id = ?',
          [userId]
        );
        
        res.json({
          code: 200,
          message: '抢红包成功',
          data: {
            amount: redpacketResult.amount,
            newBalance: userBalance[0]?.balance || 0,
            rank: redpacketResult.rank,
            totalGrabbed: redpacketResult.totalGrabbed
          },
          timestamp: Date.now()
        });
        
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('抢红包失败:', error);
      res.status(500).json({
        code: 500,
        message: '抢红包失败',
        timestamp: Date.now()
      });
    }
  }

  /**
   * 红包分配算法
   * 根据用户等级、活跃度等因素分配红包金额和排名
   */
  async allocateRedpacket(userId, timeWindow) {
    const connection = await pool.getConnection();
    try {
      // 获取用户信息
      const [users] = await connection.execute(
        'SELECT level, total_earnings, created_at FROM users WHERE id = ?',
        [userId]
      );
      
      const user = users[0];
      if (!user) {
        throw new Error('用户不存在');
      }
      
      // 获取今日该时间窗口的抢红包统计
      const today = new Date().toISOString().split('T')[0];
      const [stats] = await connection.execute(
        'SELECT COUNT(*) as total_grabbed, COALESCE(SUM(amount), 0) as total_amount FROM redpacket_records WHERE DATE(created_at) = ? AND time_window = ?',
        [today, timeWindow]
      );
      
      const totalGrabbed = stats[0]?.total_grabbed || 0;
      
      // 基于用户等级和活跃度计算红包金额
      let baseAmount = this.minAmount;
      let multiplier = 1.0;
      
      // 根据用户等级调整倍数
      switch (user.level) {
        case 'vip':
          multiplier = 2.0;
          break;
        case 'premium':
          multiplier = 1.5;
          break;
        case 'gold':
          multiplier = 1.3;
          break;
        default:
          multiplier = 1.0;
      }
      
      // 根据用户总收益调整倍数
      if (user.total_earnings > 1000) {
        multiplier *= 1.2;
      } else if (user.total_earnings > 500) {
        multiplier *= 1.1;
      }
      
      // 计算最终金额（保留一定随机性但有权重）
      const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8-1.2的随机因子
      const amount = parseFloat((baseAmount * multiplier * randomFactor).toFixed(2));
      
      // 确保金额在合理范围内
      const finalAmount = Math.min(Math.max(amount, this.minAmount), this.maxAmount);
      
      // 计算排名（基于金额和时间）
      const rank = Math.max(1, Math.floor((this.maxAmount - finalAmount) / (this.maxAmount - this.minAmount) * 49) + 1);
      
      return {
        amount: finalAmount,
        rank: rank,
        totalGrabbed: totalGrabbed + 1
      };
      
    } finally {
      connection.release();
    }
  }

  // 获取抢红包记录（兼容性接口）
  getRecords = async (req, res) => {
    try {
      const userId = req.user?.id || 'default';
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;
      
      const connection = await pool.getConnection();
      try {
        // 从数据库获取用户的抢红包记录
        const [records] = await connection.execute(
          'SELECT id, amount, time_window, rank, created_at FROM redpacket_records WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
          [userId, limit, offset]
        );
        
        // 获取总记录数
        const [countResult] = await connection.execute(
          'SELECT COUNT(*) as total FROM redpacket_records WHERE user_id = ?',
          [userId]
        );
        
        const formattedRecords = records.map(record => ({
          id: record.id,
          amount: record.amount,
          timestamp: new Date(record.created_at).getTime(),
          window: record.time_window,
          rank: record.rank
        }));
        
        res.json({
          success: true,
          data: {
            records: formattedRecords,
            total: countResult[0]?.total || 0
          }
        });
        
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('获取抢红包记录失败:', error);
      res.status(500).json({
        success: false,
        message: '获取记录失败'
      });
    }
  }

  // 获取抢红包状态（兼容性接口）
  static getRedpacketStatus = async (req, res) => {
    try {
      const userId = req.query.userId || 'default';
      
      // 获取当前时间窗口状态
      const timeWindow = RedpacketController.getCurrentTimeWindow();
      
      // 获取今日红包记录
      const todayRecords = await RedpacketController.getTodayRecords(userId);
      
      // 获取最近红包记录
      const recentRecords = await RedpacketController.getRecentRecords(userId, 10);
      
      res.json({
        success: true,
        data: {
          timeWindow,
          todayRecords,
          recentRecords,
          nextWindow: RedpacketController.getNextWindow()
        }
      });
      
    } catch (error) {
      console.error('获取抢红包状态错误:', error);
      res.status(500).json({
        success: false,
        message: '获取抢红包状态失败'
      });
    }
  };

  // 抢红包
  static grabRedpacket = async (req, res) => {
    try {
      const userId = req.body.userId || 'default';
      
      // 检查时间窗口
      const timeWindow = RedpacketController.getCurrentTimeWindow();
      if (!timeWindow.eligible) {
        const nextWindow = RedpacketController.getNextWindow();
        return res.status(400).json({
          success: false,
          message: '不在抢红包时间窗口内',
          nextWindow
        });
      }
      
      // 检查今日是否已抢过
      const todayRecords = await RedpacketController.getTodayRecords(userId);
      const currentHour = moment().hour();
      const hasGrabbedThisWindow = todayRecords.some(record => {
        const recordHour = moment(record.grabbed_at).hour();
        return recordHour === currentHour;
      });
      
      if (hasGrabbedThisWindow) {
        return res.status(400).json({
          success: false,
          message: '本时间段已抢过红包'
        });
      }
      
      // 生成红包金额（随机1-100 USDT）
      const amount = Math.floor(Math.random() * 100) + 1;
      
      // 记录红包抢夺
      const recordId = await RedpacketController.recordGrab(userId, amount);
      
      res.json({
        success: true,
        message: '抢红包成功！',
        data: {
          recordId,
          amount,
          grabbedAt: new Date().toISOString(),
          timeLeft: timeWindow.left
        }
      });
      
    } catch (error) {
      console.error('抢红包错误:', error);
      res.status(500).json({
        success: false,
        message: '抢红包失败'
      });
    }
  };

  // 获取红包记录
  static getRecords = async (req, res) => {
    try {
      const userId = req.query.userId || 'default';
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      
      const records = await RedpacketController.getRecentRecords(userId, limit, offset);
      const total = await RedpacketController.getTotalRecords(userId);
      
      res.json({
        success: true,
        data: {
          records,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
      
    } catch (error) {
      console.error('获取红包记录错误:', error);
      res.status(500).json({
        success: false,
        message: '获取红包记录失败'
      });
    }
  };

  // 获取当前时间窗口状态
  static getCurrentTimeWindow() {
    const now = moment();
    const hour = now.hour();
    const minute = now.minute();
    const second = now.second();
    
    // 三个时间窗口：9:00-9:01:17, 12:00-12:01:17, 20:00-20:01:17
    const windows = [
      { hour: 9, minute: 0 },
      { hour: 12, minute: 0 },
      { hour: 20, minute: 0 }
    ];
    
    for (const window of windows) {
      const start = moment().hour(window.hour).minute(window.minute).second(0);
      const end = moment(start).add(77, 'seconds');
      
      if (now.isBetween(start, end, null, '[]')) {
        const leftMs = end.diff(now);
        return {
          eligible: true,
          left: Math.floor(leftMs / 1000),
          windowStart: start.format('HH:mm:ss'),
          windowEnd: end.format('HH:mm:ss')
        };
      }
    }
    
    return { eligible: false };
  }

  // 获取下一个时间窗口
  static getNextWindow() {
    const now = moment();
    const windows = [
      { hour: 9, minute: 0 },
      { hour: 12, minute: 0 },
      { hour: 20, minute: 0 }
    ];
    
    for (const window of windows) {
      const windowTime = moment().hour(window.hour).minute(window.minute).second(0);
      if (now.isBefore(windowTime)) {
        return {
          time: windowTime.format('HH:mm'),
          countdown: windowTime.diff(now, 'seconds')
        };
      }
    }
    
    // 如果今天的窗口都过了，返回明天的第一个窗口
    const tomorrowFirst = moment().add(1, 'day').hour(9).minute(0).second(0);
    return {
      time: tomorrowFirst.format('MM-DD HH:mm'),
      countdown: tomorrowFirst.diff(now, 'seconds')
    };
  }

  // 获取今日红包记录
  static async getTodayRecords(userId) {
    try {
      // 使用Redis缓存
      const cacheKey = `redpacket:today:${userId}`;
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      const today = moment().format('YYYY-MM-DD');
      const connection = await pool.getConnection();
      
      try {
        const [rows] = await connection.execute(
          `SELECT * FROM redpacket_records 
           WHERE user_id = ? AND DATE(grabbed_at) = ?
           ORDER BY grabbed_at DESC`,
          [userId, today]
        );
        
        // 缓存5分钟
        await redisClient.setEx(cacheKey, 300, JSON.stringify(rows));
        
        return rows;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('获取今日红包记录错误:', error);
      return [];
    }
  }

  // 获取最近红包记录
  static async getRecentRecords(userId, limit = 10, offset = 0) {
    try {
      const connection = await pool.getConnection();
      
      try {
        const [rows] = await connection.execute(
          `SELECT * FROM redpacket_records 
           WHERE user_id = ?
           ORDER BY grabbed_at DESC
           LIMIT ? OFFSET ?`,
          [userId, limit, offset]
        );
        
        return rows;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('获取最近红包记录错误:', error);
      return [];
    }
  }

  // 获取记录总数
  static async getTotalRecords(userId) {
    try {
      const connection = await pool.getConnection();
      
      try {
        const [rows] = await connection.execute(
          'SELECT COUNT(*) as total FROM redpacket_records WHERE user_id = ?',
          [userId]
        );
        
        return rows[0].total;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('获取记录总数错误:', error);
      return 0;
    }
  }

  // 记录红包抢夺
  static async recordGrab(userId, amount) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 插入红包记录
      const [result] = await connection.execute(
        `INSERT INTO redpacket_records (user_id, amount, grabbed_at)
         VALUES (?, ?, NOW())`,
        [userId, amount]
      );
      
      // 更新用户余额（如果用户表存在balance字段）
      await connection.execute(
        `UPDATE users SET balance = balance + ? WHERE id = ?`,
        [amount, userId]
      );
      
      await connection.commit();
      
      // 清除今日缓存
      const cacheKey = `redpacket:today:${userId}`;
      await redisClient.del(cacheKey);
      
      return result.insertId;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 重置红包记录（测试用）
  static resetRecords = async (req, res) => {
    try {
      const userId = req.body.userId || 'default';
      
      const connection = await pool.getConnection();
      
      try {
        await connection.execute(
          'DELETE FROM redpacket_records WHERE user_id = ?',
          [userId]
        );
        
        // 清除缓存
        const cacheKey = `redpacket:today:${userId}`;
        await redisClient.del(cacheKey);
        
        res.json({
          success: true,
          message: '红包记录重置成功'
        });
        
      } finally {
        connection.release();
      }
      
    } catch (error) {
      console.error('重置红包记录错误:', error);
      res.status(500).json({
        success: false,
        message: '重置红包记录失败'
      });
    }
  };
}

module.exports = RedpacketController;