/**
 * 创建测试用户脚本
 * 用于为登录测试创建固定的测试用户
 */

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 数据库配置
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gold7_game',
    port: process.env.DB_PORT || 3306
};

// 测试用户数据
const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'TestPass123',
    inviteCode: 'TEST123'
};

/**
 * 创建测试用户
 */
async function createTestUser() {
    console.log('🚀 开始创建测试用户...');
    
    let connection;
    
    try {
        // 连接数据库
        connection = await mysql.createConnection(dbConfig);
        
        // 检查用户是否已存在
        const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [testUser.email]
        );
        
        if (existingUsers.length > 0) {
            console.log('✅ 测试用户已存在，无需重复创建');
            console.log(`用户邮箱: ${testUser.email}`);
            console.log(`用户密码: ${testUser.password}`);
            return;
        }
        
        // 加密密码
        const hashedPassword = await bcrypt.hash(testUser.password, 10);
        
        // 插入用户
        const [result] = await connection.execute(
            `INSERT INTO users (username, email, password, invite_code, status, created_at) 
             VALUES (?, ?, ?, ?, 'active', NOW())`,
            [testUser.username, testUser.email, hashedPassword, testUser.inviteCode]
        );
        
        console.log('✅ 测试用户创建成功!');
        console.log(`用户ID: ${result.insertId}`);
        console.log(`用户名: ${testUser.username}`);
        console.log(`邮箱: ${testUser.email}`);
        console.log(`密码: ${testUser.password}`);
        console.log(`邀请码: ${testUser.inviteCode}`);
        
    } catch (error) {
        console.error('❌ 创建测试用户失败:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// 运行脚本
if (require.main === module) {
    createTestUser()
        .then(() => {
            console.log('🎉 测试用户创建完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 脚本执行失败:', error.message);
            process.exit(1);
        });
}

module.exports = { createTestUser, testUser };