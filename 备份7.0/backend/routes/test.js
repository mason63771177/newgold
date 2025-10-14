const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const crypto = require('crypto');
const emailService = require('../services/EmailService');

/**
 * 获取用户的验证令牌（测试用）
 * POST /api/test/get-verification-token
 */
router.post('/get-verification-token', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: '邮箱地址是必需的'
            });
        }

        // 查找用户的验证令牌
        const query = 'SELECT verification_token FROM users WHERE email = ?';
        const [rows] = await pool.execute(query, [email]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        const verificationToken = rows[0].verification_token;

        res.json({
            success: true,
            message: '获取验证令牌成功',
            data: {
                email: email,
                verificationToken: verificationToken
            }
        });

    } catch (error) {
        console.error('获取验证令牌失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

/**
 * 测试API路由
 * 仅用于自动化测试，生产环境应禁用
 */

/**
 * 获取邮件服务状态
 * GET /api/test/email-status
 */
router.get('/email-status', async (req, res) => {
    try {
        const status = emailService.getStatus();
        const connectionTest = await emailService.verifyConnection();
        
        res.json({
            success: true,
            data: {
                ...status,
                connectionValid: connectionTest,
                testAccount: emailService.testAccount ? {
                    user: emailService.testAccount.user,
                    previewUrl: 'https://ethereal.email/login'
                } : null
            }
        });
    } catch (error) {
        console.error('获取邮件服务状态失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * 测试发送邮件
 * POST /api/test/send-email
 */
router.post('/send-email', async (req, res) => {
    try {
        const { email, type = 'verification' } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: '邮箱地址不能为空'
            });
        }
        
        let result;
        if (type === 'verification') {
            const token = emailService.generateVerificationToken();
            result = await emailService.sendVerificationEmail(email, token, 'Test User');
        } else {
            return res.status(400).json({
                success: false,
                message: '不支持的邮件类型'
            });
        }
        
        res.json({
            success: result.success,
            message: result.message,
            data: {
                messageId: result.messageId,
                previewUrl: result.previewUrl
            }
        });
        
    } catch (error) {
        console.error('发送测试邮件失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * 获取测试API状态
 * GET /api/test/status
 */
router.get('/status', (req, res) => {
    res.json({
        success: true,
        message: '测试API正常工作',
        timestamp: new Date().toISOString()
    });
});

/**
 * 模拟邮箱验证
 * POST /api/test/verify-email
 */
router.post('/verify-email', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: '邮箱地址不能为空'
            });
        }
        
        // 更新用户邮箱验证状态
        const updateQuery = `
            UPDATE users 
            SET email_verified = 1 
            WHERE email = ?
        `;
        
        const [result] = await pool.execute(updateQuery, [email]);
        
        if (result.affectedRows > 0) {
            res.json({
                success: true,
                message: '邮箱验证成功',
                data: { email }
            });
        } else {
            res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
    } catch (error) {
        console.error('邮箱验证失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * 模拟区块链入金
 * POST /api/test/simulate-deposit
 */
router.post('/simulate-deposit', async (req, res) => {
    try {
        const { email, amount, currency = 'USDT' } = req.body;
        
        if (!email || !amount) {
            return res.status(400).json({
                success: false,
                message: '邮箱和金额不能为空'
            });
        }
        
        // 查找该邮箱对应的用户
        const userQuery = `
            SELECT id, email 
            FROM users 
            WHERE email = ?
        `;
        
        const [userRows] = await pool.execute(userQuery, [email]);
        
        if (userRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        const userId = userRows[0].id;
        const userEmail = userRows[0].email;
        
        // 生成模拟交易哈希
        const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
        
        // 获取连接并开始事务
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        
        try {
            // 1. 记录充值交易
            const insertTransactionQuery = `
                INSERT INTO wallet_transactions (
                    user_id, type, amount, balance_before, balance_after, 
                    status, transaction_hash, description, 
                    created_at, updated_at
                ) VALUES (?, 'activation', ?, 
                    (SELECT balance FROM users WHERE id = ?),
                    (SELECT balance + ? FROM users WHERE id = ?),
                    'completed', ?, ?, NOW(), NOW())
            `;
            
            await connection.execute(insertTransactionQuery, [
                userId, amount, userId, amount, userId, txHash, `模拟充值 ${amount} ${currency}`
            ]);
            
            // 2. 更新用户余额
            const updateBalanceQuery = `
                UPDATE users 
                SET balance = balance + ?, 
                    total_earnings = total_earnings + ?,
                    updated_at = NOW()
                WHERE id = ?
            `;
            
            await connection.execute(updateBalanceQuery, [amount, amount, userId]);
            
            await connection.commit();
            connection.release();
            
            res.json({
                success: true,
                message: '模拟充值成功',
                data: {
                    userId,
                    email: userEmail,
                    amount,
                    currency,
                    txHash
                }
            });
            
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
        
    } catch (error) {
        console.error('模拟充值失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * 获取测试用户信息
 * GET /api/test/user/:email
 */
router.get('/user/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        const userQuery = `
            SELECT u.id, u.email, u.email_verified, u.status, 
                   u.balance, u.frozen_balance, u.total_earnings, u.team_count, 
                   u.activation_count, u.last_activation_time, u.countdown_end_time,
                   u.created_at, u.updated_at
            FROM users u
            WHERE u.email = ?
        `;
        
        const [rows] = await pool.execute(userQuery, [email]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        res.json({
            success: true,
            data: rows[0]
        });
        
    } catch (error) {
        console.error('获取用户信息失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * 重置测试数据
 * POST /api/test/reset
 */
router.post('/reset', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: '邮箱地址不能为空'
            });
        }
        
        // 查找用户ID
        const userQuery = 'SELECT id FROM users WHERE email = ?';
        const [userRows] = await pool.execute(userQuery, [email]);
        
        if (userRows.length === 0) {
            return res.json({
                success: true,
                message: '用户不存在，无需重置'
            });
        }
        
        const userId = userRows[0].id;
        
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        
        try {
            // 删除相关数据
            await connection.execute('DELETE FROM wallet_transactions WHERE user_id = ?', [userId]);
            await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
            
            await connection.commit();
            connection.release();
            
            res.json({
                success: true,
                message: '测试数据重置成功'
            });
            
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
        
    } catch (error) {
        console.error('重置测试数据失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

module.exports = router;