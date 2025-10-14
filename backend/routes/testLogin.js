const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

/**
 * 测试登录路由 - 完全独立的实现
 * POST /api/test/login
 */
router.post('/login', (req, res) => {
    try {
        console.log('测试登录请求:', req.body);
        
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名和密码不能为空'
            });
        }

        // 简单验证
        if (username === 'admin' && password === 'admin123') {
            // 生成token
            const token = jwt.sign(
                {
                    id: 1,
                    username: 'admin',
                    role: 'super_admin',
                    permissions: ['all'],
                    isAdmin: true
                },
                'test-secret-key',
                { expiresIn: '24h' }
            );

            console.log('登录成功，生成token:', token);
            
            return res.json({
                success: true,
                message: '登录成功',
                data: {
                    token: token,
                    username: 'admin',
                    role: 'super_admin',
                    permissions: ['all']
                }
            });
        } else {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }
    } catch (error) {
        console.error('测试登录错误:', error);
        return res.status(500).json({
            success: false,
            message: '服务器错误: ' + error.message
        });
    }
});

module.exports = router;