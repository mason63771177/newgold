/**
 * 手续费利润管理路由
 * 提供手续费利润查询、统计等API接口
 */

const express = require('express');
const router = express.Router();
const feeProfitService = require('../services/feeProfitService');
const { authenticateToken } = require('../middleware/auth');

/**
 * 获取手续费利润统计
 * GET /api/fee-profit/stats?days=30
 */
router.get('/stats', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const stats = await feeProfitService.getFeeProfitStats(days);
        
        res.json({
            success: true,
            data: stats,
            message: '获取手续费利润统计成功'
        });
    } catch (error) {
        console.error('获取手续费利润统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取手续费利润统计失败',
            error: error.message
        });
    }
});

/**
 * 获取利润钱包余额
 * GET /api/fee-profit/balance
 */
router.get('/balance', async (req, res) => {
    try {
        const balance = await feeProfitService.getProfitWalletBalance();
        
        res.json({
            success: true,
            data: {
                balance: balance,
                address: process.env.PROFIT_WALLET_ADDRESS || 'TProfit1234567890123456789012345'
            },
            message: '获取利润钱包余额成功'
        });
    } catch (error) {
        console.error('获取利润钱包余额失败:', error);
        res.status(500).json({
            success: false,
            message: '获取利润钱包余额失败',
            error: error.message
        });
    }
});

/**
 * 获取手续费利润记录列表
 * GET /api/fee-profit/records?page=1&limit=20&status=completed
 */
router.get('/records', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        
        const records = await feeProfitService.getFeeProfitRecords({
            page,
            limit,
            status,
            startDate,
            endDate
        });
        
        res.json({
            success: true,
            data: records,
            message: '获取手续费利润记录成功'
        });
    } catch (error) {
        console.error('获取手续费利润记录失败:', error);
        res.status(500).json({
            success: false,
            message: '获取手续费利润记录失败',
            error: error.message
        });
    }
});

/**
 * 手动触发手续费利润转账
 * POST /api/fee-profit/transfer/:withdrawalId
 */
router.post('/transfer/:withdrawalId', async (req, res) => {
    try {
        const { withdrawalId } = req.params;
        const { amount, txHash } = req.body;
        
        if (!amount || !txHash) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数: amount 和 txHash'
            });
        }
        
        const result = await feeProfitService.transferFeeProfit(withdrawalId, amount, txHash);
        
        res.json({
            success: true,
            data: result,
            message: result.success ? '手续费利润转账成功' : '手续费利润转账失败'
        });
    } catch (error) {
        console.error('手动触发手续费利润转账失败:', error);
        res.status(500).json({
            success: false,
            message: '手动触发手续费利润转账失败',
            error: error.message
        });
    }
});

/**
 * 获取手续费配置信息
 * GET /api/fee-profit/config
 */
router.get('/config', async (req, res) => {
    try {
        const config = {
            customerFixedFee: parseFloat(process.env.CUSTOMER_FIXED_FEE) || 2.0,
            customerPercentageFeeMin: parseFloat(process.env.CUSTOMER_PERCENTAGE_FEE_MIN) || 0.01,
            customerPercentageFeeMax: parseFloat(process.env.CUSTOMER_PERCENTAGE_FEE_MAX) || 0.05,
            tatumActualFee: parseFloat(process.env.TATUM_ACTUAL_FEE) || 1.0,
            profitWalletAddress: process.env.PROFIT_WALLET_ADDRESS || 'TProfit1234567890123456789012345'
        };
        
        res.json({
            success: true,
            data: config,
            message: '获取手续费配置成功'
        });
    } catch (error) {
        console.error('获取手续费配置失败:', error);
        res.status(500).json({
            success: false,
            message: '获取手续费配置失败',
            error: error.message
        });
    }
});

module.exports = router;