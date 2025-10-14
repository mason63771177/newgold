/**
 * 钱包相关API路由
 * 提供充值、提现、余额查询等功能
 */

const express = require('express');
const router = express.Router();
const TatumBasicWalletService = require('../services/tatumBasicWalletService');
const { authenticateToken } = require('../middleware/auth');
const { pool } = require('../config/database');

// 初始化钱包服务
const walletService = new TatumBasicWalletService();

// 初始化服务
walletService.initialize().catch(console.error);

/**
 * 获取用户钱包地址
 * GET /api/wallet/address
 */
router.get('/address', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const result = await walletService.createMemberWallet(userId);
        
        if (result.success) {
            res.json({
                success: true,
                data: {
                    address: result.address,
                    currency: result.currency,
                    userId: result.userId
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: '获取钱包地址失败',
                error: result.error
            });
        }
    } catch (error) {
        console.error('获取钱包地址错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

/**
 * 查询地址余额
 * GET /api/wallet/balance/:address
 */
router.get('/balance/:address', authenticateToken, async (req, res) => {
    try {
        const { address } = req.params;
        
        const balance = await walletService.getAddressBalance(address);
        
        res.json({
            success: true,
            data: {
                address: address,
                balances: {
                    trx: balance.trx,
                    usdt: balance.usdt
                }
            }
        });
    } catch (error) {
        console.error('查询余额错误:', error);
        res.status(500).json({
            success: false,
            message: '查询余额失败'
        });
    }
});

/**
 * 处理充值回调
 * POST /api/wallet/deposit/callback
 */
router.post('/deposit/callback', async (req, res) => {
    try {
        const { txHash, amount, fromAddress, toAddress, blockNumber } = req.body;
        
        // 验证回调数据
        if (!txHash || !amount || !toAddress) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数'
            });
        }

        // 根据充值地址查找用户
        const [addressRows] = await walletService.pool.execute(
            'SELECT user_id FROM tatum_deposit_addresses WHERE address = ? AND status = ?',
            [toAddress, 'active']
        );

        if (addressRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '充值地址不存在'
            });
        }

        const userId = addressRows[0].user_id;
        
        // 处理充值
        const result = await walletService.processDeposit(userId, txHash, parseFloat(amount), fromAddress);
        
        if (result.success) {
            res.json({
                success: true,
                message: '充值处理成功',
                data: {
                    userId: userId,
                    amount: result.amount,
                    txHash: txHash
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.reason || '充值处理失败'
            });
        }
    } catch (error) {
        console.error('充值回调错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

/**
 * 申请提现
 * POST /api/wallet/withdraw
 */
router.post('/withdraw', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { toAddress, amount } = req.body;
        
        // 验证参数
        if (!toAddress || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: '参数无效'
            });
        }

        // 验证地址格式（简单验证）
        if (!toAddress.startsWith('T') || toAddress.length !== 34) {
            return res.status(400).json({
                success: false,
                message: 'TRON地址格式无效'
            });
        }

        // 处理提现
        const result = await walletService.processWithdraw(userId, toAddress, parseFloat(amount));
        
        if (result.success) {
            res.json({
                success: true,
                message: '提现成功',
                data: {
                    txHash: result.txHash,
                    originalAmount: result.originalAmount,
                    actualAmount: result.amount,
                    fee: result.fee,
                    toAddress: toAddress
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.error || '提现失败'
            });
        }
    } catch (error) {
        console.error('提现错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

/**
 * 获取交易历史
 * GET /api/wallet/transactions
 */
router.get('/transactions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, type } = req.query;
        
        const offset = (page - 1) * limit;
        const limitNum = parseInt(limit);
        const offsetNum = parseInt(offset);
        
        // 使用字符串拼接而不是参数化查询来避免LIMIT/OFFSET的参数问题
        let query = `SELECT * FROM tatum_transactions WHERE user_id = '${userId}'`;
        
        if (type && ['deposit', 'withdraw'].includes(type)) {
            query += ` AND tx_type = '${type}'`;
        }
        
        query += ` ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
        
        console.log('执行查询:', query);
        
        const [rows] = await pool.execute(query);
        
        // 获取总数
        let countQuery = `SELECT COUNT(*) as total FROM tatum_transactions WHERE user_id = '${userId}'`;
        
        if (type && ['deposit', 'withdraw'].includes(type)) {
            countQuery += ` AND tx_type = '${type}'`;
        }
        
        const [countRows] = await pool.execute(countQuery);
        const total = countRows[0].total;
        
        console.log(`用户 ${userId} 的交易历史查询成功，共 ${total} 条记录`);
        
        res.json({
            success: true,
            data: {
                transactions: rows,
                pagination: {
                    page: parseInt(page),
                    limit: limitNum,
                    total: total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });
    } catch (error) {
        console.error('获取交易历史错误:', error);
        res.status(500).json({
            success: false,
            message: '获取交易历史失败',
            error: error.message
        });
    }
});

/**
 * 资金归集（管理员功能）
 * POST /api/wallet/consolidate
 */
router.post('/consolidate', authenticateToken, async (req, res) => {
    try {
        // 这里应该添加管理员权限验证
        // if (req.user.role !== 'admin') {
        //     return res.status(403).json({
        //         success: false,
        //         message: '权限不足'
        //     });
        // }
        
        const result = await walletService.consolidateFunds();
        
        if (result.success) {
            res.json({
                success: true,
                message: '资金归集成功',
                data: {
                    totalConsolidated: result.totalConsolidated,
                    results: result.results
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: result.error || '资金归集失败'
            });
        }
    } catch (error) {
        console.error('资金归集错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

/**
 * 获取主钱包信息（管理员功能）
 * GET /api/wallet/master
 */
router.get('/master', authenticateToken, async (req, res) => {
    try {
        // 这里应该添加管理员权限验证
        // if (req.user.role !== 'admin') {
        //     return res.status(403).json({
        //         success: false,
        //         message: '权限不足'
        //     });
        // }
        
        const masterWallet = await walletService.getMasterWallet();
        
        if (masterWallet) {
            // 不返回敏感信息
            const safeWalletInfo = {
                address: masterWallet.address,
                currency: masterWallet.currency,
                status: masterWallet.status,
                created_at: masterWallet.created_at
            };
            
            // 获取主钱包余额
            const balance = await walletService.getAddressBalance(masterWallet.address);
            
            res.json({
                success: true,
                data: {
                    wallet: safeWalletInfo,
                    balance: balance
                }
            });
        } else {
            res.status(404).json({
                success: false,
                message: '主钱包不存在'
            });
        }
    } catch (error) {
        console.error('获取主钱包信息错误:', error);
        res.status(500).json({
            success: false,
            message: '获取主钱包信息失败'
        });
    }
});

module.exports = router;