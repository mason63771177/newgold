const { pool } = require('../config/database');
const LoggingService = require('../services/LoggingService');

/**
 * 数据库性能监控工具
 * 用于监控排行榜查询性能和数据库状态
 */
class PerformanceMonitor {
  constructor() {
    this.slowQueryThreshold = 1000; // 慢查询阈值（毫秒）
  }

  /**
   * 监控查询性能
   */
  async monitorQuery(queryName, queryFn) {
    const startTime = Date.now();
    let result = null;
    let error = null;

    try {
      result = await queryFn();
      const duration = Date.now() - startTime;
      
      // 记录性能日志
      LoggingService.logPerformance(queryName, {
        duration,
        success: true,
        slow: duration > this.slowQueryThreshold
      });

      if (duration > this.slowQueryThreshold) {
        console.warn(`⚠️ 慢查询检测: ${queryName} 耗时 ${duration}ms`);
      }

      return result;
    } catch (err) {
      error = err;
      const duration = Date.now() - startTime;
      
      LoggingService.logPerformance(queryName, {
        duration,
        success: false,
        error: err.message
      }, null, 'ERROR');

      throw err;
    }
  }

  /**
   * 获取数据库状态
   */
  async getDatabaseStats() {
    try {
      const [processlist] = await pool.execute('SHOW PROCESSLIST');
      const [status] = await pool.execute(`
        SHOW STATUS WHERE Variable_name IN (
          'Threads_connected',
          'Threads_running',
          'Queries',
          'Slow_queries',
          'Uptime'
        )
      `);

      const stats = {};
      status.forEach(row => {
        stats[row.Variable_name] = row.Value;
      });

      return {
        connections: {
          active: processlist.length,
          running: stats.Threads_running || 0,
          total: stats.Threads_connected || 0
        },
        queries: {
          total: stats.Queries || 0,
          slow: stats.Slow_queries || 0
        },
        uptime: stats.Uptime || 0
      };
    } catch (error) {
      console.error('❌ 获取数据库状态失败:', error);
      return null;
    }
  }

  /**
   * 检查表索引使用情况
   */
  async checkIndexUsage() {
    try {
      const [indexes] = await pool.execute(`
        SELECT 
          TABLE_NAME,
          INDEX_NAME,
          COLUMN_NAME,
          CARDINALITY,
          SUB_PART,
          NULLABLE
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN ('users', 'team_relations', 'redpacket_records', 'redpacket_events', 'tasks', 'wallet_transactions')
        ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
      `);

      const indexStats = {};
      indexes.forEach(index => {
        const key = `${index.TABLE_NAME}.${index.INDEX_NAME}`;
        if (!indexStats[key]) {
          indexStats[key] = {
            table: index.TABLE_NAME,
            index: index.INDEX_NAME,
            columns: [],
            cardinality: index.CARDINALITY
          };
        }
        indexStats[key].columns.push(index.COLUMN_NAME);
      });

      return Object.values(indexStats);
    } catch (error) {
      console.error('❌ 检查索引使用情况失败:', error);
      return [];
    }
  }

  /**
   * 分析排行榜查询性能
   */
  async analyzeRankingPerformance() {
    console.log('🔍 开始分析排行榜查询性能...');

    // 团队排行榜性能测试
    await this.monitorQuery('team_ranking_query', async () => {
      const [result] = await pool.execute(`
        SELECT 
          u.id,
          u.email,
          u.team_count,
          u.total_earnings,
          (SELECT COUNT(*) FROM team_relations tr WHERE tr.inviter_id = u.id) as directCount
        FROM users u
        WHERE u.team_count > 0
        ORDER BY u.team_count DESC, u.total_earnings DESC
        LIMIT 10
      `);
      return result;
    });

    // 红包排行榜性能测试
    await this.monitorQuery('redpacket_ranking_query', async () => {
      const [result] = await pool.execute(`
        SELECT 
          rr.user_id,
          u.email,
          SUM(rr.amount) as totalAmount,
          COUNT(rr.id) as grabCount
        FROM redpacket_records rr
        JOIN users u ON rr.user_id = u.id
        WHERE rr.grabbed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY rr.user_id, u.email
        ORDER BY totalAmount DESC, grabCount DESC
        LIMIT 10
      `);
      return result;
    });

    // 大神排行榜性能测试
    await this.monitorQuery('master_ranking_query', async () => {
      const [result] = await pool.execute(`
        SELECT 
          u.id,
          u.email,
          u.total_earnings,
          u.team_count,
          (SELECT COUNT(*) FROM tasks t WHERE t.user_id = u.id AND t.status = 'completed') as completedTasks
        FROM users u
        WHERE u.total_earnings > 0
        ORDER BY u.total_earnings DESC, u.team_count DESC
        LIMIT 10
      `);
      return result;
    });

    console.log('✅ 排行榜查询性能分析完成');
  }

  /**
   * 生成性能报告
   */
  async generatePerformanceReport() {
    console.log('📊 生成性能报告...');

    const dbStats = await this.getDatabaseStats();
    const indexStats = await this.checkIndexUsage();

    const report = {
      timestamp: new Date().toISOString(),
      database: dbStats,
      indexes: indexStats,
      recommendations: []
    };

    // 生成优化建议
    if (dbStats && dbStats.queries.slow > 0) {
      report.recommendations.push('检测到慢查询，建议优化SQL语句或添加索引');
    }

    if (dbStats && dbStats.connections.active > 50) {
      report.recommendations.push('数据库连接数较高，建议检查连接池配置');
    }

    console.log('性能报告:', JSON.stringify(report, null, 2));
    
    // 记录性能报告
    LoggingService.logSystemEvent('PERFORMANCE_REPORT', report);

    return report;
  }

  /**
   * 启动性能监控
   */
  startMonitoring(interval = 300000) { // 默认5分钟
    console.log(`🚀 启动性能监控，监控间隔: ${interval/1000}秒`);
    
    setInterval(async () => {
      try {
        await this.analyzeRankingPerformance();
        await this.generatePerformanceReport();
      } catch (error) {
        console.error('❌ 性能监控执行失败:', error);
      }
    }, interval);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const monitor = new PerformanceMonitor();
  
  // 执行一次性能分析
  monitor.analyzeRankingPerformance()
    .then(() => monitor.generatePerformanceReport())
    .then(() => {
      console.log('✅ 性能分析完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 性能分析失败:', error);
      process.exit(1);
    });
}

module.exports = PerformanceMonitor;