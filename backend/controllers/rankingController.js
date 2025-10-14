const { pool, redisClient } = require('../config/database');
const LoggingService = require('../services/LoggingService');

/**
 * 排行榜控制器 - 优化版本
 * 使用真实数据库查询和Redis缓存机制
 */
class RankingController {
  constructor() {
    // 缓存配置
    this.cacheConfig = {
      team: 300,      // 团队排行榜缓存5分钟
      redpacket: 180, // 红包排行榜缓存3分钟
      master: 600     // 大神排行榜缓存10分钟
    };
    
    // 排行榜查询限制
    this.RANKING_LIMIT = 100; // 最多查询前100名
    this.DISPLAY_LIMIT = 10;  // 前端显示前10名
  }

  /**
   * 获取大神排行榜
   * 基于用户总收益和任务完成情况
   */
  getMasterRanking = async (req, res) => {
    const startTime = Date.now();
    const userId = req.user?.id || 'default';
    
    try {
      this.logOperation('GET_MASTER_RANKING', userId, { ip: req.ip });

      // 检查缓存
      const cacheKey = 'master_ranking';
      let rankings = await this.getCache(cacheKey);
      
      if (!rankings) {
        const connection = await pool.getConnection();
        
        const query = `
          SELECT 
            u.id as userId,
            u.email as username,
            u.total_earnings,
            u.team_count as teamCount,
            (SELECT COUNT(*) FROM tasks t WHERE t.user_id = u.id AND t.status = 'completed') as completedTasks,
            (SELECT COUNT(*) FROM tasks t WHERE t.user_id = u.id AND t.task_type = 'master' AND t.status = 'completed') as masterTasks,
            u.created_at
          FROM users u 
          WHERE u.total_earnings > 0 OR u.team_count > 0
          ORDER BY u.total_earnings DESC, u.team_count DESC, completedTasks DESC, u.created_at ASC
          LIMIT 100
        `;
        
        const [rows] = await connection.execute(query);
        connection.release();
        
        // 计算大神等级
        rankings = rows.map((row, index) => {
          const masterLevel = this.calculateMasterLevel(
            parseFloat(row.total_earnings),
            row.team_count,
            row.completedTasks,
            row.masterTasks
          );
          
          return {
            rank: index + 1,
            userId: row.userId.toString(),
            username: this.maskEmail(row.username),
            totalEarnings: parseFloat(row.total_earnings || 0),
            teamCount: row.team_count,
            masterLevel: masterLevel,
            completedTasks: row.completedTasks,
            masterTasks: row.masterTasks,
            status: row.status
          };
        });
        
        // 缓存结果
        await this.setCache(cacheKey, rankings, this.cacheConfig.master);
      }
      
      // 查找当前用户排名
      const myRank = rankings.find(item => item.userId === userId.toString());
      let myRankInfo = null;
      
      if (!myRank && userId !== 'default') {
        // 单独查询用户数据
        const connection = await pool.getConnection();
        const [userRows] = await connection.execute(`
          SELECT 
            u.total_earnings,
            u.team_count,
            (SELECT COUNT(*) FROM tasks t WHERE t.user_id = u.id AND t.status = 'completed') as completedTasks,
            (SELECT COUNT(*) FROM tasks t WHERE t.user_id = u.id AND t.task_type = 'master' AND t.status = 'completed') as masterTasks,
            (SELECT COUNT(*) + 1 FROM users u2 WHERE u2.total_earnings > u.total_earnings OR (u2.total_earnings = u.total_earnings AND u2.team_count > u.team_count)) as rank
          FROM users u 
          WHERE u.id = ?
        `, [userId]);
        
        if (userRows.length > 0) {
          const userRank = userRows[0];
          const masterLevel = this.calculateMasterLevel(
            parseFloat(userRank.total_earnings || 0),
            userRank.team_count,
            userRank.completedTasks,
            userRank.masterTasks
          );
          
          myRankInfo = {
            rank: userRank.rank,
            masterLevel: masterLevel,
            teamCount: userRank.team_count,
            totalEarnings: parseFloat(userRank.total_earnings || 0)
          };
        }
        connection.release();
      } else if (myRank) {
        myRankInfo = {
          rank: myRank.rank,
          masterLevel: myRank.masterLevel,
          teamCount: myRank.teamCount,
          totalEarnings: myRank.totalEarnings
        };
      }

      const responseTime = Date.now() - startTime;
      this.logOperation('MASTER_RANKING_SUCCESS', userId, { 
        responseTime, 
        cacheHit: !!rankings,
        rankingsCount: rankings.length 
      });

      res.json({
        code: 200,
        message: 'success',
        data: {
          rankings: rankings.slice(0, this.DISPLAY_LIMIT),
          myRank: myRankInfo,
          total: rankings.length,
          lastUpdated: new Date().toISOString()
        },
        timestamp: Date.now()
      });
      
    } catch (error) {
      this.logOperation('MASTER_RANKING_ERROR', userId, { 
        error: error.message,
        stack: error.stack 
      });
      
      console.error('获取大神排行榜失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取大神排行榜失败',
        timestamp: Date.now()
      });
    }
  }

  /**
   * 计算大神等级
   */
  calculateMasterLevel(totalEarnings, teamCount, completedTasks, masterTasks) {
    let level = 1;
    
    // 基于总收益
    if (totalEarnings >= 10000) level = Math.max(level, 10);
    else if (totalEarnings >= 5000) level = Math.max(level, 9);
    else if (totalEarnings >= 2000) level = Math.max(level, 8);
    else if (totalEarnings >= 1000) level = Math.max(level, 7);
    else if (totalEarnings >= 500) level = Math.max(level, 6);
    else if (totalEarnings >= 200) level = Math.max(level, 5);
    else if (totalEarnings >= 100) level = Math.max(level, 4);
    else if (totalEarnings >= 50) level = Math.max(level, 3);
    else if (totalEarnings >= 20) level = Math.max(level, 2);
    
    // 基于团队规模
    if (teamCount >= 500) level = Math.max(level, 10);
    else if (teamCount >= 200) level = Math.max(level, 8);
    else if (teamCount >= 100) level = Math.max(level, 6);
    else if (teamCount >= 50) level = Math.max(level, 4);
    else if (teamCount >= 20) level = Math.max(level, 3);
    else if (teamCount >= 10) level = Math.max(level, 2);
    
    // 基于任务完成情况
    if (masterTasks >= 10) level = Math.max(level, 9);
    else if (masterTasks >= 5) level = Math.max(level, 7);
    else if (masterTasks >= 3) level = Math.max(level, 5);
    else if (masterTasks >= 1) level = Math.max(level, 3);
    
    return Math.min(level, 10); // 最高10级
  }

  /**
   * 获取缓存数据
   */
  async getCache(key) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ 获取缓存失败:', error);
      return null;
    }
  }

  /**
   * 设置缓存数据
   */
  async setCache(key, data, ttl) {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('❌ 设置缓存失败:', error);
    }
  }

  /**
   * 记录操作日志
   */
  logOperation(operation, details, userId = null, level = 'INFO') {
    LoggingService.logRankingOperation(operation, details, userId, level);
  }

  /**
   * 获取团队排行榜
   * 基于用户的team_count字段排序
   */
  getTeamRanking = async (req, res) => {
    const startTime = Date.now();
    const userId = req.user?.id || 'default';
    const { type = 'total', period = 'all' } = req.query;
    
    try {
      this.logOperation('GET_TEAM_RANKING', userId, { 
        type, 
        period, 
        ip: req.ip 
      });

      // 检查缓存
      const cacheKey = `team_ranking:${type}:${period}`;
      let rankings = await this.getCache(cacheKey);
      
      if (!rankings) {
        // 从数据库查询
        const connection = await pool.getConnection();
        
        let query = `
          SELECT 
            u.id as userId,
            u.email as username,
            u.team_count as teamCount,
            (SELECT COUNT(*) FROM team_relations tr WHERE tr.inviter_id = u.id AND tr.level = 1) as directCount,
            u.total_earnings,
            u.status,
            u.created_at
          FROM users u 
          WHERE u.team_count > 0 
          ORDER BY u.team_count DESC, u.total_earnings DESC, u.created_at ASC
          LIMIT 100
        `;
        
        const [rows] = await connection.execute(query);
        connection.release();
        
        // 添加排名
        rankings = rows.map((row, index) => ({
          rank: index + 1,
          userId: row.userId.toString(),
          username: this.maskEmail(row.username),
          teamCount: row.teamCount,
          directCount: row.directCount,
          totalEarnings: parseFloat(row.total_earnings || 0),
          status: row.status
        }));
        
        // 缓存结果
        await this.setCache(cacheKey, rankings, this.cacheConfig.team);
      }
      
      // 查找当前用户排名
      const myRank = rankings.find(item => item.userId === userId.toString());
      let myRankInfo = null;
      
      if (!myRank && userId !== 'default') {
        // 如果用户不在前100名，单独查询用户排名
        const connection = await pool.getConnection();
        const [userRows] = await connection.execute(`
          SELECT 
            u.team_count as teamCount,
            (SELECT COUNT(*) FROM team_relations tr WHERE tr.inviter_id = u.id AND tr.level = 1) as directCount,
            (SELECT COUNT(*) + 1 FROM users u2 WHERE u2.team_count > u.team_count OR (u2.team_count = u.team_count AND u2.total_earnings > u.total_earnings)) as rank
          FROM users u 
          WHERE u.id = ?
        `, [userId]);
        
        if (userRows.length > 0) {
          const userRank = userRows[0];
          myRankInfo = {
            rank: userRank.rank,
            teamCount: userRank.teamCount,
            directCount: userRank.directCount
          };
        }
        connection.release();
      } else if (myRank) {
        myRankInfo = {
          rank: myRank.rank,
          teamCount: myRank.teamCount,
          directCount: myRank.directCount
        };
      }

      const responseTime = Date.now() - startTime;
      this.logOperation('TEAM_RANKING_SUCCESS', userId, { 
        responseTime, 
        cacheHit: !!rankings,
        rankingsCount: rankings.length 
      });

      res.json({
        code: 200,
        message: 'success',
        data: {
          rankings: rankings.slice(0, this.DISPLAY_LIMIT),
          myRank: myRankInfo,
          total: rankings.length,
          lastUpdated: new Date().toISOString()
        },
        timestamp: Date.now()
      });
      
    } catch (error) {
      this.logOperation('TEAM_RANKING_ERROR', userId, { 
        error: error.message,
        stack: error.stack 
      });
      
      console.error('获取团队排行榜失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取团队排行榜失败',
        timestamp: Date.now()
      });
    }
  }

  /**
   * 获取红包排行榜
   * 基于redpacket_records表统计用户红包总金额
   */
  getRedpacketRanking = async (req, res) => {
    const startTime = Date.now();
    const userId = req.user?.id || 'default';
    const { period = 'all' } = req.query;
    
    try {
      this.logOperation('GET_REDPACKET_RANKING', userId, { 
        period, 
        ip: req.ip 
      });

      // 检查缓存
      const cacheKey = `redpacket_ranking:${period}`;
      let rankings = await this.getCache(cacheKey);
      
      if (!rankings) {
        const connection = await pool.getConnection();
        
        let dateFilter = '';
        let params = [];
        
        // 根据period添加时间过滤
        if (period === 'today') {
          dateFilter = 'AND DATE(rr.grabbed_at) = CURDATE()';
        } else if (period === 'week') {
          dateFilter = 'AND rr.grabbed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        } else if (period === 'month') {
          dateFilter = 'AND rr.grabbed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        }
        
        const query = `
          SELECT 
            u.id as userId,
            u.email as username,
            SUM(rr.amount) as totalAmount,
            COUNT(rr.id) as grabCount,
            MAX(rr.grabbed_at) as lastGrabTime,
            u.status
          FROM users u
          INNER JOIN redpacket_records rr ON u.id = rr.user_id
          WHERE 1=1 ${dateFilter}
          GROUP BY u.id, u.email, u.status
          HAVING totalAmount > 0
          ORDER BY totalAmount DESC, grabCount DESC, lastGrabTime ASC
          LIMIT 100
        `;
        
        const [rows] = await connection.execute(query, params);
        connection.release();
        
        // 添加排名
        rankings = rows.map((row, index) => ({
          rank: index + 1,
          userId: row.userId.toString(),
          username: this.maskEmail(row.username),
          totalAmount: parseFloat(row.totalAmount),
          grabCount: row.grabCount,
          lastGrabTime: row.lastGrabTime,
          status: row.status
        }));
        
        // 缓存结果
        await this.setCache(cacheKey, rankings, this.cacheConfig.redpacket);
      }
      
      // 查找当前用户排名
      const myRank = rankings.find(item => item.userId === userId.toString());
      let myRankInfo = null;
      
      if (!myRank && userId !== 'default') {
        // 单独查询用户红包数据
        const connection = await pool.getConnection();
        
        let dateFilter = '';
        if (period === 'today') {
          dateFilter = 'AND DATE(rr.grabbed_at) = CURDATE()';
        } else if (period === 'week') {
          dateFilter = 'AND rr.grabbed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        } else if (period === 'month') {
          dateFilter = 'AND rr.grabbed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        }
        
        const [userRows] = await connection.execute(`
          SELECT 
            COALESCE(SUM(rr.amount), 0) as totalAmount,
            COUNT(rr.id) as grabCount
          FROM redpacket_records rr
          WHERE rr.user_id = ? ${dateFilter}
        `, [userId]);
        
        if (userRows.length > 0 && userRows[0].totalAmount > 0) {
          // 计算排名
          const [rankRows] = await connection.execute(`
            SELECT COUNT(*) + 1 as rank
            FROM (
              SELECT SUM(rr2.amount) as userTotal
              FROM redpacket_records rr2
              WHERE 1=1 ${dateFilter}
              GROUP BY rr2.user_id
              HAVING userTotal > ?
            ) as higher_users
          `, [userRows[0].totalAmount]);
          
          myRankInfo = {
            rank: rankRows[0]?.rank || 1,
            totalAmount: parseFloat(userRows[0].totalAmount),
            grabCount: userRows[0].grabCount
          };
        }
        connection.release();
      } else if (myRank) {
        myRankInfo = {
          rank: myRank.rank,
          totalAmount: myRank.totalAmount,
          grabCount: myRank.grabCount
        };
      }

      const responseTime = Date.now() - startTime;
      this.logOperation('REDPACKET_RANKING_SUCCESS', userId, { 
        responseTime, 
        cacheHit: !!rankings,
        rankingsCount: rankings.length 
      });

      res.json({
        code: 200,
        message: 'success',
        data: {
          rankings: rankings.slice(0, this.DISPLAY_LIMIT),
          myRank: myRankInfo,
          total: rankings.length,
          period: period,
          lastUpdated: new Date().toISOString()
        },
        timestamp: Date.now()
      });
      
    } catch (error) {
      this.logOperation('REDPACKET_RANKING_ERROR', userId, { 
        error: error.message,
        stack: error.stack 
      });
      
      console.error('获取红包排行榜失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取红包排行榜失败',
        timestamp: Date.now()
      });
    }
  }



  /**
   * 邮箱脱敏处理
   */
  maskEmail(email) {
    if (!email || typeof email !== 'string') return '匿名用户';
    
    const atIndex = email.indexOf('@');
    if (atIndex <= 0) return '匿名用户';
    
    const username = email.substring(0, atIndex);
    const domain = email.substring(atIndex);
    
    if (username.length <= 2) {
      return username[0] + '*' + domain;
    } else if (username.length <= 4) {
      return username[0] + '*'.repeat(username.length - 2) + username[username.length - 1] + domain;
    } else {
      return username.substring(0, 2) + '*'.repeat(username.length - 4) + username.substring(username.length - 2) + domain;
    }
  }

  /**
   * 清除排行榜缓存
   */
  async clearRankingCache(type = 'all') {
    if (!redisClient) return;
    
    try {
      const patterns = [];
      if (type === 'all' || type === 'team') {
        patterns.push('team_ranking:*');
      }
      if (type === 'all' || type === 'redpacket') {
        patterns.push('redpacket_ranking:*');
      }
      if (type === 'all' || type === 'master') {
        patterns.push('master_ranking:*');
      }
      
      for (const pattern of patterns) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      }
      
      console.log(`✅ 清除排行榜缓存成功: ${type}`);
    } catch (error) {
      console.error('清除排行榜缓存失败:', error);
    }
  }

  /**
   * 获取排行榜统计信息
   */
  async getRankingStats(req, res) {
    try {
      const connection = await pool.getConnection();
      
      const [stats] = await connection.execute(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE team_count > 0) as activeTeamUsers,
          (SELECT COUNT(DISTINCT user_id) FROM redpacket_records) as redpacketUsers,
          (SELECT COUNT(*) FROM users WHERE total_earnings > 0) as earningUsers,
          (SELECT SUM(amount) FROM redpacket_records WHERE DATE(grabbed_at) = CURDATE()) as todayRedpacketTotal,
          (SELECT COUNT(*) FROM redpacket_records WHERE DATE(grabbed_at) = CURDATE()) as todayRedpacketCount
      `);
      
      connection.release();
      
      res.json({
        code: 200,
        message: 'success',
        data: stats[0],
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('获取排行榜统计失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取排行榜统计失败',
        timestamp: Date.now()
      });
    }
  }
}

module.exports = RankingController;