const express = require('express');
const router = express.Router();
const realWalletController = require('../controllers/realWalletController');
const { authenticateToken } = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

/**
 * 真正的钱包路由
 * 基于 Tatum API 的完整钱包功能
 */

// 用户钱包功能路由
router.use(authenticateToken); // 所有路由都需要认证

/**
 * 获取用户充值地址
 * GET /api/real-wallet/deposit-address
 */
router.get('/deposit-address', realWalletController.getDepositAddress);

/**
 * 获取用户余额
 * GET /api/real-wallet/balance
 */
router.get('/balance', realWalletController.getBalance);

/**
 * 获取地址交易记录
 * GET /api/real-wallet/transactions
 */
router.get('/transactions', realWalletController.getAddressTransactions);

/**
 * 计算提现手续费
 * POST /api/real-wallet/calculate-fee
 * Body: { amount: number }
 */
router.post('/calculate-fee', realWalletController.calculateWithdrawalFee);

/**
 * 处理提现请求
 * POST /api/real-wallet/withdraw
 * Body: { toAddress: string, amount: number }
 */
router.post('/withdraw', realWalletController.processWithdrawal);

/**
 * 获取钱包状态信息
 * GET /api/real-wallet/status
 */
router.get('/status', realWalletController.getWalletStatus);

// 管理员功能路由
router.use(adminMiddleware); // 以下路由需要管理员权限

/**
 * 资金归集（管理员功能）
 * POST /api/real-wallet/consolidate
 * Body: { userId?: number } (可选，指定用户)
 */
router.post('/consolidate', realWalletController.consolidateFunds);

/**
 * 手动检测充值（管理员功能）
 * POST /api/real-wallet/detect-deposits
 * Body: { address: string }
 */
router.post('/detect-deposits', realWalletController.detectDeposits);

module.exports = router;