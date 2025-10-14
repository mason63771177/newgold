/**
 * 简化的用户注册测试脚本
 * 快速测试用户注册和充值地址获取
 */

const axios = require('axios');

// 服务器配置
const SERVER_URL = 'http://localhost:3000';

/**
 * 生成随机用户信息
 */
function generateUserInfo() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return {
        username: `testuser_${timestamp}_${random}`,
        email: `test_${timestamp}_${random}@example.com`,
        password: 'Test123456!'
    };
}

/**
 * 注册新用户
 */
async function registerUser() {
    try {
        const userInfo = generateUserInfo();
        
        console.log('🚀 开始注册新用户...');
        console.log(`用户名: ${userInfo.username}`);
        console.log(`邮箱: ${userInfo.email}`);
        
        const response = await axios.post(`${SERVER_URL}/api/auth/register`, {
            username: userInfo.username,
            email: userInfo.email,
            password: userInfo.password,
            confirmPassword: userInfo.password
        }, {
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ 用户注册成功!');
        console.log('用户ID:', response.data.user.id);
        console.log('Token:', response.data.token.substring(0, 20) + '...');
        
        return {
            userId: response.data.user.id,
            username: userInfo.username,
            email: userInfo.email,
            token: response.data.token
        };
        
    } catch (error) {
        console.error('❌ 用户注册失败:');
        if (error.response) {
            console.error('状态码:', error.response.status);
            console.error('错误信息:', error.response.data);
        } else if (error.request) {
            console.error('请求超时或网络错误');
        } else {
            console.error('错误:', error.message);
        }
        throw error;
    }
}

/**
 * 获取用户充值地址
 */
async function getUserDepositAddress(token) {
    try {
        console.log('🔍 获取用户充值地址...');
        
        const response = await axios.get(`${SERVER_URL}/api/wallet/deposit-address`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 5000
        });
        
        console.log('✅ 充值地址获取成功!');
        console.log('充值地址:', response.data.address);
        
        return response.data.address;
        
    } catch (error) {
        console.error('❌ 获取充值地址失败:');
        if (error.response) {
            console.error('状态码:', error.response.status);
            console.error('错误信息:', error.response.data);
        } else {
            console.error('错误:', error.message);
        }
        throw error;
    }
}

/**
 * 主函数
 */
async function main() {
    try {
        console.log('='.repeat(50));
        console.log('🎯 开始简化用户注册测试');
        console.log('='.repeat(50));
        
        // 1. 注册新用户
        const userInfo = await registerUser();
        
        console.log('\n' + '-'.repeat(30));
        
        // 2. 获取充值地址
        const depositAddress = await getUserDepositAddress(userInfo.token);
        
        console.log('\n' + '='.repeat(50));
        console.log('📋 测试结果:');
        console.log('='.repeat(50));
        console.log(`用户ID: ${userInfo.userId}`);
        console.log(`用户名: ${userInfo.username}`);
        console.log(`邮箱: ${userInfo.email}`);
        console.log(`充值地址: ${depositAddress}`);
        console.log('='.repeat(50));
        
        // 保存用户信息供后续测试使用
        const testResult = {
            ...userInfo,
            depositAddress,
            timestamp: new Date().toISOString()
        };
        
        // 写入文件
        const fs = require('fs');
        fs.writeFileSync('test-user-result.json', JSON.stringify(testResult, null, 2));
        console.log('\n💾 用户信息已保存到: test-user-result.json');
        
        return testResult;
        
    } catch (error) {
        console.error('\n💥 测试失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main().then(result => {
        console.log('\n✅ 用户注册测试完成!');
        process.exit(0);
    }).catch(error => {
        console.error('\n❌ 测试失败:', error.message);
        process.exit(1);
    });
}

module.exports = { main, registerUser, getUserDepositAddress };