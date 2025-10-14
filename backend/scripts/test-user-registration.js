/**
 * 测试用户注册脚本
 * 模拟用户注册新账号并获取充值地址
 */

const axios = require('axios');

/**
 * 用户注册测试器
 */
class UserRegistrationTester {
    constructor() {
        this.baseURL = 'http://localhost:3000';
        this.testUser = {
            email: `test_user_${Date.now()}@example.com`,
            password: 'test123456',
            inviteCode: 'TEST001' // 使用测试邀请码
        };
        this.authToken = null;
        this.userId = null;
        this.depositAddress = null;
    }

    /**
     * 测试用户注册
     */
    async testUserRegistration() {
        try {
            console.log('🔐 开始测试用户注册...');
            console.log(`📧 测试邮箱: ${this.testUser.email}`);
            console.log(`🎫 邀请码: ${this.testUser.inviteCode}`);

            const response = await axios.post(`${this.baseURL}/api/auth/register`, {
                email: this.testUser.email,
                password: this.testUser.password,
                inviteCode: this.testUser.inviteCode
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            if (response.data.success) {
                console.log('✅ 用户注册成功!');
                console.log(`   用户ID: ${response.data.data.user.id}`);
                console.log(`   邮箱: ${response.data.data.user.email}`);
                console.log(`   状态: ${response.data.data.user.status}`);
                console.log(`   邀请码: ${response.data.data.user.invite_code}`);
                
                this.userId = response.data.data.user.id;
                this.authToken = response.data.data.token;
                
                return {
                    success: true,
                    user: response.data.data.user,
                    token: response.data.data.token
                };
            } else {
                console.log('❌ 用户注册失败:', response.data.message);
                return { success: false, message: response.data.message };
            }

        } catch (error) {
            console.error('❌ 注册请求失败:', error.message);
            
            if (error.response) {
                console.log(`   状态码: ${error.response.status}`);
                console.log(`   错误信息: ${error.response.data?.message || '未知错误'}`);
            }
            
            return { success: false, error: error.message };
        }
    }

    /**
     * 测试用户登录
     */
    async testUserLogin() {
        try {
            console.log('\n🔑 测试用户登录...');

            const response = await axios.post(`${this.baseURL}/api/auth/login`, {
                email: this.testUser.email,
                password: this.testUser.password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            if (response.data.success) {
                console.log('✅ 用户登录成功!');
                this.authToken = response.data.data.token;
                this.userId = response.data.data.user.id;
                
                return {
                    success: true,
                    user: response.data.data.user,
                    token: response.data.data.token
                };
            } else {
                console.log('❌ 用户登录失败:', response.data.message);
                return { success: false, message: response.data.message };
            }

        } catch (error) {
            console.error('❌ 登录请求失败:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取用户充值地址
     */
    async getUserDepositAddress() {
        try {
            console.log('\n💰 获取用户充值地址...');

            if (!this.authToken) {
                console.log('❌ 未获取到认证令牌，无法获取充值地址');
                return { success: false, message: '未认证' };
            }

            const response = await axios.get(`${this.baseURL}/api/wallet/deposit-address`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            if (response.data.success) {
                console.log('✅ 成功获取充值地址!');
                console.log(`   充值地址: ${response.data.data.address}`);
                console.log(`   网络: ${response.data.data.network || 'TRC20'}`);
                console.log(`   币种: ${response.data.data.currency || 'USDT'}`);
                
                this.depositAddress = response.data.data.address;
                
                return {
                    success: true,
                    address: response.data.data.address,
                    network: response.data.data.network,
                    currency: response.data.data.currency
                };
            } else {
                console.log('❌ 获取充值地址失败:', response.data.message);
                return { success: false, message: response.data.message };
            }

        } catch (error) {
            console.error('❌ 获取充值地址请求失败:', error.message);
            
            if (error.response) {
                console.log(`   状态码: ${error.response.status}`);
                console.log(`   错误信息: ${error.response.data?.message || '未知错误'}`);
            }
            
            return { success: false, error: error.message };
        }
    }

    /**
     * 检查用户余额
     */
    async checkUserBalance() {
        try {
            console.log('\n💳 检查用户余额...');

            if (!this.authToken) {
                console.log('❌ 未获取到认证令牌，无法检查余额');
                return { success: false, message: '未认证' };
            }

            const response = await axios.get(`${this.baseURL}/api/balance`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            if (response.data.success) {
                console.log('✅ 成功获取用户余额!');
                console.log(`   可用余额: ${response.data.data.available_balance} USDT`);
                console.log(`   冻结余额: ${response.data.data.frozen_balance} USDT`);
                console.log(`   总余额: ${response.data.data.total_balance} USDT`);
                
                return {
                    success: true,
                    balance: response.data.data
                };
            } else {
                console.log('❌ 获取余额失败:', response.data.message);
                return { success: false, message: response.data.message };
            }

        } catch (error) {
            console.error('❌ 获取余额请求失败:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * 运行完整的注册测试流程
     */
    async runFullTest() {
        console.log('🎯 开始完整的用户注册测试流程\n');
        
        const results = {
            registration: null,
            login: null,
            depositAddress: null,
            balance: null
        };

        // 1. 测试用户注册
        results.registration = await this.testUserRegistration();
        
        if (!results.registration.success) {
            console.log('\n❌ 注册失败，终止测试');
            return results;
        }

        // 2. 测试用户登录
        results.login = await this.testUserLogin();
        
        if (!results.login.success) {
            console.log('\n❌ 登录失败，终止测试');
            return results;
        }

        // 3. 获取充值地址
        results.depositAddress = await this.getUserDepositAddress();
        
        // 4. 检查初始余额
        results.balance = await this.checkUserBalance();

        // 输出测试总结
        console.log('\n📊 测试结果总结:');
        console.log('==========================================');
        console.log(`✅ 用户注册: ${results.registration.success ? '成功' : '失败'}`);
        console.log(`✅ 用户登录: ${results.login.success ? '成功' : '失败'}`);
        console.log(`✅ 获取充值地址: ${results.depositAddress.success ? '成功' : '失败'}`);
        console.log(`✅ 检查余额: ${results.balance.success ? '成功' : '失败'}`);
        
        if (results.depositAddress.success) {
            console.log('\n💡 下一步操作:');
            console.log(`1. 向充值地址转账: ${this.depositAddress}`);
            console.log('2. 等待交易确认');
            console.log('3. 监控后端日志查看充值检测');
            console.log('4. 验证用户余额更新');
        }

        return results;
    }

    /**
     * 获取测试用户信息
     */
    getTestUserInfo() {
        return {
            email: this.testUser.email,
            password: this.testUser.password,
            inviteCode: this.testUser.inviteCode,
            userId: this.userId,
            authToken: this.authToken,
            depositAddress: this.depositAddress
        };
    }
}

// 主函数
async function main() {
    const tester = new UserRegistrationTester();
    
    try {
        const results = await tester.runFullTest();
        
        // 保存测试用户信息到文件，供后续测试使用
        const testUserInfo = tester.getTestUserInfo();
        const fs = require('fs');
        fs.writeFileSync(
            '/Users/mason1236/0930/backend/scripts/test-user-info.json',
            JSON.stringify(testUserInfo, null, 2)
        );
        
        console.log('\n💾 测试用户信息已保存到: test-user-info.json');
        
        return results;
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = UserRegistrationTester;