/**
 * 余额查询API路由
 * 提供TRX和USDT余额查询接口
 */

const express = require('express');
const router = express.Router();
const balanceQueryService = require('../services/balanceQueryService');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * 查询单个地址的TRX余额
 * GET /api/balance/trx/:address
 */
router.get('/trx/:address', authenticateToken, async (req, res) => {
    try {
        const { address } = req.params;
        const { useCache = 'true' } = req.query;
        
        if (!address) {
            return res.status(400).json({
                success: false,
                message: '地址参数不能为空'
            });
        }

        const balance = await balanceQueryService.getTrxBalance(
            address, 
            useCache === 'true'
        );

        res.json({
            success: true,
            data: balance
        });

    } catch (error) {
        logger.error('查询TRX余额失败', { 
            address: req.params.address, 
            error: error.message 
        });
        
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * 查询单个地址的USDT余额
 * GET /api/balance/usdt/:address
 */
router.get('/usdt/:address', authenticateToken, async (req, res) => {
    try {
        const { address } = req.params;
        const { useCache = 'true' } = req.query;
        
        if (!address) {
            return res.status(400).json({
                success: false,
                message: '地址参数不能为空'
            });
        }

        const balance = await balanceQueryService.getUsdtBalance(
            address, 
            useCache === 'true'
        );

        res.json({
            success: true,
            data: balance
        });

    } catch (error) {
        logger.error('查询USDT余额失败', { 
            address: req.params.address, 
            error: error.message 
        });
        
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * 查询单个地址的完整余额（TRX + USDT）
 * GET /api/balance/full/:address
 */
router.get('/full/:address', authenticateToken, async (req, res) => {
    try {
        const { address } = req.params;
        const { useCache = 'true' } = req.query;
        
        if (!address) {
            return res.status(400).json({
                success: false,
                message: '地址参数不能为空'
            });
        }

        const balance = await balanceQueryService.getFullBalance(
            address, 
            useCache === 'true'
        );

        res.json({
            success: true,
            data: balance
        });

    } catch (error) {
        logger.error('查询完整余额失败', { 
            address: req.params.address, 
            error: error.message 
        });
        
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * 批量查询余额
 * POST /api/balance/batch
 * Body: {
 *   addresses: ["address1", "address2", ...],
 *   currency: "TRX" | "USDT" | "ALL",
 *   useCache: true
 * }
 */
router.post('/batch', authenticateToken, async (req, res) => {
    try {
        const { addresses, currency = 'ALL', useCache = true } = req.body;
        
        if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
            return res.status(400).json({
                success: false,
                message: '地址数组不能为空'
            });
        }

        if (addresses.length > 10) {
            return res.status(400).json({
                success: false,
                message: '批量查询地址数量不能超过10个'
            });
        }

        const balances = await balanceQueryService.getBatchBalances(
            addresses, 
            currency, 
            useCache
        );

        res.json({
            success: true,
            data: {
                results: balances,
                summary: {
                    total: balances.length,
                    successful: balances.filter(b => b.success).length,
                    failed: balances.filter(b => !b.success).length
                }
            }
        });

    } catch (error) {
        logger.error('批量查询余额失败', { error: error.message });
        
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * 获取余额统计信息
 * POST /api/balance/statistics
 * Body: {
 *   addresses: ["address1", "address2", ...]
 * }
 */
router.post('/statistics', authenticateToken, async (req, res) => {
    try {
        const { addresses } = req.body;
        
        if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
            return res.status(400).json({
                success: false,
                message: '地址数组不能为空'
            });
        }

        const statistics = await balanceQueryService.getBalanceStatistics(addresses);

        res.json({
            success: true,
            data: statistics
        });

    } catch (error) {
        logger.error('获取余额统计失败', { error: error.message });
        
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * 清除地址余额缓存
 * DELETE /api/balance/cache/:address
 */
router.delete('/cache/:address', authenticateToken, async (req, res) => {
    try {
        const { address } = req.params;
        const { currency = 'ALL' } = req.query;
        
        if (!address) {
            return res.status(400).json({
                success: false,
                message: '地址参数不能为空'
            });
        }

        await balanceQueryService.clearBalanceCache(address, currency);

        res.json({
            success: true,
            message: '缓存清除成功'
        });

    } catch (error) {
        logger.error('清除余额缓存失败', { 
            address: req.params.address, 
            error: error.message 
        });
        
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * 余额查询服务健康检查
 * GET /api/balance/health
 */
router.get('/health', async (req, res) => {
    try {
        const health = await balanceQueryService.healthCheck();

        res.status(health.healthy ? 200 : 503).json({
            success: health.healthy,
            data: health
        });

    } catch (error) {
        logger.error('余额服务健康检查失败', { error: error.message });
        
        res.status(503).json({
            success: false,
            message: '服务不可用'
        });
    }
});

/**
 * 获取用户钱包余额（基于用户ID）
 * GET /api/balance/user/:userId
 */
router.get('/user/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const { useCache = 'true' } = req.query;
        
        // 这里需要根据用户ID查询用户的钱包地址
        // 假设有一个用户钱包映射服务
        const userWalletService = require('../services/userWalletService');
        const userWallet = await userWalletService.getUserWallet(userId);
        
        if (!userWallet || !userWallet.depositAddress) {
            return res.status(404).json({
                success: false,
                message: '用户钱包不存在'
            });
        }

        const balance = await balanceQueryService.getFullBalance(
            userWallet.depositAddress, 
            useCache === 'true'
        );

        res.json({
            success: true,
            data: {
                userId,
                walletAddress: userWallet.depositAddress,
                balance: balance.balances
            }
        });

    } catch (error) {
        logger.error('查询用户余额失败', { 
            userId: req.params.userId, 
            error: error.message 
        });
        
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;