const fs = require('fs').promises;
const path = require('path');
const { pool } = require('../config/database');

/**
 * 日志系统服务 - 增强版本
 * 提供详细的操作日志记录功能
 */
class LoggingService {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.initLogDirectory();
    
    // 日志级别
    this.LOG_LEVELS = {
      ERROR: 'ERROR',
      WARN: 'WARN',
      INFO: 'INFO',
      DEBUG: 'DEBUG',
      TRACE: 'TRACE'
    };
    
    // 日志类型
    this.LOG_TYPES = {
      USER_ACTION: 'USER_ACTION',
      API_REQUEST: 'API_REQUEST',
      DATABASE: 'DATABASE',
      SYSTEM: 'SYSTEM',
      SECURITY: 'SECURITY',
      PERFORMANCE: 'PERFORMANCE',
      RANKING: 'RANKING',
      REDPACKET: 'REDPACKET',
      WALLET: 'WALLET',
      TEAM: 'TEAM',
      TASK: 'TASK'
    };
    
    // 日志缓冲区
    this.logBuffer = [];
    this.bufferSize = 100;
    this.flushInterval = 5000; // 5秒刷新一次
    
    // 启动定时刷新
    this.startBufferFlush();
  }

  /**
   * 初始化日志目录
   */
  async initLogDirectory() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
      
      // 创建子目录
      const subDirs = ['user', 'api', 'database', 'system', 'security', 'performance'];
      for (const dir of subDirs) {
        await fs.mkdir(path.join(this.logDir, dir), { recursive: true });
      }
      
      console.log('✅ 日志目录初始化成功');
    } catch (error) {
      console.error('❌ 日志目录初始化失败:', error);
    }
  }

  /**
   * 启动缓冲区定时刷新
   */
  startBufferFlush() {
    setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);
  }

  /**
   * 记录用户操作日志
   */
  async logUserAction(userId, action, details = {}, req = null) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: this.LOG_LEVELS.INFO,
      type: this.LOG_TYPES.USER_ACTION,
      userId: userId,
      action: action,
      details: {
        ...details,
        ip: req?.ip || 'unknown',
        userAgent: req?.get('User-Agent') || 'unknown',
        sessionId: req?.sessionID || 'unknown'
      }
    };
    
    await this.writeLog('user', logData);
    
    // 同时写入数据库（重要操作）
    if (this.isImportantAction(action)) {
      await this.writeToDatabase(logData);
    }
  }

  /**
   * 记录API请求日志
   */
  async logApiRequest(req, res, responseTime, error = null) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: error ? this.LOG_LEVELS.ERROR : this.LOG_LEVELS.INFO,
      type: this.LOG_TYPES.API_REQUEST,
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id || 'anonymous',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      responseTime: responseTime,
      statusCode: res.statusCode,
      error: error ? {
        message: error.message,
        stack: error.stack
      } : null,
      requestBody: this.sanitizeRequestBody(req.body),
      query: req.query
    };
    
    await this.writeLog('api', logData);
  }

  /**
   * 记录数据库操作日志
   */
  async logDatabaseOperation(operation, table, userId, details = {}) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: this.LOG_LEVELS.INFO,
      type: this.LOG_TYPES.DATABASE,
      operation: operation,
      table: table,
      userId: userId,
      details: details
    };
    
    await this.writeLog('database', logData);
  }

  /**
   * 记录系统事件日志
   */
  async logSystemEvent(event, level = this.LOG_LEVELS.INFO, details = {}) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: level,
      type: this.LOG_TYPES.SYSTEM,
      event: event,
      details: details,
      pid: process.pid,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };
    
    await this.writeLog('system', logData);
  }

  /**
   * 记录安全事件日志
   */
  async logSecurityEvent(event, userId, ip, details = {}) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: this.LOG_LEVELS.WARN,
      type: this.LOG_TYPES.SECURITY,
      event: event,
      userId: userId,
      ip: ip,
      details: details
    };
    
    await this.writeLog('security', logData);
    
    // 安全事件必须写入数据库
    await this.writeToDatabase(logData);
  }

  /**
   * 记录性能指标日志
   */
  async logPerformance(operation, duration, details = {}) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: this.LOG_LEVELS.INFO,
      type: this.LOG_TYPES.PERFORMANCE,
      operation: operation,
      duration: duration,
      details: details,
      memory: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };
    
    await this.writeLog('performance', logData);
  }

  /**
   * 记录排行榜操作日志
   */
  async logRankingOperation(operation, userId, details = {}) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: this.LOG_LEVELS.INFO,
      type: this.LOG_TYPES.RANKING,
      operation: operation,
      userId: userId,
      details: details
    };
    
    await this.writeLog('user', logData);
  }

  /**
   * 记录红包操作日志
   */
  async logRedpacketOperation(operation, userId, details = {}) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: this.LOG_LEVELS.INFO,
      type: this.LOG_TYPES.REDPACKET,
      operation: operation,
      userId: userId,
      details: details
    };
    
    await this.writeLog('user', logData);
    
    // 红包操作写入数据库
    await this.writeToDatabase(logData);
  }

  /**
   * 记录钱包操作日志
   */
  async logWalletOperation(operation, userId, details = {}) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: this.LOG_LEVELS.INFO,
      type: this.LOG_TYPES.WALLET,
      operation: operation,
      userId: userId,
      details: details
    };
    
    await this.writeLog('user', logData);
    
    // 钱包操作写入数据库
    await this.writeToDatabase(logData);
  }

  /**
   * 写入日志文件
   */
  async writeLog(category, logData) {
    try {
      // 添加到缓冲区
      this.logBuffer.push({ category, logData });
      
      // 如果缓冲区满了，立即刷新
      if (this.logBuffer.length >= this.bufferSize) {
        await this.flushLogs();
      }
      
      // 控制台输出（开发环境）
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${logData.level}] [${logData.type}] ${JSON.stringify(logData)}`);
      }
      
    } catch (error) {
      console.error('写入日志失败:', error);
    }
  }

  /**
   * 刷新日志缓冲区
   */
  async flushLogs() {
    if (this.logBuffer.length === 0) return;
    
    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];
    
    try {
      // 按类别分组
      const logsByCategory = {};
      logsToFlush.forEach(({ category, logData }) => {
        if (!logsByCategory[category]) {
          logsByCategory[category] = [];
        }
        logsByCategory[category].push(logData);
      });
      
      // 写入各类别文件
      for (const [category, logs] of Object.entries(logsByCategory)) {
        const fileName = `${category}_${new Date().toISOString().split('T')[0]}.log`;
        const filePath = path.join(this.logDir, category, fileName);
        
        const logContent = logs.map(log => JSON.stringify(log)).join('\n') + '\n';
        await fs.appendFile(filePath, logContent);
      }
      
    } catch (error) {
      console.error('刷新日志缓冲区失败:', error);
      // 如果写入失败，将日志重新放回缓冲区
      this.logBuffer.unshift(...logsToFlush);
    }
  }

  /**
   * 写入数据库日志表
   */
  async writeToDatabase(logData) {
    try {
      const connection = await pool.getConnection();
      
      await connection.execute(`
        INSERT INTO system_logs (
          timestamp, level, type, user_id, operation, details, ip, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        logData.timestamp,
        logData.level,
        logData.type,
        logData.userId || null,
        logData.action || logData.operation || logData.event,
        JSON.stringify(logData.details || {}),
        logData.details?.ip || logData.ip || null
      ]);
      
      connection.release();
      
    } catch (error) {
      // 数据库写入失败不应该影响主流程
      console.error('写入数据库日志失败:', error);
    }
  }

  /**
   * 判断是否为重要操作
   */
  isImportantAction(action) {
    const importantActions = [
      'LOGIN', 'LOGOUT', 'REGISTER', 'PASSWORD_CHANGE',
      'WALLET_DEPOSIT', 'WALLET_WITHDRAW', 'REDPACKET_GRAB',
      'TEAM_INVITE', 'TASK_COMPLETE', 'ACTIVATION_SUCCESS'
    ];
    return importantActions.includes(action);
  }

  /**
   * 清理敏感信息
   */
  sanitizeRequestBody(body) {
    if (!body) return null;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'privateKey'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***';
      }
    });
    
    return sanitized;
  }

  /**
   * 查询日志
   */
  async queryLogs(filters = {}) {
    try {
      const connection = await pool.getConnection();
      
      let query = 'SELECT * FROM system_logs WHERE 1=1';
      const params = [];
      
      if (filters.userId) {
        query += ' AND user_id = ?';
        params.push(filters.userId);
      }
      
      if (filters.type) {
        query += ' AND type = ?';
        params.push(filters.type);
      }
      
      if (filters.level) {
        query += ' AND level = ?';
        params.push(filters.level);
      }
      
      if (filters.startDate) {
        query += ' AND created_at >= ?';
        params.push(filters.startDate);
      }
      
      if (filters.endDate) {
        query += ' AND created_at <= ?';
        params.push(filters.endDate);
      }
      
      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(filters.limit || 100);
      
      const [rows] = await connection.execute(query, params);
      connection.release();
      
      return rows;
      
    } catch (error) {
      console.error('查询日志失败:', error);
      return [];
    }
  }

  /**
   * 清理旧日志
   */
  async cleanOldLogs(daysToKeep = 30) {
    try {
      // 清理数据库日志
      const connection = await pool.getConnection();
      await connection.execute(
        'DELETE FROM system_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
        [daysToKeep]
      );
      connection.release();
      
      // 清理文件日志
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const categories = ['user', 'api', 'database', 'system', 'security', 'performance'];
      for (const category of categories) {
        const categoryDir = path.join(this.logDir, category);
        try {
          const files = await fs.readdir(categoryDir);
          for (const file of files) {
            const filePath = path.join(categoryDir, file);
            const stats = await fs.stat(filePath);
            if (stats.mtime < cutoffDate) {
              await fs.unlink(filePath);
            }
          }
        } catch (error) {
          console.error(`清理${category}日志失败:`, error);
        }
      }
      
      console.log(`✅ 清理${daysToKeep}天前的日志完成`);
      
    } catch (error) {
      console.error('清理旧日志失败:', error);
    }
  }

  /**
   * 获取日志统计
   */
  async getLogStats(period = '24h') {
    try {
      const connection = await pool.getConnection();
      
      let timeFilter = '';
      if (period === '1h') {
        timeFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)';
      } else if (period === '24h') {
        timeFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)';
      } else if (period === '7d') {
        timeFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
      }
      
      const [stats] = await connection.execute(`
        SELECT 
          type,
          level,
          COUNT(*) as count
        FROM system_logs 
        WHERE 1=1 ${timeFilter}
        GROUP BY type, level
        ORDER BY count DESC
      `);
      
      connection.release();
      
      return stats;
      
    } catch (error) {
      console.error('获取日志统计失败:', error);
      return [];
    }
  }
}

// 创建单例实例
const loggingService = new LoggingService();

module.exports = loggingService;