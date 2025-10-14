/**
 * 监控相关路由
 * 提供健康检查、指标查询、告警管理等接口
 */

const express = require('express');
const router = express.Router();
const { monitoringService, healthCheckMiddleware, metricsMiddleware } = require('../middleware/monitoring');
const { authenticateToken, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @route GET /monitoring/health
 * @desc 健康检查接口
 * @access Public
 */
router.get('/health', healthCheckMiddleware);

/**
 * @route GET /monitoring/metrics
 * @desc 获取监控指标
 * @access Private (Admin only)
 */
router.get('/metrics', authenticateToken, requireRole('admin'), metricsMiddleware);

/**
 * @route GET /monitoring/summary
 * @desc 获取监控摘要
 * @access Private (Admin only)
 */
router.get('/summary', authenticateToken, requireRole('admin'), (req, res) => {
    try {
        const summary = monitoringService.getSummary();
        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        logger.error('获取监控摘要失败', { error: error.message });
        res.status(500).json({
            success: false,
            message: '获取监控摘要失败'
        });
    }
});

/**
 * @route GET /monitoring/alerts
 * @desc 获取告警列表
 * @access Private (Admin only)
 */
router.get('/alerts', authenticateToken, requireRole('admin'), (req, res) => {
    try {
        const { level, limit = 50, offset = 0 } = req.query;
        
        let alerts = Array.from(monitoringService.alerts.values());
        
        // 按级别过滤
        if (level) {
            alerts = alerts.filter(alert => alert.level === level);
        }
        
        // 按时间倒序排序
        alerts.sort((a, b) => b.timestamp - a.timestamp);
        
        // 分页
        const total = alerts.length;
        alerts = alerts.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
        
        res.json({
            success: true,
            data: {
                alerts,
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: parseInt(offset) + parseInt(limit) < total
                }
            }
        });
    } catch (error) {
        logger.error('获取告警列表失败', { error: error.message });
        res.status(500).json({
            success: false,
            message: '获取告警列表失败'
        });
    }
});

/**
 * @route DELETE /monitoring/alerts/:alertId
 * @desc 清除特定告警
 * @access Private (Admin only)
 */
router.delete('/alerts/:alertId', authenticateToken, requireRole('admin'), (req, res) => {
    try {
        const { alertId } = req.params;
        
        if (monitoringService.alerts.has(alertId)) {
            monitoringService.alerts.delete(alertId);
            logger.info('告警已清除', { alertId, operator: req.user.username });
            
            res.json({
                success: true,
                message: '告警已清除'
            });
        } else {
            res.status(404).json({
                success: false,
                message: '告警不存在'
            });
        }
    } catch (error) {
        logger.error('清除告警失败', { error: error.message });
        res.status(500).json({
            success: false,
            message: '清除告警失败'
        });
    }
});

/**
 * @route DELETE /monitoring/alerts
 * @desc 清除所有告警
 * @access Private (Admin only)
 */
router.delete('/alerts', authenticateToken, requireRole('admin'), (req, res) => {
    try {
        const alertCount = monitoringService.alerts.size;
        monitoringService.alerts.clear();
        
        logger.info('所有告警已清除', { count: alertCount, operator: req.user.username });
        
        res.json({
            success: true,
            message: `已清除 ${alertCount} 个告警`
        });
    } catch (error) {
        logger.error('清除所有告警失败', { error: error.message });
        res.status(500).json({
            success: false,
            message: '清除所有告警失败'
        });
    }
});

/**
 * @route GET /monitoring/performance
 * @desc 获取性能数据
 * @access Private (Admin only)
 */
router.get('/performance', authenticateToken, requireRole('admin'), (req, res) => {
    try {
        const { 
            path, 
            method, 
            limit = 100, 
            offset = 0,
            startTime,
            endTime 
        } = req.query;
        
        let performanceData = [...monitoringService.performanceData];
        
        // 按路径过滤
        if (path) {
            performanceData = performanceData.filter(data => 
                data.path && data.path.includes(path)
            );
        }
        
        // 按方法过滤
        if (method) {
            performanceData = performanceData.filter(data => 
                data.method === method.toUpperCase()
            );
        }
        
        // 按时间范围过滤
        if (startTime) {
            performanceData = performanceData.filter(data => 
                data.timestamp >= parseInt(startTime)
            );
        }
        
        if (endTime) {
            performanceData = performanceData.filter(data => 
                data.timestamp <= parseInt(endTime)
            );
        }
        
        // 按时间倒序排序
        performanceData.sort((a, b) => b.timestamp - a.timestamp);
        
        // 分页
        const total = performanceData.length;
        performanceData = performanceData.slice(
            parseInt(offset), 
            parseInt(offset) + parseInt(limit)
        );
        
        // 计算统计信息
        const stats = {
            total,
            averageResponseTime: total > 0 
                ? performanceData.reduce((sum, d) => sum + d.responseTime, 0) / total 
                : 0,
            slowRequests: performanceData.filter(d => d.responseTime > 1000).length,
            errorRequests: performanceData.filter(d => d.statusCode >= 400).length
        };
        
        res.json({
            success: true,
            data: {
                performance: performanceData,
                stats,
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: parseInt(offset) + parseInt(limit) < total
                }
            }
        });
    } catch (error) {
        logger.error('获取性能数据失败', { error: error.message });
        res.status(500).json({
            success: false,
            message: '获取性能数据失败'
        });
    }
});

/**
 * @route GET /monitoring/system
 * @desc 获取系统指标
 * @access Private (Admin only)
 */
router.get('/system', authenticateToken, requireRole('admin'), (req, res) => {
    try {
        const systemMetrics = monitoringService.metrics.get('system');
        
        if (!systemMetrics) {
            return res.status(404).json({
                success: false,
                message: '系统指标暂未收集'
            });
        }
        
        res.json({
            success: true,
            data: systemMetrics
        });
    } catch (error) {
        logger.error('获取系统指标失败', { error: error.message });
        res.status(500).json({
            success: false,
            message: '获取系统指标失败'
        });
    }
});

/**
 * @route POST /monitoring/test-alert
 * @desc 测试告警功能
 * @access Private (Admin only)
 */
router.post('/test-alert', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { level = 'warning', message = '这是一个测试告警' } = req.body;
        
        if (!['warning', 'critical'].includes(level)) {
            return res.status(400).json({
                success: false,
                message: '告警级别必须是 warning 或 critical'
            });
        }
        
        await monitoringService.triggerAlert(
            'test_alert',
            `${message} (由 ${req.user.username} 触发)`,
            level
        );
        
        logger.info('测试告警已触发', { 
            level, 
            message, 
            operator: req.user.username 
        });
        
        res.json({
            success: true,
            message: '测试告警已发送'
        });
    } catch (error) {
        logger.error('触发测试告警失败', { error: error.message });
        res.status(500).json({
            success: false,
            message: '触发测试告警失败'
        });
    }
});

/**
 * @route GET /monitoring/dashboard
 * @desc 获取监控仪表板数据
 * @access Private (Admin only)
 */
router.get('/dashboard', authenticateToken, requireRole('admin'), (req, res) => {
    try {
        const summary = monitoringService.getSummary();
        const systemMetrics = monitoringService.metrics.get('system') || {};
        const recentAlerts = Array.from(monitoringService.alerts.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);
        
        // 获取最近1小时的性能数据
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        const recentPerformance = monitoringService.performanceData
            .filter(data => data.timestamp > oneHourAgo)
            .slice(-50);
        
        const dashboard = {
            summary,
            system: {
                cpu: systemMetrics.cpu || { usage: 0 },
                memory: systemMetrics.memory || { usage: 0 },
                loadAverage: systemMetrics.loadAverage || [0, 0, 0],
                uptime: systemMetrics.uptime || 0
            },
            alerts: {
                recent: recentAlerts,
                counts: {
                    total: recentAlerts.length,
                    critical: recentAlerts.filter(a => a.level === 'critical').length,
                    warning: recentAlerts.filter(a => a.level === 'warning').length
                }
            },
            performance: {
                recent: recentPerformance,
                stats: {
                    totalRequests: recentPerformance.length,
                    averageResponseTime: recentPerformance.length > 0
                        ? recentPerformance.reduce((sum, d) => sum + d.responseTime, 0) / recentPerformance.length
                        : 0,
                    errorRate: recentPerformance.length > 0
                        ? (recentPerformance.filter(d => d.statusCode >= 400).length / recentPerformance.length) * 100
                        : 0
                }
            },
            health: Object.fromEntries(monitoringService.healthStatus)
        };
        
        res.json({
            success: true,
            data: dashboard
        });
    } catch (error) {
        logger.error('获取监控仪表板数据失败', { error: error.message });
        res.status(500).json({
            success: false,
            message: '获取监控仪表板数据失败'
        });
    }
});

module.exports = router;