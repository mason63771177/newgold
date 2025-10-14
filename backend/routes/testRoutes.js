const express = require('express');
const router = express.Router();
const Container = require('typedi').Container;
const ActivationController = require('../controllers/activationController');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const PendingTransaction = require('../models/PendingTransaction');

/**
 * 测试路由 - 仅在测试环境使用
 * 提供测试所需的辅助API端点
 */

/**
 * 获取用户的邮箱验证token
 * GET /api/test/get-verification-token/:email
 */
router.get('/get-verification-token/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                success: false,
                message: '此API仅在测试环境可用'
            });
        }

        const user = await User.findByEmail(email);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 获取最新的验证token
        const verificationToken = user.verification_token;
        
        if (!verificationToken) {
            return res.status(404).json({
                success: false,
                message: '验证token不存在'
            });
        }

        res.json({
            success: true,
            token: verificationToken,
            email: email
        });

    } catch (error) {
        console.error('获取验证token失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * 模拟入金到账
 * POST /api/test/simulate-deposit
 */
router.post('/simulate-deposit', async (req, res) => {
    try {
        const { walletAddress, amount, orderId } = req.body;
        
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                success: false,
                message: '此API仅在测试环境可用'
            });
        }

        if (!walletAddress || !amount || !orderId) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数'
            });
        }

        // 查找对应的待确认交易
        console.log('查询MySQL数据库中的待确认交易');
        console.log('查询参数:', { orderId, walletAddress });
        
        // 使用PendingTransaction模型查询MySQL数据库
        const pendingTransactions = await PendingTransaction.findPending();
        console.log('所有待确认交易数量:', pendingTransactions.length);
        
        // 打印所有交易的详细信息
        pendingTransactions.forEach((t, index) => {
            console.log(`交易${index + 1}:`, {
                orderId: t.orderId,
                walletAddress: t.walletAddress,
                status: t.status,
                isExpired: t.isExpired(),
                expiresAt: t.expiresAt
            });
        });
        
        const transaction = pendingTransactions.find(t => {
            const orderIdMatch = t.orderId === orderId;
            const walletMatch = t.walletAddress === walletAddress;
            const statusMatch = (t.status === 'pending' || t.status === 'confirming');
            const notExpired = !t.isExpired();
            
            console.log('匹配检查:', {
                orderId: t.orderId,
                orderIdMatch,
                walletMatch,
                statusMatch,
                notExpired,
                allMatch: orderIdMatch && walletMatch && statusMatch && notExpired
            });
            
            return orderIdMatch && walletMatch && statusMatch && notExpired;
        });
        
        console.log('MySQL查询结果:', transaction);
        
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: '未找到对应的激活订单'
            });
        }

        // 模拟交易哈希
        const mockTxHash = `0x${Date.now().toString(16)}${Math.random().toString(16).substr(2, 8)}`;

        // 调用激活控制器的确认激活方法
        const mockReq = {
            body: {
                orderId: orderId,
                txHash: mockTxHash
            }
        };

        let result;
        const mockRes = {
            json: (data) => {
                result = data;
                return data;
            },
            status: (code) => ({ 
                json: (data) => {
                    result = { ...data, statusCode: code };
                    return result;
                }
            })
        };

        await ActivationController.confirmActivation(mockReq, mockRes);

        res.json({
            success: true,
            message: '模拟入金成功',
            data: {
                orderId: orderId,
                walletAddress: walletAddress,
                amount: amount,
                txHash: mockTxHash,
                result: result
            }
        });

    } catch (error) {
        console.error('模拟入金失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: error.message
        });
    }
});

/**
 * 获取用户激活状态
 * GET /api/test/get-user-status/:email
 */
router.get('/get-user-status/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                success: false,
                message: '此API仅在测试环境可用'
            });
        }

        const user = await User.findByEmail(email);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        res.json({
            success: true,
            data: {
                userId: user.id,
                email: user.email,
                username: user.username,
                status: user.status,
                isVerified: user.is_verified,
                createdAt: user.created_at
            }
        });

    } catch (error) {
        console.error('获取用户状态失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * 重置测试用户数据
 * DELETE /api/test/reset-user/:email
 */
router.delete('/reset-user/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                success: false,
                message: '此API仅在测试环境可用'
            });
        }

        // 删除用户及相关数据
        const user = await User.findByEmail(email);
        if (user) {
            // 删除相关交易记录
            await Transaction.deleteByUserId(user.id);
            // 删除待确认交易
            await PendingTransaction.deleteByUserId(user.id);
            // 删除用户
            await User.deleteById(user.id);
        }
        
        res.json({
            success: true,
            message: '测试用户数据已重置',
            deleted: user ? true : false
        });

    } catch (error) {
        console.error('重置用户数据失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

module.exports = router;