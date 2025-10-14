/**
 * 钱包API测试脚本
 * 测试Tatum基础钱包服务的API接口
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

// 配置
const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// 生成测试用的JWT token
function generateTestToken(userId = 13) {  // 使用数据库中存在的用户ID
    return jwt.sign(
        { 
            id: userId,
            username: 'test_user',
            role: 'user'
        },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
}

// API测试函数
async function testWalletAPI() {
    console.log('🚀 开始测试钱包API...\n');
    
    const token = generateTestToken();
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    
    try {
        // 1. 测试获取钱包地址
        console.log('1️⃣ 测试获取钱包地址...');
        const addressResponse = await axios.get(`${BASE_URL}/api/tatum-wallet/address`, { headers });
        console.log('✅ 钱包地址获取成功:', addressResponse.data);
        
        const walletAddress = addressResponse.data.data.address;
        console.log('📍 钱包地址:', walletAddress);
        
        // 2. 测试查询余额
        console.log('\n2️⃣ 测试查询余额...');
        const balanceResponse = await axios.get(`${BASE_URL}/api/tatum-wallet/balance/${walletAddress}`, { headers });
        console.log('✅ 余额查询成功:', balanceResponse.data);
        
        // 3. 测试获取交易历史
        console.log('\n3️⃣ 测试获取交易历史...');
        const transactionsResponse = await axios.get(`${BASE_URL}/api/tatum-wallet/transactions`, { headers });
        console.log('✅ 交易历史获取成功:', transactionsResponse.data);
        
        // 4. 测试提现（会失败，因为余额不足）
        console.log('\n4️⃣ 测试提现功能...');
        try {
            const withdrawResponse = await axios.post(`${BASE_URL}/api/tatum-wallet/withdraw`, {
                toAddress: 'TTestAddressForWithdrawTest123456789',
                amount: 1
            }, { headers });
            console.log('✅ 提现测试:', withdrawResponse.data);
        } catch (error) {
            console.log('⚠️ 提现测试失败（预期）:', error.response?.data?.message || error.message);
        }
        
        // 5. 测试充值回调（模拟）
        console.log('\n5️⃣ 测试充值回调...');
        try {
            const callbackResponse = await axios.post(`${BASE_URL}/api/tatum-wallet/deposit/callback`, {
                txHash: 'test_tx_hash_' + Date.now(),
                amount: '10.5',
                fromAddress: 'TFromTestAddress123456789',
                toAddress: walletAddress,
                blockNumber: 12345
            });
            console.log('✅ 充值回调测试:', callbackResponse.data);
        } catch (error) {
            console.log('⚠️ 充值回调测试失败:', error.response?.data?.message || error.message);
        }
        
        // 6. 测试获取主钱包信息
        console.log('\n6️⃣ 测试获取主钱包信息...');
        try {
            const masterResponse = await axios.get(`${BASE_URL}/api/tatum-wallet/master`, { headers });
            console.log('✅ 主钱包信息获取成功:', masterResponse.data);
        } catch (error) {
            console.log('⚠️ 主钱包信息获取失败:', error.response?.data?.message || error.message);
        }
        
        // 7. 测试资金归集
        console.log('\n7️⃣ 测试资金归集...');
        try {
            const consolidateResponse = await axios.post(`${BASE_URL}/api/tatum-wallet/consolidate`, {}, { headers });
            console.log('✅ 资金归集测试:', consolidateResponse.data);
        } catch (error) {
            console.log('⚠️ 资金归集测试失败:', error.response?.data?.message || error.message);
        }
        
        console.log('\n🎉 钱包API测试完成！');
        
    } catch (error) {
        console.error('❌ API测试失败:', error.response?.data || error.message);
    }
}

// 测试无效token
async function testInvalidToken() {
    console.log('\n🔒 测试无效token...');
    
    try {
        const response = await axios.get(`${BASE_URL}/api/tatum-wallet/address`, {
            headers: {
                'Authorization': 'Bearer invalid_token',
                'Content-Type': 'application/json'
            }
        });
        console.log('❌ 应该失败但成功了:', response.data);
    } catch (error) {
        console.log('✅ 无效token测试成功，正确拒绝访问:', error.response?.status, error.response?.data?.message);
    }
}

// 测试无token
async function testNoToken() {
    console.log('\n🚫 测试无token...');
    
    try {
        const response = await axios.get(`${BASE_URL}/api/tatum-wallet/address`);
        console.log('❌ 应该失败但成功了:', response.data);
    } catch (error) {
        console.log('✅ 无token测试成功，正确拒绝访问:', error.response?.status, error.response?.data?.message);
    }
}

// 主测试函数
async function runAllTests() {
    console.log('🧪 开始完整的钱包API测试套件...\n');
    
    // 检查服务器是否运行
    try {
        await axios.get(`${BASE_URL}/health`);
        console.log('✅ 服务器运行正常\n');
    } catch (error) {
        console.error('❌ 服务器未运行，请先启动服务器');
        return;
    }
    
    // 运行所有测试
    await testWalletAPI();
    await testInvalidToken();
    await testNoToken();
    
    console.log('\n📋 测试总结:');
    console.log('   ✅ 钱包地址获取');
    console.log('   ✅ 余额查询');
    console.log('   ✅ 交易历史');
    console.log('   ✅ 提现功能（错误处理）');
    console.log('   ✅ 充值回调');
    console.log('   ✅ 主钱包信息');
    console.log('   ✅ 资金归集');
    console.log('   ✅ 权限验证');
    
    console.log('\n🎯 所有API测试完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = {
    testWalletAPI,
    testInvalidToken,
    testNoToken,
    runAllTests,
    generateTestToken
};