/**
 * 交易验证API路由
 * 提供交易验证和状态查询接口
 */

const express = require('express');
const router = express.Router();
const transactionVerificationService = require('../services/transactionVerificationService');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * 验证单个交易
 * GET /api/transaction/verify/:txHash
 */
router.get('/verify/:txHash', authenticateToken, async (req, res) => {
    try {
        const { txHash } = req.params;

        if (!txHash) {
            return res.status(400).json({
                success: false,
                message: '请提供交易哈希'
            });
        }

        const verification = await transactionVerificationService.verifyTransaction(txHash);

        res.json({
            success: true,
            message: '交易验证完成',
            data: verification
        });

    } catch (error) {
        logger.error('验证交易失败', { txHash: req.params.txHash, error: error.message });
        res.status(500).json({
            success: false,
            message: '验证交易失败',
            error: error.message
        });
    }
});

/**
 * 批量验证交易
 * POST /api/transaction/verify-batch
 */
router.post('/verify-batch', authenticateToken, async (req, res) => {
    try {
        const { txHashes } = req.body;

        if (!txHashes || !Array.isArray(txHashes) || txHashes.length === 0) {
            return res.status(400).json({
                success: false,
                message: '请提供交易哈希数组'
            });
        }

        if (txHashes.length > 100) {
            return res.status(400).json({
                success: false,
                message: '批量验证最多支持100个交易'
            });
        }

        const results = await transactionVerificationService.verifyTransactionsBatch(txHashes);

        res.json({
            success: true,
            message: '批量验证完成',
            data: {
                results,
                summary: {
                    total: results.length,
                    verified: results.filter(r => r.verified).length,
                    failed: results.filter(r => r.status === 'failed').length,
                    pending: results.filter(r => r.status === 'pending' || r.status === 'confirming').length
                }
            }
        });

    } catch (error) {
        logger.error('批量验证交易失败', { error: error.message });
        res.status(500).json({
            success: false,
            message: '批量验证交易失败',
            error: error.message
        });
    }
});

/**
 * 获取交易详情
 * GET /api/transaction/details/:txHash
 */
router.get('/details/:txHash', authenticateToken, async (req, res) => {
    try {
        const { txHash } = req.params;

        if (!txHash) {
            return res.status(400).json({
                success: false,
                message: '请提供交易哈希'
            });
        }

        const details = await transactionVerificationService.getTransactionDetails(txHash);

        if (!details) {
            return res.status(404).json({
                success: false,
                message: '交易不存在'
            });
        }

        res.json({
            success: true,
            message: '获取交易详情成功',
            data: details
        });

    } catch (error) {
        logger.error('获取交易详情失败', { txHash: req.params.txHash, error: error.message });
        res.status(500).json({
            success: false,
            message: '获取交易详情失败',
            error: error.message
        });
    }
});

/**
 * 等待交易确认
 * POST /api/transaction/wait-confirmation
 */
router.post('/wait-confirmation', authenticateToken, async (req, res) => {
    try {
        const { txHash, requiredConfirmations, timeout } = req.body;

        if (!txHash) {
            return res.status(400).json({
                success: false,
                message: '请提供交易哈希'
            });
        }

        // 设置合理的超时时间限制
        const maxTimeout = 600000; // 10分钟
        const actualTimeout = timeout && timeout <= maxTimeout ? timeout : 300000; // 默认5分钟

        const result = await transactionVerificationService.waitForConfirmation(
            txHash, 
            requiredConfirmations, 
            actualTimeout
        );

        res.json({
            success: true,
            message: '交易确认完成',
            data: result
        });

    } catch (error) {
        logger.error('等待交易确认失败', { 
            txHash: req.body.txHash, 
            error: error.message 
        });
        
        // 根据错误类型返回不同状态码
        let statusCode = 500;
        if (error.message.includes('超时')) {
            statusCode = 408;
        } else if (error.message.includes('不存在')) {
            statusCode = 404;
        } else if (error.message.includes('失败')) {
            statusCode = 400;
        }

        res.status(statusCode).json({
            success: false,
            message: '等待交易确认失败',
            error: error.message
        });
    }
});

/**
 * 清除交易验证缓存
 * DELETE /api/transaction/cache/:txHash
 */
router.delete('/cache/:txHash', authenticateToken, async (req, res) => {
    try {
        const { txHash } = req.params;

        if (!txHash) {
            return res.status(400).json({
                success: false,
                message: '请提供交易哈希'
            });
        }

        await transactionVerificationService.clearVerificationCache(txHash);

        res.json({
            success: true,
            message: '清除缓存成功',
            data: { txHash }
        });

    } catch (error) {
        logger.error('清除缓存失败', { txHash: req.params.txHash, error: error.message });
        res.status(500).json({
            success: false,
            message: '清除缓存失败',
            error: error.message
        });
    }
});

/**
 * 获取验证统计信息
 * GET /api/transaction/stats
 */
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const stats = await transactionVerificationService.getVerificationStats();

        res.json({
            success: true,
            message: '获取统计信息成功',
            data: stats
        });

    } catch (error) {
        logger.error('获取统计信息失败', { error: error.message });
        res.status(500).json({
            success: false,
            message: '获取统计信息失败',
            error: error.message
        });
    }
});

/**
 * 交易验证健康检查
 * GET /api/transaction/health
 */
router.get('/health', async (req, res) => {
    try {
        const health = await transactionVerificationService.healthCheck();

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

module.exports = router;