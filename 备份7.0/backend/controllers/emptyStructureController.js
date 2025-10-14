const EmptyStructureReportService = require('../services/EmptyStructureReportService');
const EmptyStructureService = require('../services/EmptyStructureService');

/**
 * 空结构控制器
 * 提供空结构资金查询和管理的API接口
 */
class EmptyStructureController {

  /**
   * 获取空结构资金报告
   */
  static async getReport(req, res) {
    try {
      const {
        startDate,
        endDate,
        limit = 50,
        offset = 0
      } = req.query;

      const options = {
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

      const report = await EmptyStructureReportService.getEmptyStructureReport(options);

      res.json({
        success: true,
        message: '获取空结构报告成功',
        data: report.data
      });

    } catch (error) {
      console.error('获取空结构报告失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取用户相关的空结构记录
   */
  static async getUserRecords(req, res) {
    try {
      const userId = req.params.userId || req.user.id;

      const records = await EmptyStructureReportService.getUserEmptyStructureRecords(userId);

      res.json({
        success: true,
        message: '获取用户空结构记录成功',
        data: {
          records: records,
          count: records.length
        }
      });

    } catch (error) {
      console.error('获取用户空结构记录失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取空结构详情
   */
  static async getDetail(req, res) {
    try {
      const { transactionId } = req.params;

      const detail = await EmptyStructureReportService.getEmptyStructureDetail(transactionId);

      res.json({
        success: true,
        message: '获取空结构详情成功',
        data: detail.data
      });

    } catch (error) {
      console.error('获取空结构详情失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  /**
   * 导出空结构报告
   */
  static async exportReport(req, res) {
    try {
      const {
        startDate,
        endDate,
        format = 'csv'
      } = req.query;

      const options = {
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      };

      if (format === 'csv') {
        const csvContent = await EmptyStructureReportService.exportEmptyStructureReport(options);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="empty_structure_report_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      } else {
        res.status(400).json({
          success: false,
          message: '不支持的导出格式'
        });
      }

    } catch (error) {
      console.error('导出空结构报告失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取空结构趋势分析
   */
  static async getTrend(req, res) {
    try {
      const { days = 30 } = req.query;

      const trend = await EmptyStructureReportService.getEmptyStructureTrend(parseInt(days));

      res.json({
        success: true,
        message: '获取空结构趋势成功',
        data: trend.data
      });

    } catch (error) {
      console.error('获取空结构趋势失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 手动处理用户的空结构（管理员功能）
   */
  static async processUserEmptyStructure(req, res) {
    try {
      const { userId } = req.params;

      // 检查管理员权限
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: '权限不足'
        });
      }

      const result = await EmptyStructureService.processEmptyStructure(parseInt(userId));

      res.json({
        success: true,
        message: '手动处理空结构成功',
        data: result
      });

    } catch (error) {
      console.error('手动处理空结构失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  /**
   * 获取空结构统计概览
   */
  static async getOverview(req, res) {
    try {
      // 获取今日统计
      const today = new Date().toISOString().split('T')[0];
      const todayReport = await EmptyStructureReportService.getEmptyStructureReport({
        startDate: today,
        endDate: today,
        limit: 1000
      });

      // 获取本月统计
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthReport = await EmptyStructureReportService.getEmptyStructureReport({
        startDate: monthStart.toISOString().split('T')[0],
        limit: 10000
      });

      // 获取总统计
      const totalReport = await EmptyStructureReportService.getEmptyStructureReport({
        limit: 10000
      });

      res.json({
        success: true,
        message: '获取空结构概览成功',
        data: {
          today: {
            count: todayReport.data.statistics.totalCount,
            amount: todayReport.data.statistics.totalAmount
          },
          thisMonth: {
            count: monthReport.data.statistics.totalCount,
            amount: monthReport.data.statistics.totalAmount
          },
          total: {
            count: totalReport.data.statistics.totalCount,
            amount: totalReport.data.statistics.totalAmount
          }
        }
      });

    } catch (error) {
      console.error('获取空结构概览失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
}

module.exports = EmptyStructureController;