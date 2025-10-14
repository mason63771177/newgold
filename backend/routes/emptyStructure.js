const express = require('express');
const router = express.Router();
const EmptyStructureController = require('../controllers/emptyStructureController');
const { authenticateToken } = require('../middleware/auth');

/**
 * 空结构资金管理路由
 */

// 获取空结构资金报告（需要管理员权限）
router.get('/report', authenticateToken, EmptyStructureController.getReport);

// 获取用户相关的空结构记录
router.get('/user/:userId?', authenticateToken, EmptyStructureController.getUserRecords);

// 获取空结构详情
router.get('/detail/:transactionId', authenticateToken, EmptyStructureController.getDetail);

// 导出空结构报告（需要管理员权限）
router.get('/export', authenticateToken, EmptyStructureController.exportReport);

// 获取空结构趋势分析（需要管理员权限）
router.get('/trend', authenticateToken, EmptyStructureController.getTrend);

// 获取空结构统计概览（需要管理员权限）
router.get('/overview', authenticateToken, EmptyStructureController.getOverview);

// 手动处理用户的空结构（需要管理员权限）
router.post('/process/:userId', authenticateToken, EmptyStructureController.processUserEmptyStructure);

module.exports = router;