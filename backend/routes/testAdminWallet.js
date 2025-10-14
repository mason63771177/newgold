const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

/**
 * 测试管理员钱包API路由
 * 使用简化的认证逻辑
 */

// 简化的管理员认证中间件
const testAdminAuth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: '访问被拒绝，需要管理员权限' 
            });
        }

        // 验证token - 使用与测试登录路由相同的密钥
        const decoded = jwt.verify(token, 'test-secret-key');
        
        // 检查是否为管理员
        if (!decoded.isAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: '权限不足，需要管理员权限' 
            });
        }

        req.admin = decoded;
        next();
    } catch (error) {
        console.error('管理员认证错误:', error);
        res.status(401).json({ 
            success: false, 
            message: 'Token无效或已过期' 
        });
    }
};

/**
 * 获取钱包列表
 */
router.get('/wallets', testAdminAuth, async (req, res) => {
    try {
        const { pool } = require('../config/database');
        
        // 查询用户钱包信息
        const query = `
            SELECT 
                id,
                email,
                balance,
                frozen_balance,
                total_earnings,
                team_count,
                status,
                deposit_address,
                created_at,
                updated_at
            FROM users 
            ORDER BY created_at DESC 
            LIMIT 50
        `;
        
        const [rows] = await pool.execute(query);
        
        res.json({
            success: true,
            message: '获取钱包列表成功',
            data: {
                wallets: rows,
                total: rows.length
            }
        });
        
    } catch (error) {
        console.error('获取钱包列表错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

module.exports = router;