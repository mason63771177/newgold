const fetch = require('node-fetch');

class EmailVerificationTest {
    constructor() {
        this.apiUrl = 'http://localhost:3000';
        this.testEmail = `test${Date.now()}@example.com`;
        this.testUsername = `testuser${Date.now()}`;
        this.testPassword = 'TestPass123!@#$%';
    }

    async testEmailVerification() {
        console.log('🧪 开始邮箱验证API测试');
        console.log(`📧 测试邮箱: ${this.testEmail}`);
        
        try {
            // 动态导入 node-fetch
            const fetch = (await import('node-fetch')).default;
            this.fetch = fetch;
            
            // 1. 注册用户
            console.log('\n1️⃣ 注册用户...');
            const registerResponse = await this.registerUser();
            if (!registerResponse.success) {
                throw new Error('用户注册失败: ' + registerResponse.message);
            }
            console.log('✅ 用户注册成功');

            // 2. 获取验证令牌
            console.log('\n2️⃣ 获取验证令牌...');
            const verificationToken = await this.getVerificationToken();
            if (!verificationToken) {
                throw new Error('获取验证令牌失败');
            }
            console.log('✅ 获取验证令牌成功:', verificationToken.substring(0, 20) + '...');

            // 3. 验证邮箱
            console.log('\n3️⃣ 验证邮箱...');
            const verifyResponse = await this.verifyEmail(verificationToken);
            if (!verifyResponse.success) {
                throw new Error('邮箱验证失败: ' + verifyResponse.message);
            }
            console.log('✅ 邮箱验证成功');

            // 4. 检查用户状态
            console.log('\n4️⃣ 检查用户状态...');
            const userStatus = await this.getUserStatus();
            if (!userStatus || !userStatus.email_verified) {
                throw new Error('用户邮箱验证状态未更新');
            }
            console.log('✅ 用户邮箱验证状态已更新');

            console.log('\n🎉 所有测试通过！邮箱验证功能正常工作');
            return true;

        } catch (error) {
            console.error('\n❌ 测试失败:', error.message);
            return false;
        }
    }

    async registerUser() {
        try {
            const response = await this.fetch(`${this.apiUrl}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: this.testUsername,
                    email: this.testEmail,
                    password: this.testPassword
                })
            });

            return await response.json();
        } catch (error) {
            console.error('注册请求失败:', error.message);
            throw error;
        }
    }

    async getVerificationToken() {
        try {
            const response = await this.fetch(`${this.apiUrl}/api/test/get-verification-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: this.testEmail
                })
            });

            const data = await response.json();
            console.log('获取验证令牌响应:', data);
            return data.success ? data.data.verificationToken : null;
        } catch (error) {
            console.error('获取验证令牌请求失败:', error.message);
            throw error;
        }
    }

    async verifyEmail(token) {
        try {
            const verifyUrl = `${this.apiUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(this.testEmail)}`;
            
            const response = await this.fetch(verifyUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return await response.json();
        } catch (error) {
            console.error('邮箱验证请求失败:', error.message);
            throw error;
        }
    }

    async getUserStatus() {
        try {
            const response = await this.fetch(`${this.apiUrl}/api/test/user/${encodeURIComponent(this.testEmail)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            return data.success ? data.data : null;
        } catch (error) {
            console.error('获取用户状态请求失败:', error.message);
            throw error;
        }
    }
}

// 运行测试
async function runTest() {
    const test = new EmailVerificationTest();
    const success = await test.testEmailVerification();
    process.exit(success ? 0 : 1);
}

runTest();
