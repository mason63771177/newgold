/**
 * 虚拟钱包管理API路由
 * 提供会员虚拟钱包的创建、查询、余额管理等功能
 */

const express = require('express');
const router = express.Router();
const tatumVirtualAccountService = require('../services/tatumVirtualAccountService');
const { body, param, query, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');

/**
 * 为会员创建虚拟钱包
 * POST /api/virtual-wallet/create
 */
router.post('/create', [
    authenticateToken,
    body('userId').notEmpty().withMessage('用户ID不能为空')
], async (req, res) => {
    try {
        // 验证请求参数
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Invalid parameters',
                details: errors.array()
            });
        }

        const { userId } = req.body;

        console.log(`📝 为会员 ${userId} 创建虚拟钱包`);

        // 创建虚拟账户
        const virtualAccount = await tatumVirtualAccountService.createMemberVirtualAccount(userId);

        res.json({
            success: true,
            message: 'Virtual wallet created successfully',
            data: {
                userId: userId,
                accountId: virtualAccount.accountId,
                depositAddress: virtualAccount.depositAddress,
                currency: virtualAccount.currency,
                created: virtualAccount.created
            }
        });

    } catch (error) {
        console.error('❌ 创建虚拟钱包失败:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create virtual wallet',
            message: error.message
        });
    }
});

/**
 * 获取会员虚拟钱包信息
 * GET /api/virtual-wallet/:userId
 */
router.get('/:userId', [
    authenticateToken,
    param('userId').notEmpty().withMessage('用户ID不能为空')
], async (req, res) => {
    try {
        // 验证请求参数
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Invalid parameters',
                details: errors.array()
            });
        }

        const { userId } = req.params;

        console.log(`🔍 查询会员 ${userId} 的虚拟钱包信息`);

        // 获取虚拟账户信息
        const virtualAccount = await tatumVirtualAccountService.getMemberVirtualAccount(userId);

        if (!virtualAccount) {
            return res.status(404).json({
                success: false,
                error: 'Virtual wallet not found',
                message: `会员 ${userId} 的虚拟钱包不存在`
            });
        }

        // 获取账户余额
        let balance = null;
        try {
            balance = await tatumVirtualAccountService.getAccountBalance(virtualAccount.account_id);
        } catch (balanceError) {
            console.error('获取账户余额失败:', balanceError);
        }

        res.json({
            success: true,
            data: {
                userId: userId,
                accountId: virtualAccount.account_id,
                depositAddress: virtualAccount.deposit_address,
                currency: 'USDT_TRON',
                balance: balance ? {
                    available: balance.availableBalance,
                    total: balance.accountBalance
                } : null,
                created: virtualAccount.created_at,
                updated: virtualAccount.updated_at
            }
        });

    } catch (error) {
        console.error('❌ 获取虚拟钱包信息失败:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get virtual wallet info',
            message: error.message
        });
    }
});

/**
 * 获取会员虚拟钱包余额
 * GET /api/virtual-wallet/:userId/balance
 */
router.get('/:userId/balance', [
    authenticateToken,
    param('userId').notEmpty().withMessage('用户ID不能为空')
], async (req, res) => {
    try {
        // 验证请求参数
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Invalid parameters',
                details: errors.array()
            });
        }

        const { userId } = req.params;

        console.log(`💰 查询会员 ${userId} 的虚拟钱包余额`);

        // 获取虚拟账户信息
        const virtualAccount = await tatumVirtualAccountService.getMemberVirtualAccount(userId);

        if (!virtualAccount) {
            return res.status(404).json({
                success: false,
                error: 'Virtual wallet not found',
                message: `会员 ${userId} 的虚拟钱包不存在`
            });
        }

        // 获取账户余额
        const balance = await tatumVirtualAccountService.getAccountBalance(virtualAccount.account_id);

        res.json({
            success: true,
            data: {
                userId: userId,
                accountId: virtualAccount.account_id,
                currency: 'USDT_TRON',
                availableBalance: balance.availableBalance,
                accountBalance: balance.accountBalance,
                lastUpdated: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ 获取虚拟钱包余额失败:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get wallet balance',
            message: error.message
        });
    }
});

/**
 * 获取会员充值历史
 * GET /api/virtual-wallet/:userId/deposits
 */
router.get('/:userId/deposits', [
    authenticateToken,
    param('userId').notEmpty().withMessage('用户ID不能为空'),
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间')
], async (req, res) => {
    try {
        // 验证请求参数
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Invalid parameters',
                details: errors.array()
            });
        }

        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        console.log(`📋 查询会员 ${userId} 的充值历史 (页码: ${page}, 数量: ${limit})`);

        // 查询充值历史
        const { pool } = require('../config/database');
        const query = `
            SELECT 
                id,
                account_id,
                amount,
                tx_hash,
                block_number,
                from_address,
                status,
                created_at
            FROM member_deposits 
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [deposits] = await pool.execute(query, [userId, limit, offset]);

        // 查询总数
        const countQuery = 'SELECT COUNT(*) as total FROM member_deposits WHERE user_id = ?';
        const [countResult] = await pool.execute(countQuery, [userId]);
        const total = countResult[0].total;

        res.json({
            success: true,
            data: {
                deposits: deposits.map(deposit => ({
                    id: deposit.id,
                    accountId: deposit.account_id,
                    amount: parseFloat(deposit.amount),
                    txHash: deposit.tx_hash,
                    blockNumber: deposit.block_number,
                    fromAddress: deposit.from_address,
                    status: deposit.status,
                    createdAt: deposit.created_at
                })),
                pagination: {
                    page: page,
                    limit: limit,
                    total: total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('❌ 获取充值历史失败:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get deposit history',
            message: error.message
        });
    }
});

/**
 * 手动归集指定会员的资金
 * POST /api/virtual-wallet/:userId/consolidate
 */
router.post('/:userId/consolidate', [
    authenticateToken,
    param('userId').notEmpty().withMessage('用户ID不能为空')
], async (req, res) => {
    try {
        // 验证请求参数
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Invalid parameters',
                details: errors.array()
            });
        }

        const { userId } = req.params;

        console.log(`🔄 手动归集会员 ${userId} 的资金`);

        // 获取虚拟账户信息
        const virtualAccount = await tatumVirtualAccountService.getMemberVirtualAccount(userId);

        if (!virtualAccount) {
            return res.status(404).json({
                success: false,
                error: 'Virtual wallet not found',
                message: `会员 ${userId} 的虚拟钱包不存在`
            });
        }

        // 执行资金归集
        const result = await tatumVirtualAccountService.consolidateFunds(virtualAccount.account_id);

        if (result.success) {
            res.json({
                success: true,
                message: 'Fund consolidation completed successfully',
                data: {
                    userId: userId,
                    accountId: virtualAccount.account_id,
                    amount: result.amount,
                    transactionId: result.transactionId,
                    timestamp: result.timestamp
                }
            });
        } else {
            res.json({
                success: false,
                message: result.reason || 'Fund consolidation failed',
                data: {
                    userId: userId,
                    accountId: virtualAccount.account_id
                }
            });
        }

    } catch (error) {
        console.error('❌ 手动归集资金失败:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to consolidate funds',
            message: error.message
        });
    }
});

/**
 * 批量归集所有会员资金
 * POST /api/virtual-wallet/consolidate-all
 */
router.post('/consolidate-all', [
    authenticateToken
], async (req, res) => {
    try {
        console.log('🔄 开始批量归集所有会员资金');

        // 执行批量归集
        const results = await tatumVirtualAccountService.batchConsolidateAllFunds();

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        res.json({
            success: true,
            message: `Batch consolidation completed. Success: ${successCount}, Failed: ${failCount}`,
            data: {
                total: results.length,
                success: successCount,
                failed: failCount,
                results: results
            }
        });

    } catch (error) {
        console.error('❌ 批量归集资金失败:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to batch consolidate funds',
            message: error.message
        });
    }
});

/**
 * 获取所有虚拟钱包列表
 * GET /api/virtual-wallet/list
 */
router.get('/list', [
    authenticateToken,
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间')
], async (req, res) => {
    try {
        // 验证请求参数
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Invalid parameters',
                details: errors.array()
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        console.log(`📋 查询虚拟钱包列表 (页码: ${page}, 数量: ${limit})`);

        // 查询虚拟钱包列表
        const { pool } = require('../config/database');
        const query = `
            SELECT 
                user_id,
                account_id,
                deposit_address,
                created_at,
                updated_at
            FROM member_virtual_accounts 
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [wallets] = await pool.execute(query, [limit, offset]);

        // 查询总数
        const countQuery = 'SELECT COUNT(*) as total FROM member_virtual_accounts';
        const [countResult] = await pool.execute(countQuery);
        const total = countResult[0].total;

        res.json({
            success: true,
            data: {
                wallets: wallets,
                pagination: {
                    page: page,
                    limit: limit,
                    total: total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('❌ 获取虚拟钱包列表失败:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get wallet list',
            message: error.message
        });
    }
});

module.exports = router;