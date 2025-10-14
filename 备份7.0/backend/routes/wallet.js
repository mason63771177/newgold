const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');
const tatumWalletService = require('../services/tatumWalletService');
const walletAddressService = require('../services/userWalletAddressService');
const UserWalletAddress = require('../models/UserWalletAddress');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const db = require('../config/database');
const fundConsolidationService = require('../services/fundConsolidationService');

const router = express.Router();

/**
 * 管理员权限验证中间件
 */
const requireAdmin = (req, res, next) => {
    console.log('requireAdmin middleware - user:', req.user);
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: '权限不足'
        });
    }
    next();
};

// 钱包操作限流配置
const walletRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 10, // 每15分钟最多10次操作
    message: { error: '钱包操作过于频繁，请稍后再试' },
    standardHeaders: true,
    legacyHeaders: false,
});

// 提现操作更严格的限流
const withdrawalRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1小时
    max: 3, // 每小时最多3次提现
    message: { error: '提现操作过于频繁，请稍后再试' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * 获取用户钱包信息
 * GET /api/wallet/info
 */
router.get('/info', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 获取用户钱包地址
        const walletQuery = `
            SELECT wallet_address, derivation_index, created_at 
            FROM user_wallets 
            WHERE user_id = ?
        `;
        const [walletRows] = await db.execute(walletQuery, [userId]);
        
        // 获取用户余额
        const balanceQuery = 'SELECT balance, frozen_balance FROM users WHERE id = ?';
        const [balanceRows] = await db.execute(balanceQuery, [userId]);
        
        const walletInfo = {
            userId,
            walletAddress: walletRows.length > 0 ? walletRows[0].wallet_address : null,
            balance: balanceRows.length > 0 ? parseFloat(balanceRows[0].balance || '0') : 0,
            frozenBalance: balanceRows.length > 0 ? parseFloat(balanceRows[0].frozen_balance || '0') : 0,
            availableBalance: balanceRows.length > 0 ? 
                parseFloat(balanceRows[0].balance || '0') - parseFloat(balanceRows[0].frozen_balance || '0') : 0,
            createdAt: walletRows.length > 0 ? walletRows[0].created_at : null
        };

        res.json({
            success: true,
            data: walletInfo
        });

    } catch (error) {
        logger.error('❌ 获取钱包信息失败:', error);
        res.status(500).json({
            success: false,
            error: '获取钱包信息失败'
        });
    }
});

/**
 * 获取钱包余额（前端兼容性路由）
 * GET /api/wallet/balance
 */
router.get('/balance', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const balance = await tatumWalletService.getUserBalance(userId);
        
        res.json({
            success: true,
            data: { balance }
        });

    } catch (error) {
        logger.error('❌ 获取余额失败:', error);
        res.status(500).json({
            success: false,
            error: '获取余额失败'
        });
    }
});

/**
 * 生成/获取充值地址
 * GET /api/wallet/deposit-address
 */
router.get('/deposit-address', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 检查是否已有钱包地址
        const existingWalletQuery = `
            SELECT wallet_address, derivation_index 
            FROM user_wallets 
            WHERE user_id = ?
        `;
        const [existingRows] = await db.execute(existingWalletQuery, [userId]);
        
        if (existingRows.length > 0) {
            return res.json({
                success: true,
                data: {
                    address: existingRows[0].wallet_address,
                    derivationIndex: existingRows[0].derivation_index,
                    isNew: false
                }
            });
        }

        // 生成新的派生索引
        const indexQuery = 'SELECT COALESCE(MAX(derivation_index), 0) + 1 as next_index FROM user_wallets';
        const [indexRows] = await db.execute(indexQuery);
        const derivationIndex = indexRows[0].next_index;

        // 生成新的充值地址
        const walletInfo = await tatumWalletService.createDepositAddress(userId, derivationIndex);

        res.json({
            success: true,
            data: {
                address: walletInfo.address,
                derivationIndex: walletInfo.derivationIndex,
                isNew: true
            }
        });

    } catch (error) {
        logger.error('❌ 生成充值地址失败:', error);
        res.status(500).json({
            success: false,
            error: '生成充值地址失败'
        });
    }
});

/**
 * USDT提现
 * POST /api/wallet/withdraw
 */
router.post('/withdraw',
    authenticateToken,
    withdrawalRateLimit,
    [
        body('toAddress').notEmpty().isLength({ min: 34, max: 34 }).withMessage('提现地址格式无效'),
        body('amount').isFloat({ min: 10 }).withMessage('提现金额必须大于等于10 USDT')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: '参数验证失败',
                    details: errors.array()
                });
            }

            const userId = req.user.id;
            const { toAddress, amount } = req.body;

            // 计算手续费
            const feeDetails = tatumWalletService.calculateWithdrawalFee(amount);
            
            if (feeDetails.netAmount <= 0) {
                return res.status(400).json({
                    success: false,
                    error: '提现金额不足以支付手续费'
                });
            }

            // 检查用户余额
            const userBalance = await tatumWalletService.getUserBalance(userId);
            if (userBalance < amount) {
                return res.status(400).json({
                    success: false,
                    error: '余额不足'
                });
            }

            // 执行提现
            const withdrawalResult = await tatumWalletService.processWithdrawal(userId, toAddress, amount);

            res.json({
                success: true,
                data: {
                    txHash: withdrawalResult.txHash,
                    originalAmount: withdrawalResult.originalAmount,
                    netAmount: withdrawalResult.netAmount,
                    totalFee: withdrawalResult.totalFee,
                    status: withdrawalResult.status,
                    feeBreakdown: {
                        fixedFee: feeDetails.fixedFee,
                        percentageFee: feeDetails.percentageFee
                    }
                }
            });

        } catch (error) {
            logger.error('❌ 提现申请失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '提现申请失败'
            });
        }
    }
);

/**
 * 获取交易历史
 * GET /api/wallet/transactions
 */
router.get('/transactions',
    authenticateToken,
    [
        query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
        query('type').optional().isIn(['deposit', 'withdrawal', 'all']).withMessage('类型参数无效')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: '参数验证失败',
                    details: errors.array()
                });
            }

            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const type = req.query.type || 'all';
            const offset = (page - 1) * limit;

            let transactions = [];

            if (type === 'deposit' || type === 'all') {
                const depositsQuery = `
                    SELECT 'deposit' as type, id, tx_hash, amount, 
                           from_address as address, status, created_at
                    FROM user_deposits 
                    WHERE user_id = ?
                    ORDER BY created_at DESC
                    LIMIT ? OFFSET ?
                `;
                const [deposits] = await db.execute(depositsQuery, [userId, limit, offset]);
                transactions = transactions.concat(deposits);
            }

            if (type === 'withdrawal' || type === 'all') {
                const withdrawalsQuery = `
                    SELECT 'withdrawal' as type, id, tx_hash, net_amount as amount,
                           to_address as address, status, created_at
                    FROM user_withdrawals 
                    WHERE user_id = ?
                    ORDER BY created_at DESC
                    LIMIT ? OFFSET ?
                `;
                const [withdrawals] = await db.execute(withdrawalsQuery, [userId, limit, offset]);
                transactions = transactions.concat(withdrawals);
            }

            // 按时间排序
            transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            res.json({
                success: true,
                data: {
                    transactions: transactions.map(tx => ({
                        ...tx,
                        amount: parseFloat(tx.amount)
                    })),
                    pagination: {
                        page,
                        limit,
                        total: transactions.length
                    }
                }
            });

        } catch (error) {
            logger.error('❌ 获取交易历史失败:', error);
            res.status(500).json({
                success: false,
                error: '获取交易历史失败'
            });
        }
    }
);

/**
 * 绑定提现地址（兼容性接口）
 * POST /api/wallet/bind-address
 */
router.post('/bind-address', authenticateToken, async (req, res) => {
    try {
        const { address, label } = req.body;
        
        // 这里可以实现地址绑定逻辑，暂时返回成功
        res.json({
            success: true,
            message: '地址绑定成功',
            data: { address, label }
        });

    } catch (error) {
        logger.error('❌ 绑定地址失败:', error);
        res.status(500).json({
            success: false,
            error: '绑定地址失败'
        });
    }
});

/**
 * 获取绑定的地址列表（兼容性接口）
 * GET /api/wallet/addresses
 */
router.get('/addresses', authenticateToken, async (req, res) => {
    try {
        // 暂时返回空列表
        res.json({
            success: true,
            data: { addresses: [] }
        });

    } catch (error) {
        logger.error('❌ 获取地址列表失败:', error);
        res.status(500).json({
            success: false,
            error: '获取地址列表失败'
        });
    }
});

/**
 * 兼容旧版本的提现接口
 * POST /api/wallet/withdraw-legacy
 */
router.post('/withdraw-legacy', authenticateToken, async (req, res) => {
    // 重定向到新的提现接口
    req.url = '/withdraw';
    router.handle(req, res);
});

/**
 * 兼容旧版本的交易历史接口
 * GET /api/wallet/transactions-legacy
 */
router.get('/transactions-legacy', authenticateToken, async (req, res) => {
    // 重定向到新的交易历史接口
    req.url = '/transactions';
    router.handle(req, res);
});

/**
 * 获取用户充值地址（新版本）
 * GET /api/wallet/deposit-address-v2
 */
router.get('/deposit-address-v2', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const currency = req.query.currency || 'USDT';

        // 先尝试获取现有地址
        let addressInfo = await walletAddressService.getUserDepositAddress(userId, currency);

        // 如果没有地址，则分配新地址
        if (!addressInfo) {
            addressInfo = await walletAddressService.assignAddressToUser(userId, currency);
        }

        res.json({
            success: true,
            data: {
                address: addressInfo.address,
                currency: currency,
                network: addressInfo.network,
                totalReceived: addressInfo.totalReceived || 0,
                lastDepositAt: addressInfo.lastDepositAt,
                createdAt: addressInfo.createdAt
            },
            message: '充值地址获取成功'
        });

    } catch (error) {
        logger.error('Error getting deposit address v2:', error);
        res.status(500).json({
            success: false,
            message: '获取充值地址失败',
            error: error.message
        });
    }
});

/**
 * 获取用户所有钱包地址
 * GET /api/wallet/user-addresses
 */
router.get('/user-addresses', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const addresses = await walletAddressService.getUserAllAddresses(userId);

        res.json({
            success: true,
            data: addresses,
            message: '地址列表获取成功'
        });

    } catch (error) {
        logger.error('Error getting user addresses:', error);
        res.status(500).json({
            success: false,
            message: '获取地址列表失败',
            error: error.message
        });
    }
});

/**
 * 查询地址详细信息
 * GET /api/wallet/address/:address/details
 */
router.get('/address/:address/details', authenticateToken, async (req, res) => {
    try {
        const { address } = req.params;
        const userId = req.user.id;

        // 验证地址格式
        if (!walletAddressService.isValidTronAddress(address)) {
            return res.status(400).json({
                success: false,
                message: '无效的TRON地址格式'
            });
        }

        // 获取地址信息
        const addressInfo = await UserWalletAddress.findByAddress(address);
        if (!addressInfo || addressInfo.userId !== userId) {
            return res.status(404).json({
                success: false,
                message: '地址不存在或不属于当前用户'
            });
        }

        res.json({
            success: true,
            data: {
                address: addressInfo.address,
                currency: addressInfo.currency,
                network: addressInfo.network,
                totalReceived: addressInfo.totalReceived,
                lastDepositAt: addressInfo.lastDepositAt,
                status: addressInfo.status,
                createdAt: addressInfo.createdAt
            },
            message: '地址信息获取成功'
        });

    } catch (error) {
        logger.error('Error getting address details:', error);
        res.status(500).json({
            success: false,
            message: '获取地址信息失败',
            error: error.message
        });
    }
});

/**
 * 获取用户钱包统计信息
 * GET /api/wallet/user-statistics
 */
router.get('/user-statistics', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 获取用户的地址统计
        const userAddresses = await walletAddressService.getUserAllAddresses(userId);
        const totalReceived = userAddresses.reduce((sum, addr) => sum + addr.totalReceived, 0);
        const activeAddresses = userAddresses.filter(addr => addr.status === 'active').length;

        res.json({
            success: true,
            data: {
                totalAddresses: userAddresses.length,
                activeAddresses: activeAddresses,
                totalReceived: totalReceived,
                lastDepositAt: userAddresses.length > 0 ? 
                    Math.max(...userAddresses.map(addr => new Date(addr.lastDepositAt || 0).getTime())) : null
            },
            message: '钱包统计信息获取成功'
        });

    } catch (error) {
        logger.error('Error getting user wallet statistics:', error);
        res.status(500).json({
            success: false,
            message: '获取钱包统计信息失败',
            error: error.message
        });
    }
});

// 管理员专用路由

/**
 * 获取系统钱包统计信息（管理员）
 * GET /api/wallet/admin/system-statistics
 */
router.get('/admin/system-statistics', authenticateToken, async (req, res) => {
    try {
        // TODO: 添加管理员权限验证
        const statistics = await UserWalletAddress.getStatistics('TRC20');

        res.json({
            success: true,
            data: statistics,
            message: '系统钱包统计信息获取成功'
        });

    } catch (error) {
        logger.error('Error getting admin statistics:', error);
        res.status(500).json({
            success: false,
            message: '获取系统统计信息失败',
            error: error.message
        });
    }
});

/**
 * 获取有余额的地址列表（管理员）
 * GET /api/wallet/admin/addresses-with-balance
 */
router.get('/admin/addresses-with-balance', authenticateToken, async (req, res) => {
    try {
        // TODO: 添加管理员权限验证
        const minAmount = parseFloat(req.query.minAmount) || 0.01;
        const addresses = await walletAddressService.getAddressesWithBalance(minAmount);

        res.json({
            success: true,
            data: addresses,
            message: '有余额地址列表获取成功'
        });

    } catch (error) {
        logger.error('Error getting addresses with balance:', error);
        res.status(500).json({
            success: false,
            message: '获取有余额地址列表失败',
            error: error.message
        });
    }
});

/**
 * 手动更新地址接收金额（管理员）
 * POST /api/wallet/admin/address/:address/update-received
 */
router.post('/admin/address/:address/update-received', 
    authenticateToken,
    [
        param('address').notEmpty().withMessage('地址不能为空'),
        body('amount').isFloat({ min: 0.000001 }).withMessage('金额必须大于0')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: '参数验证失败',
                    errors: errors.array()
                });
            }

            // TODO: 添加管理员权限验证
            const { address } = req.params;
            const { amount } = req.body;

            const result = await walletAddressService.updateAddressReceived(address, amount);

            if (result) {
                res.json({
                    success: true,
                    message: '地址接收金额更新成功'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: '地址不存在'
                });
            }

        } catch (error) {
            logger.error('Error updating address received:', error);
            res.status(500).json({
                success: false,
                message: '更新地址接收金额失败',
                error: error.message
            });
        }
    }
);

// 资金归集相关接口

/**
 * 执行资金归集
 * POST /api/wallet/admin/consolidate
 */
router.post('/admin/consolidate', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { 
            walletAddresses, 
            minBalance = 10, 
            forceConsolidation = false 
        } = req.body;

        // 初始化Tatum SDK
        await fundConsolidationService.initialize();

        // 执行资金归集
        const result = await fundConsolidationService.consolidateFunds(
            walletAddresses, 
            minBalance
        );

        res.json({
            success: true,
            message: '资金归集完成',
            data: result
        });

    } catch (error) {
        console.error('资金归集失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '资金归集失败'
        });
    }
});

/**
 * 获取归集历史记录
 * GET /api/wallet/admin/consolidation-history
 */
router.get('/admin/consolidation-history', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const history = await fundConsolidationService.getConsolidationHistory(
            parseInt(page), 
            parseInt(limit)
        );

        res.json({
            success: true,
            data: history
        });

    } catch (error) {
        console.error('获取归集历史失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取归集历史失败'
        });
    }
});

/**
 * 自动资金归集（定时任务接口）
 * POST /api/wallet/admin/auto-consolidate
 */
router.post('/admin/auto-consolidate', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // 初始化Tatum SDK
        await fundConsolidationService.initialize();

        // 执行自动归集
        const result = await fundConsolidationService.autoConsolidate();

        res.json({
            success: true,
            message: '自动归集完成',
            data: result
        });

    } catch (error) {
        console.error('自动归集失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '自动归集失败'
        });
    }
});

/**
 * 获取需要归集的钱包列表
 * GET /api/wallet/admin/consolidation-candidates
 */
router.get('/admin/consolidation-candidates', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { minBalance = 10 } = req.query;

        // 初始化Tatum SDK
        await fundConsolidationService.initialize();

        // 获取需要归集的钱包
        const candidates = await fundConsolidationService.getWalletsForConsolidation(
            parseFloat(minBalance)
        );

        res.json({
            success: true,
            data: {
                count: candidates.length,
                wallets: candidates
            }
        });

    } catch (error) {
        console.error('获取归集候选钱包失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取归集候选钱包失败'
        });
    }
}
);

/**
 * 手动检查地址的充值记录
 * GET /api/wallet/check-deposits/:address
 */
router.get('/check-deposits/:address', 
    authenticateToken,
    [
        param('address').notEmpty().withMessage('地址不能为空'),
        query('fromBlock').optional().isInt({ min: 0 }).withMessage('起始区块必须是非负整数'),
        query('toBlock').optional().isInt({ min: 0 }).withMessage('结束区块必须是非负整数')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: '参数验证失败',
                    errors: errors.array()
                });
            }

            const { address } = req.params;
            const { fromBlock, toBlock } = req.query;
            
            // 导入充值监听服务
            const depositMonitoringService = require('../services/depositMonitoringService');
            
            // 如果没有指定区块范围，使用最近100个区块
            let startBlock = fromBlock;
            let endBlock = toBlock;
            
            if (!startBlock || !endBlock) {
                const tatumRpcClient = require('../utils/tatumRpcClient');
                const latestBlock = await tatumRpcClient.getLatestBlockNumber();
                endBlock = endBlock || latestBlock;
                startBlock = startBlock || Math.max(0, endBlock - 100);
            }

            // 手动检查充值
            const deposits = await depositMonitoringService.manualCheckDeposits(
                address, 
                parseInt(startBlock), 
                parseInt(endBlock)
            );

            res.json({
                success: true,
                data: {
                    address,
                    blockRange: {
                        from: startBlock,
                        to: endBlock
                    },
                    deposits: deposits,
                    count: deposits.length
                }
            });

        } catch (error) {
            logger.error('检查充值失败', { 
                address: req.params.address,
                error: error.message 
            });
            res.status(500).json({
                success: false,
                message: '检查充值失败',
                error: error.message
            });
        }
    }
);

module.exports = router;