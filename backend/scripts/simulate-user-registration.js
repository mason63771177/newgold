/**
 * 模拟用户注册脚本
 * 用于测试完整的用户注册和钱包地址生成流程
 */
require('dotenv').config();
const axios = require('axios');
const { pool } = require('../config/database');

/**
 * 用户注册模拟器
 */
class UserRegistrationSimulator {
    constructor() {
        this.baseURL = 'http://localhost:3000';
        this.testUser = {
            email: `test_${Date.now()}@example.com`,
            password: 'Test123456!',
            inviteCode: `TEST${Date.now()}`
        };
    }

    /**
     * 模拟用户注册
     */
    async simulateRegistration() {
        try {
            console.log('🎯 开始模拟用户注册流程...\n');
            
            console.log('📋 测试用户信息:');
            console.log(`   邮箱: ${this.testUser.email}`);
            console.log(`   密码: ${this.testUser.password}`);
            console.log(`   邀请码: ${this.testUser.inviteCode}\n`);

            // 1. 发送注册请求
            console.log('📤 1. 发送注册请求...');
            const registrationResponse = await this.sendRegistrationRequest();
            
            if (registrationResponse.success) {
                console.log('✅ 用户注册成功');
                console.log(`   用户ID: ${registrationResponse.userId}`);
                console.log(`   邮箱: ${registrationResponse.email}\n`);
                
                // 2. 生成钱包地址
                console.log('🏦 2. 为用户生成钱包地址...');
                const walletAddress = await this.generateWalletAddress(registrationResponse.userId);
                
                if (walletAddress) {
                    console.log('✅ 钱包地址生成成功');
                    console.log(`   充值地址: ${walletAddress}\n`);
                    
                    // 3. 验证数据库记录
                    console.log('🔍 3. 验证数据库记录...');
                    await this.verifyDatabaseRecords(registrationResponse.userId);
                    
                    return {
                        userId: registrationResponse.userId,
                        email: this.testUser.email,
                        walletAddress: walletAddress,
                        success: true
                    };
                }
            }
            
            throw new Error('注册流程失败');
            
        } catch (error) {
            console.error('❌ 用户注册模拟失败:', error.message);
            throw error;
        }
    }

    /**
     * 发送注册请求
     */
    async sendRegistrationRequest() {
        try {
            const response = await axios.post(`${this.baseURL}/api/auth/register`, {
                email: this.testUser.email,
                password: this.testUser.password,
                inviteCode: this.testUser.inviteCode
            });

            return response.data;
        } catch (error) {
            if (error.response) {
                console.error('注册请求失败:', error.response.data);
                throw new Error(`注册失败: ${error.response.data.message || error.response.statusText}`);
            } else {
                console.error('网络请求失败:', error.message);
                throw new Error(`网络错误: ${error.message}`);
            }
        }
    }

    /**
     * 生成钱包地址
     */
    async generateWalletAddress(userId) {
        try {
            const response = await axios.post(`${this.baseURL}/api/wallet/create-deposit-address`, {
                userId: userId
            });

            return response.data.address;
        } catch (error) {
            if (error.response) {
                console.error('钱包地址生成失败:', error.response.data);
                throw new Error(`钱包生成失败: ${error.response.data.message || error.response.statusText}`);
            } else {
                console.error('网络请求失败:', error.message);
                throw new Error(`网络错误: ${error.message}`);
            }
        }
    }

    /**
     * 验证数据库记录
     */
    async verifyDatabaseRecords(userId) {
        try {
            // 验证用户记录
            const [userRows] = await pool.execute(
                'SELECT * FROM users WHERE id = ?',
                [userId]
            );

            if (userRows.length === 0) {
                throw new Error('用户记录未找到');
            }

            console.log('✅ 用户记录验证成功');
            console.log(`   用户ID: ${userRows[0].id}`);
            console.log(`   邮箱: ${userRows[0].email}`);
            console.log(`   余额: ${userRows[0].balance} USDT`);

            // 验证钱包地址记录
            const [walletRows] = await pool.execute(
                'SELECT * FROM wallet_addresses WHERE user_id = ?',
                [userId]
            );

            if (walletRows.length === 0) {
                throw new Error('钱包地址记录未找到');
            }

            console.log('✅ 钱包地址记录验证成功');
            console.log(`   地址: ${walletRows[0].address}`);
            console.log(`   派生索引: ${walletRows[0].derivation_index}`);
            console.log(`   创建时间: ${walletRows[0].created_at}\n`);

            return true;
        } catch (error) {
            console.error('❌ 数据库验证失败:', error.message);
            throw error;
        }
    }

    /**
     * 清理测试数据
     */
    async cleanup(userId) {
        try {
            console.log('🧹 清理测试数据...');
            
            // 删除钱包地址记录
            await pool.execute('DELETE FROM wallet_addresses WHERE user_id = ?', [userId]);
            
            // 删除用户记录
            await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
            
            console.log('✅ 测试数据清理完成\n');
        } catch (error) {
            console.error('❌ 清理测试数据失败:', error.message);
        }
    }
}

// 主函数
async function main() {
    const simulator = new UserRegistrationSimulator();
    let testResult = null;
    
    try {
        testResult = await simulator.simulateRegistration();
        
        console.log('🎉 用户注册模拟完成！');
        console.log('\n📊 测试结果:');
        console.log(`   用户ID: ${testResult.userId}`);
        console.log(`   邮箱: ${testResult.email}`);
        console.log(`   钱包地址: ${testResult.walletAddress}`);
        console.log(`   状态: ${testResult.success ? '成功' : '失败'}`);
        
        console.log('\n📋 下一步操作:');
        console.log('1. 使用生成的钱包地址进行入金测试');
        console.log('2. 监控入金识别和余额更新');
        console.log('3. 验证完整的钱包功能');
        
        return testResult;
        
    } catch (error) {
        console.error('💥 测试失败:', error.message);
        return null;
    } finally {
        // 询问是否清理测试数据
        if (testResult && testResult.userId) {
            console.log('\n⚠️ 注意: 测试数据已保留，用于后续入金测试');
            console.log('如需清理，请手动调用 cleanup 方法');
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = UserRegistrationSimulator;