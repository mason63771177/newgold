/**
 * 手续费利润 API 接口测试脚本
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

/**
 * 测试获取手续费配置（无需认证）
 */
async function testGetConfig() {
    console.log('\n🧪 测试获取手续费配置...');
    
    try {
        const response = await axios.get(`${BASE_URL}/fee-profit/config`);
        console.log('✅ 配置获取成功:', response.data);
        return response.data;
    } catch (error) {
        console.log('❌ 配置获取失败:', error.response?.data || error.message);
        return null;
    }
}

/**
 * 测试获取利润统计（无需认证）
 */
async function testGetStats() {
    console.log('\n🧪 测试获取利润统计...');
    
    try {
        const response = await axios.get(`${BASE_URL}/fee-profit/stats?days=30`);
        console.log('✅ 统计获取成功:', response.data);
        return response.data;
    } catch (error) {
        console.log('❌ 统计获取失败:', error.response?.data || error.message);
        return null;
    }
}

/**
 * 测试获取利润记录（无需认证）
 */
async function testGetRecords() {
    console.log('\n🧪 测试获取利润记录...');
    
    try {
        const response = await axios.get(`${BASE_URL}/fee-profit/records?page=1&limit=10`);
        console.log('✅ 记录获取成功:', response.data);
        return response.data;
    } catch (error) {
        console.log('❌ 记录获取失败:', error.response?.data || error.message);
        return null;
    }
}

/**
 * 测试获取利润钱包余额（无需认证）
 */
async function testGetBalance() {
    console.log('\n🧪 测试获取利润钱包余额...');
    
    try {
        const response = await axios.get(`${BASE_URL}/fee-profit/balance`);
        console.log('✅ 余额获取成功:', response.data);
        return response.data;
    } catch (error) {
        console.log('❌ 余额获取失败:', error.response?.data || error.message);
        return null;
    }
}

/**
 * 测试手动触发利润转账（无需认证）
 */
async function testManualTransfer() {
    console.log('\n🧪 测试手动触发利润转账...');
    
    const testWithdrawalId = `api_test_${Date.now()}`;
    const testData = {
        amount: 100,
        txHash: `0xtest_${Date.now()}`
    };
    
    try {
        const response = await axios.post(
            `${BASE_URL}/fee-profit/transfer/${testWithdrawalId}`,
            testData,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('✅ 手动转账成功:', response.data);
        return response.data;
    } catch (error) {
        console.log('❌ 手动转账失败:', error.response?.data || error.message);
        return null;
    }
}

/**
 * 测试服务器健康状态
 */
async function testHealth() {
    console.log('\n🧪 测试服务器健康状态...');
    
    try {
        const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
        console.log('✅ 服务器健康:', response.data);
        return response.data;
    } catch (error) {
        console.log('❌ 服务器健康检查失败:', error.response?.data || error.message);
        return null;
    }
}

/**
 * 运行所有API测试
 */
async function runAllTests() {
    console.log('🚀 开始手续费利润 API 测试...\n');
    
    // 1. 测试服务器健康状态
    await testHealth();
    
    // 2. 测试获取配置
    await testGetConfig();
    
    // 3. 测试获取统计
    await testGetStats();
    
    // 4. 测试获取记录
    await testGetRecords();
    
    // 5. 测试获取余额
    await testGetBalance();
    
    // 6. 测试手动转账
    await testManualTransfer();
    
    console.log('\n✅ 所有 API 测试完成！');
}

// 运行测试
runAllTests().catch(console.error);