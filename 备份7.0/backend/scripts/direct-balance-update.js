/**
 * 直接更新用户余额脚本
 * 用于模拟充值到账，直接操作数据库更新用户余额
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 数据库配置
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tatum_wallet',
    port: process.env.DB_PORT || 3306
};

// 测试配置
const CONFIG = {
    userId: 21, // 测试用户ID
    depositAmount: 100, // 充值金额
    testTxHash: `0x${Date.now().toString(16)}${Math.random().toString(16).substr(2, 8)}`,
    depositAddress: 'TYeVe8dn6NEZYwUiu7GmFpF8jsP8uMTrNZ'
};

/**
 * 获取用户当前余额
 */
async function getUserBalance(connection, userId) {
    try {
        const [rows] = await connection.execute(
            'SELECT balance FROM users WHERE id = ?',
            [userId]
        );
        
        if (rows.length === 0) {
            throw new Error(`用户 ${userId} 不存在`);
        }
        
        return parseFloat(rows[0].balance || 0);
    } catch (error) {
        console.error('❌ 获取用户余额失败:', error.message);
        throw error;
    }
}

/**
 * 更新用户余额
 */
async function updateUserBalance(connection, userId, amount) {
    try {
        await connection.execute(
            'UPDATE users SET balance = balance + ? WHERE id = ?',
            [amount, userId]
        );
        
        console.log(`✅ 用户 ${userId} 余额已增加 ${amount} USDT`);
        return true;
    } catch (error) {
        console.error('❌ 更新用户余额失败:', error.message);
        throw error;
    }
}

/**
 * 记录充值交易
 */
async function recordDepositTransaction(connection, userId, amount, txHash, address) {
    try {
        // 插入钱包交易记录
        await connection.execute(
            `INSERT INTO wallet_transactions (
                user_id, transaction_hash, type, amount, 
                balance_before, balance_after, status, 
                description, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                userId,
                txHash,
                'activation', // 使用activation类型代替deposit
                amount,
                0, // 充值前余额（简化处理）
                amount, // 充值后余额（简化处理）
                'completed',
                `模拟充值 ${amount} USDT 到地址 ${address}`
            ]
        );
        
        console.log(`✅ 充值交易记录已保存，交易哈希: ${txHash}`);
        return true;
    } catch (error) {
        console.error('❌ 记录充值交易失败:', error.message);
        throw error;
    }
}

/**
 * 主要的充值模拟流程
 */
async function simulateDepositToAccount() {
    let connection;
    
    try {
        console.log('🚀 开始模拟充值到账流程');
        console.log('=' .repeat(50));
        
        // 连接数据库
        console.log('📊 步骤1: 连接数据库');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ 数据库连接成功');
        
        // 获取用户初始余额
        console.log('\n📊 步骤2: 获取用户初始余额');
        const initialBalance = await getUserBalance(connection, CONFIG.userId);
        console.log(`💰 用户 ${CONFIG.userId} 当前余额: ${initialBalance} USDT`);
        
        // 开始事务
        console.log('\n📊 步骤3: 开始充值处理事务');
        await connection.beginTransaction();
        
        try {
            // 更新用户余额
            console.log('🔄 更新用户余额...');
            await updateUserBalance(connection, CONFIG.userId, CONFIG.depositAmount);
            
            // 记录充值交易
            console.log('🔄 记录充值交易...');
            await recordDepositTransaction(
                connection, 
                CONFIG.userId, 
                CONFIG.depositAmount, 
                CONFIG.testTxHash, 
                CONFIG.depositAddress
            );
            
            // 提交事务
            await connection.commit();
            console.log('✅ 充值事务提交成功');
            
        } catch (error) {
            // 回滚事务
            await connection.rollback();
            console.error('❌ 充值事务失败，已回滚:', error.message);
            throw error;
        }
        
        // 验证最终余额
        console.log('\n📊 步骤4: 验证充值结果');
        const finalBalance = await getUserBalance(connection, CONFIG.userId);
        const expectedBalance = initialBalance + CONFIG.depositAmount;
        
        console.log(`💰 充值前余额: ${initialBalance} USDT`);
        console.log(`💰 充值后余额: ${finalBalance} USDT`);
        console.log(`💰 预期余额: ${expectedBalance} USDT`);
        
        const verificationPassed = finalBalance === expectedBalance;
        console.log(`🔍 余额验证: ${verificationPassed ? '✅ 通过' : '❌ 失败'}`);
        
        // 生成测试报告
        const testReport = {
            testTime: new Date().toISOString(),
            userId: CONFIG.userId,
            depositAddress: CONFIG.depositAddress,
            txHash: CONFIG.testTxHash,
            depositAmount: CONFIG.depositAmount,
            initialBalance,
            finalBalance,
            expectedBalance,
            verificationPassed,
            success: true
        };
        
        // 保存测试报告
        const reportPath = path.join(__dirname, 'direct-deposit-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));
        
        console.log('\n' + '=' .repeat(50));
        console.log('📋 充值模拟完成！');
        console.log(`📄 测试报告已保存到: ${reportPath}`);
        console.log('📊 测试结果摘要:');
        console.log(`   - 充值处理: ✅ 成功`);
        console.log(`   - 余额验证: ${verificationPassed ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   - 用户ID: ${CONFIG.userId}`);
        console.log(`   - 充值金额: ${CONFIG.depositAmount} USDT`);
        console.log(`   - 交易哈希: ${CONFIG.testTxHash}`);
        
        return testReport;
        
    } catch (error) {
        console.error('❌ 充值模拟失败:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('📊 数据库连接已关闭');
        }
    }
}

// 运行测试
if (require.main === module) {
    simulateDepositToAccount()
        .then(report => {
            console.log('\n🎉 充值模拟执行完成');
            process.exit(report.verificationPassed ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 充值模拟执行异常:', error);
            process.exit(1);
        });
}

module.exports = {
    simulateDepositToAccount,
    getUserBalance,
    updateUserBalance,
    recordDepositTransaction
};