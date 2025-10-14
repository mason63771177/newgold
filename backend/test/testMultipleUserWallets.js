/**
 * 测试多用户独立钱包地址生成功能
 * 验证HD钱包派生机制是否正常工作
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

// 配置
const API_BASE = 'http://localhost:3000/api';
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

/**
 * 生成测试用的JWT token
 */
function generateTestToken(userId) {
    return jwt.sign(
        { 
            userId: userId.toString(),
            username: `testuser${userId}`,
            exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1小时过期
        },
        JWT_SECRET
    );
}

/**
 * 为指定用户获取钱包地址
 */
async function getUserWallet(userId) {
    try {
        const token = generateTestToken(userId);
        
        const response = await axios.get(`${API_BASE}/tatum-wallet/address`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200) {
            return {
                success: true,
                userId: userId,
                address: response.data.address,
                derivationKey: response.data.derivationKey
            };
        } else {
            return {
                success: false,
                userId: userId,
                error: `HTTP ${response.status}: ${response.data?.message || '未知错误'}`
            };
        }
    } catch (error) {
        return {
            success: false,
            userId: userId,
            error: error.response?.data?.message || error.message
        };
    }
}

/**
 * 测试多用户钱包地址生成
 */
async function testMultipleUserWallets() {
    console.log('🧪 开始测试多用户独立钱包地址生成...\n');

    const testUsers = [5, 6, 7, 8, 9]; // 使用数据库中真实存在的用户ID
    const results = [];

    // 为每个用户生成钱包地址
    for (const userId of testUsers) {
        console.log(`📝 为用户 ${userId} 生成钱包地址...`);
        const result = await getUserWallet(userId);
        results.push(result);
        
        if (result.success) {
            console.log(`✅ 用户 ${userId}: ${result.address} (派生索引: ${result.derivationKey})`);
        } else {
            console.log(`❌ 用户 ${userId}: ${result.error}`);
        }
        
        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n📊 测试结果汇总:');
    console.log('==========================================');

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`✅ 成功生成地址: ${successCount}/${testUsers.length}`);
    console.log(`❌ 生成失败: ${failCount}/${testUsers.length}`);

    if (successCount > 0) {
        console.log('\n🔍 地址唯一性验证:');
        const addresses = results.filter(r => r.success).map(r => r.address);
        const uniqueAddresses = [...new Set(addresses)];
        
        if (addresses.length === uniqueAddresses.length) {
            console.log('✅ 所有地址都是唯一的');
        } else {
            console.log('❌ 发现重复地址！');
            console.log('所有地址:', addresses);
            console.log('唯一地址:', uniqueAddresses);
        }

        console.log('\n📋 生成的地址列表:');
        results.filter(r => r.success).forEach(r => {
            console.log(`用户 ${r.userId}: ${r.address} (索引: ${r.derivationKey})`);
        });
    }

    if (failCount > 0) {
        console.log('\n❌ 失败详情:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`用户 ${r.userId}: ${r.error}`);
        });
    }

    console.log('\n🎯 测试总结:');
    console.log('==========================================');
    
    if (successCount === testUsers.length) {
        console.log('🎉 所有用户都成功生成了独立的钱包地址！');
        console.log('💡 HD钱包派生机制工作正常');
        console.log('🔒 每个用户都有独立的入金地址');
        console.log('📈 可以无限扩展用户数量');
    } else if (successCount > 0) {
        console.log('⚠️  部分用户生成成功，需要检查失败原因');
    } else {
        console.log('💥 所有用户都生成失败，需要检查系统配置');
    }

    return {
        total: testUsers.length,
        success: successCount,
        failed: failCount,
        results: results
    };
}

/**
 * 验证地址派生的一致性
 */
async function testAddressConsistency() {
    console.log('\n🔄 测试地址派生一致性...');
    
    const userId = 9999; // 使用特殊用户ID测试
    
    // 多次获取同一用户的地址
    const attempts = [];
    for (let i = 0; i < 3; i++) {
        const result = await getUserWallet(userId);
        attempts.push(result);
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    const addresses = attempts.filter(a => a.success).map(a => a.address);
    const uniqueAddresses = [...new Set(addresses)];

    if (uniqueAddresses.length === 1 && addresses.length > 0) {
        console.log('✅ 地址派生一致性测试通过');
        console.log(`📍 用户 ${userId} 的固定地址: ${uniqueAddresses[0]}`);
    } else {
        console.log('❌ 地址派生一致性测试失败');
        console.log('获取到的地址:', addresses);
    }
}

// 执行测试
async function runTests() {
    try {
        const results = await testMultipleUserWallets();
        await testAddressConsistency();
        
        console.log('\n🏁 测试完成！');
        
    } catch (error) {
        console.error('💥 测试执行失败:', error.message);
    }
}

// 启动测试
runTests();