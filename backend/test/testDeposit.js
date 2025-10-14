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
 * 测试充值功能
 */
async function testDeposit() {
    console.log('🧪 测试充值功能...');
    
    try {
        const token = generateTestToken();
        
        // 1. 获取钱包地址（充值地址）
        console.log('\n1. 获取钱包地址...');
        const addressResponse = await axios.get(`${BASE_URL}/api/tatum-wallet/address`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (addressResponse.data.success) {
            console.log('✅ 钱包地址获取成功:', addressResponse.data.data);
            const depositAddress = addressResponse.data.data.address;
            
            // 2. 查询地址余额
            console.log('\n2. 查询地址余额...');
            const balanceResponse = await axios.get(`${BASE_URL}/api/tatum-wallet/balance/${depositAddress}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (balanceResponse.data.success) {
                console.log('✅ 余额查询成功:', balanceResponse.data.data);
            } else {
                console.log('❌ 余额查询失败:', balanceResponse.data);
            }
            
            // 3. 模拟充值监听（检查交易历史）
            console.log('\n3. 检查交易历史...');
            const historyResponse = await axios.get(`${BASE_URL}/api/tatum-wallet/transactions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (historyResponse.data.success) {
                console.log('✅ 交易历史查询成功:', historyResponse.data.data);
                
                if (historyResponse.data.data.transactions.length === 0) {
                    console.log('💡 提示: 当前没有充值记录。要测试充值功能，请向以下地址发送USDT:');
                    console.log(`   充值地址: ${depositAddress}`);
                    console.log('   网络: TRON (TRC20)');
                    console.log('   币种: USDT');
                }
            } else {
                console.log('❌ 交易历史查询失败:', historyResponse.data);
            }
            
        } else {
            console.log('❌ 钱包地址获取失败:', addressResponse.data);
        }
        
    } catch (error) {
        console.error('❌ 充值测试失败:', error.response?.data || error.message);
    }
}

// 运行测试
testDeposit();