/**
 * 测试交易历史查询功能
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

// 配置
const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

// 生成测试用的JWT token
function generateTestToken(userId = 13) {
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

async function testTransactionHistory() {
    try {
        console.log('🧪 测试交易历史查询功能...');
        
        const token = generateTestToken();
        
        // 测试获取交易历史
        const response = await axios.get(`${BASE_URL}/api/tatum-wallet/transactions`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ 交易历史查询成功:', response.data);
        
    } catch (error) {
        console.error('❌ 交易历史查询失败:');
        if (error.response) {
            console.error('状态码:', error.response.status);
            console.error('响应数据:', error.response.data);
        } else {
            console.error('错误信息:', error.message);
        }
    }
}

if (require.main === module) {
    testTransactionHistory();
}

module.exports = { testTransactionHistory };