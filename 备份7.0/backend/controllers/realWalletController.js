const realTatumWalletService = require('../services/realTatumWalletService');
const logger = require('../utils/logger');

/**
 * 真正的钱包控制器
 * 提供基于 Tatum API 的钱包功能接口
 */
class RealWalletController {
    
    /**
     * 获取用户充值地址
     * @param {Object} req - 请求对象
     * @param {Object} res - 响应对象
     */
    async getDepositAddress(req, res) {
        try {
            const userId = req.user.id;
            
            // 为用户生成或获取充值地址
            const depositAddress = await realTatumWalletService.createDepositAddress(userId);
            
            res.json({
                success: true,
                data: {
                    userId,
                    depositAddress,
                    contractAddress: process.env.USDT_CONTRACT_ADDRESS,
                    network: 'TRON',
                    currency: 'USDT'
                },
                message: '充值地址获取成功'
            });
            
        } catch (error) {
            logger.error('获取充值地址失败', { 
                userId: req.user?.id, 
                error: error.message 
            });
            
            res.status(500).json({
                success: false,
                message: '获取充值地址失败',
                error: error.message
            });
        }
    }

    /**
     * 获取用户余额
     * @param {Object} req - 请求对象
     * @param {Object} res - 响应对象
     */
    async getBalance(req, res) {
        try {
            const userId = req.user.id;
            
            // 获取用户余额
            const balance = await realTatumWalletService.getUserBalance(userId);
            
            res.json({
                success: true,
                data: {
                    userId,
                    balance: parseFloat(balance).toFixed(2),
                    currency: 'USDT'
                },
                message: '余额查询成功'
            });
            
        } catch (error) {
            logger.error('获取用户余额失败', { 
                userId: req.user?.id, 
                error: error.message 
            });
            
            res.status(500).json({
                success: false,
                message: '余额查询失败',
                error: error.message
            });
        }
    }

    /**
     * 获取地址交易记录
     * @param {Object} req - 请求对象
     * @param {Object} res - 响应对象
     */
    async getAddressTransactions(req, res) {
        try {
            const userId = req.user.id;
            
            // 获取用户充值地址
            const depositAddress = await realTatumWalletService.getUserDepositAddress(userId);
            
            if (!depositAddress) {
                return res.status(404).json({
                    success: false,
                    message: '用户暂无充值地址'
                });
            }

            // 获取地址交易记录
            const transactionResult = await realTatumWalletService.getAddressTransactions(depositAddress);
            const transactions = transactionResult.transactions || [];
            
            res.json({
                success: true,
                data: {
                    address: depositAddress,
                    transactions: transactions.slice(0, 20), // 只返回最近20条
                    hasMore: transactionResult.hasMore || false,
                    next: transactionResult.next || null
                },
                message: '交易记录获取成功'
            });
            
        } catch (error) {
            logger.error('获取交易记录失败', { 
                userId: req.user?.id, 
                error: error.message 
            });
            
            res.status(500).json({
                success: false,
                message: '获取交易记录失败',
                error: error.message
            });
        }
    }

    /**
     * 计算提现手续费
     * @param {Object} req - 请求对象
     * @param {Object} res - 响应对象
     */
    async calculateWithdrawalFee(req, res) {
        try {
            const { amount } = req.body;
            
            if (!amount || amount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: '请输入有效的提现金额'
                });
            }

            // 计算手续费
            const feeInfo = realTatumWalletService.calculateWithdrawalFee(parseFloat(amount));
            
            res.json({
                success: true,
                data: {
                    originalAmount: parseFloat(amount),
                    fixedFee: feeInfo.fixedFee,
                    percentageFee: feeInfo.percentageFee,
                    totalFee: feeInfo.totalFee,
                    actualAmount: feeInfo.actualAmount,
                    currency: 'USDT'
                },
                message: '手续费计算成功'
            });
            
        } catch (error) {
            logger.error('计算提现手续费失败', { 
                amount: req.body?.amount, 
                error: error.message 
            });
            
            res.status(500).json({
                success: false,
                message: '手续费计算失败',
                error: error.message
            });
        }
    }

    /**
     * 处理提现请求
     * @param {Object} req - 请求对象
     * @param {Object} res - 响应对象
     */
    async processWithdrawal(req, res) {
        try {
            const userId = req.user.id;
            const { toAddress, amount } = req.body;
            
            // 验证参数
            if (!toAddress || !amount) {
                return res.status(400).json({
                    success: false,
                    message: '请提供提现地址和金额'
                });
            }

            if (amount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: '提现金额必须大于0'
                });
            }

            // 验证地址格式（简单验证）
            if (!toAddress.startsWith('T') || toAddress.length !== 34) {
                return res.status(400).json({
                    success: false,
                    message: '无效的TRON地址格式'
                });
            }

            // 处理提现
            const txHash = await realTatumWalletService.processWithdrawal(
                userId, 
                toAddress, 
                parseFloat(amount)
            );
            
            res.json({
                success: true,
                data: {
                    userId,
                    toAddress,
                    amount: parseFloat(amount),
                    txHash,
                    status: 'completed'
                },
                message: '提现处理成功'
            });
            
        } catch (error) {
            logger.error('处理提现失败', { 
                userId: req.user?.id, 
                toAddress: req.body?.toAddress,
                amount: req.body?.amount,
                error: error.message 
            });
            
            res.status(500).json({
                success: false,
                message: '提现处理失败',
                error: error.message
            });
        }
    }

    /**
     * 资金归集（管理员功能）
     * @param {Object} req - 请求对象
     * @param {Object} res - 响应对象
     */
    async consolidateFunds(req, res) {
        try {
            // 检查管理员权限（这里简化处理，实际应该有完整的权限验证）
            if (!req.user.isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: '权限不足'
                });
            }

            const { userId } = req.body; // 可选，指定用户ID
            
            // 执行资金归集
            const results = await realTatumWalletService.consolidateFunds(userId);
            
            const summary = {
                totalWallets: results.length,
                successCount: results.filter(r => r.status === 'success').length,
                failedCount: results.filter(r => r.status === 'failed').length,
                skippedCount: results.filter(r => r.status === 'skipped').length,
                totalAmount: results
                    .filter(r => r.status === 'success')
                    .reduce((sum, r) => sum + r.amount, 0)
            };
            
            res.json({
                success: true,
                data: {
                    summary,
                    details: results
                },
                message: '资金归集完成'
            });
            
        } catch (error) {
            logger.error('资金归集失败', { 
                userId: req.body?.userId,
                error: error.message 
            });
            
            res.status(500).json({
                success: false,
                message: '资金归集失败',
                error: error.message
            });
        }
    }

    /**
     * 手动检测充值（管理员功能）
     * @param {Object} req - 请求对象
     * @param {Object} res - 响应对象
     */
    async detectDeposits(req, res) {
        try {
            // 检查管理员权限
            if (!req.user.isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: '权限不足'
                });
            }

            const { address } = req.body;
            
            if (!address) {
                return res.status(400).json({
                    success: false,
                    message: '请提供要检测的地址'
                });
            }

            // 获取地址交易
            const transactionResult = await realTatumWalletService.getAddressTransactions(address);
            const transactions = transactionResult.transactions || [];
            
            // 处理新的充值交易
            const processedTransactions = [];
            
            for (const tx of transactions) {
                try {
                    // 检查是否为USDT转入交易
                    if (tx.transactionType === 'incoming' && 
                        tx.tokenAddress === process.env.USDT_CONTRACT_ADDRESS) {
                        
                        await realTatumWalletService.processDeposit(
                            address,
                            tx.hash,
                            parseFloat(tx.amount),
                            tx.blockNumber
                        );
                        
                        processedTransactions.push({
                            txHash: tx.hash,
                            amount: tx.amount,
                            status: 'processed'
                        });
                    }
                } catch (error) {
                    processedTransactions.push({
                        txHash: tx.hash,
                        amount: tx.amount,
                        status: 'failed',
                        error: error.message
                    });
                }
            }
            
            res.json({
                success: true,
                data: {
                    address,
                    totalTransactions: transactions.length,
                    processedTransactions,
                    hasMore: transactionResult.hasMore || false,
                    next: transactionResult.next || null
                },
                message: '充值检测完成'
            });
            
        } catch (error) {
            logger.error('检测充值失败', { 
                address: req.body?.address,
                error: error.message 
            });
            
            res.status(500).json({
                success: false,
                message: '检测充值失败',
                error: error.message
            });
        }
    }

    /**
     * 获取钱包状态信息
     * @param {Object} req - 请求对象
     * @param {Object} res - 响应对象
     */
    async getWalletStatus(req, res) {
        try {
            const userId = req.user.id;
            
            // 获取用户基本信息
            const balance = await realTatumWalletService.getUserBalance(userId);
            const depositAddress = await realTatumWalletService.getUserDepositAddress(userId);
            
            res.json({
                success: true,
                data: {
                    userId,
                    balance: parseFloat(balance).toFixed(2),
                    depositAddress,
                    hasDepositAddress: !!depositAddress,
                    network: 'TRON',
                    currency: 'USDT',
                    contractAddress: process.env.USDT_CONTRACT_ADDRESS
                },
                message: '钱包状态获取成功'
            });
            
        } catch (error) {
            logger.error('获取钱包状态失败', { 
                userId: req.user?.id, 
                error: error.message 
            });
            
            res.status(500).json({
                success: false,
                message: '获取钱包状态失败',
                error: error.message
            });
        }
    }
}

module.exports = new RealWalletController();