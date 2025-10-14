const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function testLogin() {
    try {
        // 连接数据库
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'gold7_game'
        });

        // 查询用户
        const [rows] = await connection.execute(
            'SELECT id, email, password FROM users WHERE email = ?',
            ['testuser@example.com']
        );

        if (rows.length === 0) {
            console.log('用户不存在');
            return;
        }

        const user = rows[0];
        console.log('用户信息:', {
            id: user.id,
            email: user.email,
            passwordHash: user.password
        });

        // 测试密码验证
        const testPassword = 'testpass123';
        console.log('测试密码:', testPassword);

        const isValid = await bcrypt.compare(testPassword, user.password);
        console.log('密码验证结果:', isValid);

        // 生成新的哈希值进行对比
        const newHash = await bcrypt.hash(testPassword, 12);
        console.log('新生成的哈希值:', newHash);

        const isNewHashValid = await bcrypt.compare(testPassword, newHash);
        console.log('新哈希值验证结果:', isNewHashValid);

        await connection.end();
    } catch (error) {
        console.error('测试失败:', error);
    }
}

testLogin();