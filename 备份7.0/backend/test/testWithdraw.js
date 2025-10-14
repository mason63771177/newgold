const axios = require('axios');
const jwt = require('jsonwebtoken');

// 配置
const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

/**
 * 生成测试用的JWT token
 */
function generateTestToken(userId = 13) {
    return jwt.sign(
        { id: userId, email: 'test@example.com' },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
}

/**
 * 测试提现功能
 */
async function testWithdraw() {
    console.log('🧪 测试提现功能...');
    
    try {
        const token = generateTestToken();
        
        // 1. 获取钱包地址
        console.log('\n1. 获取钱包地址...');
        const addressResponse = await axios.get(`${BASE_URL}/api/tatum-wallet/address`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (addressResponse.data.success) {
            console.log('✅ 钱包地址获取成功:', addressResponse.data.data);
            const walletAddress = addressResponse.data.data.address;
            
            // 2. 查询当前余额
            console.log('\n2. 查询当前余额...');
            const balanceResponse = await axios.get(`${BASE_URL}/api/tatum-wallet/balance/${walletAddress}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (balanceResponse.data.success) {
                console.log('✅ 余额查询成功:', balanceResponse.data.data);
                const currentBalance = balanceResponse.data.data.balances.usdt;
                
                // 3. 测试提现（使用测试地址）
                console.log('\n3. 测试提现...');
                const testToAddress = 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE'; // 测试用的TRON地址
                const withdrawAmount = 10; // 测试提现10 USDT
                
                console.log(`尝试提现 ${withdrawAmount} USDT 到地址: ${testToAddress}`);
                
                const withdrawResponse = await axios.post(`${BASE_URL}/api/tatum-wallet/withdraw`, {
                    toAddress: testToAddress,
                    amount: withdrawAmount,
                    currency: 'USDT'
                }, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (withdrawResponse.data.success) {
                    console.log('✅ 提现请求成功:', withdrawResponse.data.data);
                    
                    // 显示手续费信息
                    const data = withdrawResponse.data.data;
                    console.log(`💰 提现详情:`);
                    console.log(`   提现金额: ${data.amount} USDT`);
                    console.log(`   手续费: ${data.fee} USDT`);
                    console.log(`   实际到账: ${data.actualAmount} USDT`);
                    console.log(`   交易哈希: ${data.txHash}`);
                    console.log(`   状态: ${data.status}`);
                    
                } else {
                    console.log('❌ 提现失败:', withdrawResponse.data);
                    
                    // 如果是余额不足，这是正常的测试结果
                    if (withdrawResponse.data.message && withdrawResponse.data.message.includes('余额不足')) {
                        console.log('💡 提示: 这是正常的测试结果，因为测试钱包没有足够的USDT余额');
                        console.log(`   当前余额: ${currentBalance} USDT`);
                        console.log(`   尝试提现: ${withdrawAmount} USDT`);
                        console.log('   要测试提现功能，请先向钱包地址充值USDT');
                    }
                }
                
            } else {
                console.log('❌ 余额查询失败:', balanceResponse.data);
            }
            
        } else {
            console.log('❌ 钱包地址获取失败:', addressResponse.data);
        }
        
    } catch (error) {
        console.error('❌ 提现测试失败:');
        if (error.response?.data) {
            console.error('   响应数据:', error.response.data);
        } else {
            console.error('   错误信息:', error.message);
        }
    }
}

// 运行测试
testWithdraw();