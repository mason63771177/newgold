const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

/**
 * 测试数据库连接的独立路由
 * 不使用任何中间件或复杂逻辑
 */
router.get('/db', async (req, res) => {
    try {
        console.log('开始测试数据库连接...');
        
        // 获取连接
        const connection = await pool.getConnection();
        console.log('成功获取数据库连接');
        
        // 执行最简单的查询
        const [result] = await connection.query('SELECT 1 as test');
        console.log('查询结果:', result);
        
        // 释放连接
        connection.release();
        console.log('连接已释放');
        
        res.json({
            success: true,
            message: '数据库连接测试成功',
            data: result
        });
        
    } catch (error) {
        console.error('数据库测试错误:', error);
        res.status(500).json({
            success: false,
            message: '数据库连接测试失败',
            error: error.message
        });
    }
});

/**
 * 测试用户表查询
 */
router.get('/users', async (req, res) => {
    try {
        console.log('开始测试用户表查询...');
        
        // 获取连接
        const connection = await pool.getConnection();
        console.log('成功获取数据库连接');
        
        // 执行用户表查询
        const [users] = await connection.query('SELECT id, email, status FROM users LIMIT 3');
        console.log('用户查询结果:', users);
        
        // 释放连接
        connection.release();
        console.log('连接已释放');
        
        res.json({
            success: true,
            message: '用户表查询测试成功',
            data: users
        });
        
    } catch (error) {
        console.error('用户表查询测试错误:', error);
        res.status(500).json({
            success: false,
            message: '用户表查询测试失败',
            error: error.message
        });
    }
});

module.exports = router;