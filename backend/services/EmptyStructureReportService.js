const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { pool } = require('../config/database');

/**
 * 空结构记账服务
 * 负责记录、查询和统计空结构资金流向
 */
class EmptyStructureReportService {

  /**
   * 获取空结构资金统计报告
   * @param {Object} options - 查询选项
   * @returns {Object} 统计报告
   */
  static async getEmptyStructureReport(options = {}) {
    try {
      const {
        startDate = null,
        endDate = null,
        limit = 100,
        offset = 0
      } = options;

      // 构建查询条件
      let whereClause = "type = 'empty_structure_fund'";
      const params = [];

      if (startDate) {
        whereClause += " AND created_at >= ?";
        params.push(startDate);
      }

      if (endDate) {
        whereClause += " AND created_at <= ?";
        params.push(endDate);
      }

      // 获取空结构资金交易记录
      const [transactions] = await pool.execute(`
        SELECT * FROM transactions 
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);

      // 计算统计数据
      const [totalAmountResult] = await pool.execute(`
        SELECT 
          COUNT(*) as totalCount,
          SUM(amount) as totalAmount,
          AVG(amount) as avgAmount,
          MIN(amount) as minAmount,
          MAX(amount) as maxAmount
        FROM transactions 
        WHERE ${whereClause}
      `, params);

      const stats = totalAmountResult[0] || {
        totalCount: 0,
        totalAmount: 0,
        avgAmount: 0,
        minAmount: 0,
        maxAmount: 0
      };

      // 按日期分组统计
      const [dailyStats] = await pool.execute(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count,
          SUM(amount) as amount
        FROM transactions 
        WHERE ${whereClause}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `, params);

      // 获取相关用户信息
      const transactionsWithUsers = await Promise.all(
        transactions.map(async (transaction) => {
          const relatedUser = transaction.relatedUserId ? 
            await User.findById(transaction.relatedUserId) : null;
          
          const metadata = transaction.metadata ? 
            JSON.parse(transaction.metadata) : {};

          return {
            ...transaction,
            relatedUser: relatedUser ? {
              id: relatedUser.id,
              username: relatedUser.username,
              email: relatedUser.email
            } : null,
            metadata: metadata
          };
        })
      );

      return {
        success: true,
        data: {
          transactions: transactionsWithUsers,
          statistics: {
            totalCount: parseInt(stats.totalCount),
            totalAmount: parseFloat(stats.totalAmount || 0),
            avgAmount: parseFloat(stats.avgAmount || 0),
            minAmount: parseFloat(stats.minAmount || 0),
            maxAmount: parseFloat(stats.maxAmount || 0)
          },
          dailyStats: dailyStats.map(stat => ({
            date: stat.date,
            count: parseInt(stat.count),
            amount: parseFloat(stat.amount)
          })),
          pagination: {
            limit: limit,
            offset: offset,
            hasMore: transactions.length === limit
          }
        }
      };

    } catch (error) {
      console.error('获取空结构报告失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户相关的空结构记录
   * @param {number} userId - 用户ID
   * @returns {Array} 相关的空结构记录
   */
  static async getUserEmptyStructureRecords(userId) {
    try {
      const [transactions] = await pool.execute(`
        SELECT * FROM transactions 
        WHERE type = 'empty_structure_fund' 
        AND related_user_id = ?
        ORDER BY created_at DESC
      `, [userId]);

      return transactions.map(transaction => {
        const metadata = transaction.metadata ? 
          JSON.parse(transaction.metadata) : {};
        
        return {
          ...transaction,
          metadata: metadata
        };
      });

    } catch (error) {
      console.error('获取用户空结构记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取空结构资金流向详情
   * @param {string} transactionId - 交易ID
   * @returns {Object} 详细信息
   */
  static async getEmptyStructureDetail(transactionId) {
    try {
      const transaction = await Transaction.findById(transactionId);
      
      if (!transaction || transaction.type !== 'empty_structure_fund') {
        throw new Error('空结构交易记录不存在');
      }

      const metadata = transaction.metadata ? 
        JSON.parse(transaction.metadata) : {};

      // 获取相关用户信息
      const relatedUser = transaction.relatedUserId ? 
        await User.findById(transaction.relatedUserId) : null;

      // 获取该用户的上级链条信息（用于分析空结构原因）
      let ancestorChain = [];
      if (relatedUser) {
        const EmptyStructureService = require('./EmptyStructureService');
        ancestorChain = await EmptyStructureService.getAncestorChain(relatedUser.id);
      }

      return {
        success: true,
        data: {
          transaction: transaction,
          metadata: metadata,
          relatedUser: relatedUser ? {
            id: relatedUser.id,
            username: relatedUser.username,
            email: relatedUser.email,
            inviter_id: relatedUser.inviter_id
          } : null,
          ancestorChain: ancestorChain,
          analysis: {
            actualLevels: metadata.actualLevels || 0,
            missingLevels: metadata.missingLevels || 0,
            expectedAmount: 70, // 总共应分配70 USDT
            distributedAmount: (metadata.actualLevels || 0) * 10,
            emptyStructureAmount: transaction.amount
          }
        }
      };

    } catch (error) {
      console.error('获取空结构详情失败:', error);
      throw error;
    }
  }

  /**
   * 导出空结构报告（CSV格式）
   * @param {Object} options - 导出选项
   * @returns {string} CSV内容
   */
  static async exportEmptyStructureReport(options = {}) {
    try {
      const report = await this.getEmptyStructureReport({
        ...options,
        limit: 10000 // 导出时获取更多数据
      });

      const csvHeaders = [
        '交易ID',
        '金额(USDT)',
        '相关用户ID',
        '用户名',
        '实际层级',
        '缺失层级',
        '创建时间',
        '描述'
      ];

      const csvRows = report.data.transactions.map(transaction => [
        transaction.id,
        transaction.amount,
        transaction.relatedUserId || '',
        transaction.relatedUser ? transaction.relatedUser.username : '',
        transaction.metadata.actualLevels || 0,
        transaction.metadata.missingLevels || 0,
        transaction.createdAt,
        transaction.description
      ]);

      // 构建CSV内容
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      return csvContent;

    } catch (error) {
      console.error('导出空结构报告失败:', error);
      throw error;
    }
  }

  /**
   * 获取空结构资金趋势分析
   * @param {number} days - 分析天数
   * @returns {Object} 趋势分析数据
   */
  static async getEmptyStructureTrend(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [trendData] = await pool.execute(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as transactionCount,
          SUM(amount) as totalAmount,
          AVG(amount) as avgAmount,
          SUM(JSON_EXTRACT(metadata, '$.missingLevels')) as totalMissingLevels
        FROM transactions 
        WHERE type = 'empty_structure_fund' 
        AND created_at >= ?
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `, [startDate.toISOString().split('T')[0]]);

      // 计算趋势指标
      const totalTransactions = trendData.reduce((sum, day) => sum + parseInt(day.transactionCount), 0);
      const totalAmount = trendData.reduce((sum, day) => sum + parseFloat(day.totalAmount), 0);
      const avgDailyAmount = totalAmount / days;

      return {
        success: true,
        data: {
          period: {
            days: days,
            startDate: startDate.toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0]
          },
          summary: {
            totalTransactions: totalTransactions,
            totalAmount: totalAmount,
            avgDailyAmount: avgDailyAmount,
            avgTransactionAmount: totalTransactions > 0 ? totalAmount / totalTransactions : 0
          },
          dailyData: trendData.map(day => ({
            date: day.date,
            transactionCount: parseInt(day.transactionCount),
            totalAmount: parseFloat(day.totalAmount),
            avgAmount: parseFloat(day.avgAmount),
            totalMissingLevels: parseInt(day.totalMissingLevels || 0)
          }))
        }
      };

    } catch (error) {
      console.error('获取空结构趋势失败:', error);
      throw error;
    }
  }
}

module.exports = EmptyStructureReportService;