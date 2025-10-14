import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

/**
 * 生成有效的JWT token用于测试
 */
function generateValidToken() {
    const JWT_SECRET = process.env.JWT_SECRET;
    
    if (!JWT_SECRET) {
        console.error('❌ JWT_SECRET未找到，请检查.env文件');
        return null;
    }
    
    // 模拟用户数据
    const userData = {
        userId: 'test-user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
    };
    
    // 生成token，有效期24小时
    const token = jwt.sign(userData, JWT_SECRET, { 
        expiresIn: '24h',
        issuer: 'gold7-system'
    });
    
    console.log('✅ 生成的有效JWT token:');
    console.log(token);
    console.log('\n📋 复制以下token到调试页面:');
    console.log(`"${token}"`);
    
    // 验证token是否有效
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('\n✅ Token验证成功，解码内容:');
        console.log(JSON.stringify(decoded, null, 2));
    } catch (error) {
        console.error('❌ Token验证失败:', error.message);
    }
    
    return token;
}

// 执行生成
generateValidToken();