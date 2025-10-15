/**
 * HD钱包管理路由
 * 提供钱包地址分配、资金归集等功能的API接口
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdminAuth } = require('../middleware/auth');
const fundConsolidationService = require('../services/fundConsolidationService');
const tatumService = require('../services/tatumService');
const UserWalletAddress = require('../models/UserWalletAddress');

/**
 * 获取用户钱包地址信息
 * GET /api/hd-wallet/address/:userId
 */
router.get('/address/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // 验证用户权限（只能查看自己的钱包或管理员）
        if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '无权限访问此钱包信息'
            });
        }
        
        const walletAddress = await UserWalletAddress.findByUserId(userId);
        
        if (!walletAddress) {
            return res.status(404).json({
                success: false,
                message: '未找到钱包地址'
            });
        }
        
        // 获取钱包余额
        const balance = await tatumService.getUSDTBalance(walletAddress.wallet_address);
        
        res.json({
            success: true,
            data: {
                wallet_address: walletAddress.wallet_address,
                network: walletAddress.network,
                address_index: walletAddress.address_index,
                balance: balance,
                created_at: walletAddress.created_at
            }
        });
        
    } catch (error) {
        console.error('获取钱包地址失败:', error);
        res.status(500).json({
            success: false,
            message: '获取钱包地址失败'
        });
    }
});

/**
 * 获取资金归集统计信息
 * GET /api/hd-wallet/consolidation/stats
 */
router.get('/consolidation/stats', requireAdminAuth, async (req, res) => {
    try {
        const stats = await fundConsolidationService.getConsolidationStats();
        
        res.json({
            success: true,
            data: stats
        });
        
    } catch (error) {
        console.error('获取归集统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取归集统计失败'
        });
    }
});

/**
 * 手动触发资金归集
 * POST /api/hd-wallet/consolidation/manual
 */
router.post('/consolidation/manual', requireAdminAuth, async (req, res) => {
    try {
        const { minAmount } = req.body;
        
        const result = await fundConsolidationService.manualConsolidate(minAmount);
        
        res.json(result);
        
    } catch (error) {
        console.error('手动归集失败:', error);
        res.status(500).json({
            success: false,
            message: '手动归集失败'
        });
    }
});

/**
 * 启动自动归集服务
 * POST /api/hd-wallet/consolidation/start
 */
router.post('/consolidation/start', requireAdminAuth, async (req, res) => {
    try {
        await fundConsolidationService.startAutoConsolidation();
        
        res.json({
            success: true,
            message: '自动归集服务已启动'
        });
        
    } catch (error) {
        console.error('启动自动归集失败:', error);
        res.status(500).json({
            success: false,
            message: '启动自动归集失败'
        });
    }
});

/**
 * 停止自动归集服务
 * POST /api/hd-wallet/consolidation/stop
 */
router.post('/consolidation/stop', requireAdminAuth, async (req, res) => {
    try {
        fundConsolidationService.stopAutoConsolidation();
        
        res.json({
            success: true,
            message: '自动归集服务已停止'
        });
        
    } catch (error) {
        console.error('停止自动归集失败:', error);
        res.status(500).json({
            success: false,
            message: '停止自动归集失败'
        });
    }
});

/**
 * 获取归集历史记录
 * GET /api/hd-wallet/consolidation/history
 */
router.get('/consolidation/history', requireAdminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 10, status, startDate, endDate } = req.query;
        
        const filters = {};
        if (status) filters.status = status;
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;
        
        const history = await fundConsolidationService.getConsolidationHistory(
            parseInt(page),
            parseInt(limit),
            filters
        );
        
        res.json({
            success: true,
            data: history
        });
        
    } catch (error) {
        console.error('获取归集历史失败:', error);
        res.status(500).json({
            success: false,
            message: '获取归集历史失败'
        });
    }
});

/**
 * 获取待归集钱包列表
 * GET /api/hd-wallet/consolidation/pending
 */
router.get('/consolidation/pending', requireAdminAuth, async (req, res) => {
    try {
        const { minBalance = 10 } = req.query;
        
        const wallets = await fundConsolidationService.getWalletsForConsolidation(
            parseFloat(minBalance)
        );
        
        res.json({
            success: true,
            data: {
                wallets: wallets,
                count: wallets.length,
                totalAmount: wallets.reduce((sum, w) => sum + w.balance, 0)
            }
        });
        
    } catch (error) {
        console.error('获取待归集钱包失败:', error);
        res.status(500).json({
            success: false,
            message: '获取待归集钱包失败'
        });
    }
});

/**
 * 测试HD钱包功能
 * POST /api/hd-wallet/test
 */
router.post('/test', requireAdminAuth, async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: '请提供用户ID'
            });
        }
        
        // 生成测试钱包地址
        const walletInfo = await tatumService.generateUserDepositAddress(userId);
        
        res.json({
            success: true,
            message: 'HD钱包测试成功',
            data: {
                wallet_address: walletInfo.address,
                address_index: walletInfo.addressIndex,
                private_key_encrypted: walletInfo.privateKeyEncrypted ? '已加密' : '未加密'
            }
        });
        
    } catch (error) {
        console.error('HD钱包测试失败:', error);
        res.status(500).json({
            success: false,
            message: 'HD钱包测试失败: ' + error.message
        });
    }
});

module.exports = router;