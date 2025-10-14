/**
 * 充值监听API路由
 * 提供充值地址监听和交易确认接口
 */

const express = require('express');
const router = express.Router();
const depositMonitoringService = require('../services/depositMonitoringService');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * 开始监控充值
 * POST /api/deposit/start-monitoring
 */
router.post('/start-monitoring', authenticateToken, async (req, res) => {
    try {
        const { addresses } = req.body;

        if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
            return res.status(400).json({
                success: false,
                message: '请提供要监控的地址列表'
            });
        }

        await depositMonitoringService.startMonitoring(addresses);

        res.json({
            success: true,
            message: '开始监控充值',
            data: {
                addressCount: addresses.length,
                status: depositMonitoringService.getMonitoringStatus()
            }
        });

    } catch (error) {
        logger.error('开始监控失败', { error: error.message });
        res.status(500).json({
            success: false,
            message: '开始监控失败',
            error: error.message
        });
    }
});

/**
 * 停止监控充值
 * POST /api/deposit/stop-monitoring
 */
router.post('/stop-monitoring', authenticateToken, async (req, res) => {
    try {
        await depositMonitoringService.stopMonitoring();

        res.json({
            success: true,
            message: '停止监控充值',
            data: {
                status: depositMonitoringService.getMonitoringStatus()
            }
        });

    } catch (error) {
        logger.error('停止监控失败', { error: error.message });
        res.status(500).json({
            success: false,
            message: '停止监控失败',
            error: error.message
        });
    }
});

/**
 * 添加监控地址
 * POST /api/deposit/add-addresses
 */
router.post('/add-addresses', authenticateToken, async (req, res) => {
    try {
        const { addresses } = req.body;

        if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
            return res.status(400).json({
                success: false,
                message: '请提供要添加的地址列表'
            });
        }

        depositMonitoringService.addMonitoredAddresses(addresses);

        res.json({
            success: true,
            message: '添加监控地址成功',
            data: {
                addedCount: addresses.length,
                status: depositMonitoringService.getMonitoringStatus()
            }
        });

    } catch (error) {
        logger.error('添加监控地址失败', { error: error.message });
        res.status(500).json({
            success: false,
            message: '添加监控地址失败',
            error: error.message
        });
    }
});

/**
 * 移除监控地址
 * POST /api/deposit/remove-addresses
 */
router.post('/remove-addresses', authenticateToken, async (req, res) => {
    try {
        const { addresses } = req.body;

        if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
            return res.status(400).json({
                success: false,
                message: '请提供要移除的地址列表'
            });
        }

        depositMonitoringService.removeMonitoredAddresses(addresses);

        res.json({
            success: true,
            message: '移除监控地址成功',
            data: {
                removedCount: addresses.length,
                status: depositMonitoringService.getMonitoringStatus()
            }
        });

    } catch (error) {
        logger.error('移除监控地址失败', { error: error.message });
        res.status(500).json({
            success: false,
            message: '移除监控地址失败',
            error: error.message
        });
    }
});

/**
 * 手动检查地址充值
 * POST /api/deposit/manual-check
 */
router.post('/manual-check', authenticateToken, async (req, res) => {
    try {
        const { address, fromBlock, toBlock } = req.body;

        if (!address) {
            return res.status(400).json({
                success: false,
                message: '请提供要检查的地址'
            });
        }

        if (!fromBlock || !toBlock) {
            return res.status(400).json({
                success: false,
                message: '请提供区块范围'
            });
        }

        if (fromBlock > toBlock) {
            return res.status(400).json({
                success: false,
                message: '起始区块不能大于结束区块'
            });
        }

        const deposits = await depositMonitoringService.manualCheckDeposits(
            address, 
            fromBlock, 
            toBlock
        );

        res.json({
            success: true,
            message: '手动检查完成',
            data: {
                address,
                blockRange: `${fromBlock}-${toBlock}`,
                deposits,
                count: deposits.length
            }
        });

    } catch (error) {
        logger.error('手动检查失败', { error: error.message });
        res.status(500).json({
            success: false,
            message: '手动检查失败',
            error: error.message
        });
    }
});

/**
 * 获取监控状态
 * GET /api/deposit/status
 */
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const status = depositMonitoringService.getMonitoringStatus();

        res.json({
            success: true,
            message: '获取监控状态成功',
            data: status
        });

    } catch (error) {
        logger.error('获取监控状态失败', { error: error.message });
        res.status(500).json({
            success: false,
            message: '获取监控状态失败',
            error: error.message
        });
    }
});

/**
 * 充值监控健康检查
 * GET /api/deposit/health
 */
router.get('/health', async (req, res) => {
    try {
        const health = await depositMonitoringService.healthCheck();

        res.status(health.healthy ? 200 : 503).json({
            success: health.healthy,
            message: health.healthy ? '服务健康' : '服务异常',
            data: health
        });

    } catch (error) {
        logger.error('健康检查失败', { error: error.message });
        res.status(503).json({
            success: false,
            message: '健康检查失败',
            error: error.message
        });
    }
});

// 监听充值事件
depositMonitoringService.on('depositDetected', (depositInfo) => {
    logger.info('检测到新充值', depositInfo);
    
    // 这里可以添加业务逻辑，比如：
    // 1. 更新用户余额
    // 2. 发送通知
    // 3. 记录充值记录
    // 4. 触发其他业务流程
});

depositMonitoringService.on('monitoringStarted', (info) => {
    logger.info('监控服务已启动', info);
});

depositMonitoringService.on('monitoringStopped', () => {
    logger.info('监控服务已停止');
});

depositMonitoringService.on('scanError', (error) => {
    logger.error('扫描区块出错', { error: error.message });
});

module.exports = router;