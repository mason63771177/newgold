/**
 * Tatum API 诊断测试脚本
 * 用于检查API密钥有效性和可用功能
 */

require('dotenv').config();
const axios = require('axios');

class TatumAPITester {
    constructor() {
        this.apiKey = process.env.TATUM_API_KEY;
        this.baseUrl = 'https://api.tatum.io';
        this.api = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'x-api-key': this.apiKey,
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * 测试API密钥有效性
     */
    async testAPIKey() {
        console.log('🔑 测试API密钥有效性...');
        try {
            const response = await this.api.get('/v3/tatum/credits');
            console.log('✅ API密钥有效');
            console.log('📊 剩余积分:', response.data);
            return true;
        } catch (error) {
            console.log('❌ API密钥测试失败:', error.response?.data || error.message);
            return false;
        }
    }

    /**
     * 测试虚拟账户功能
     */
    async testVirtualAccount() {
        console.log('\n💳 测试虚拟账户功能...');
        try {
            // 尝试创建一个简单的虚拟账户
            const accountData = {
                currency: 'USDT',
                accountingCurrency: 'USD',
                accountCode: 'TEST_ACCOUNT_' + Date.now()
            };

            const response = await this.api.post('/v3/ledger/account', accountData);
            console.log('✅ 虚拟账户创建成功');
            console.log('📝 账户信息:', response.data);
            return response.data;
        } catch (error) {
            console.log('❌ 虚拟账户创建失败:', error.response?.data || error.message);
            return null;
        }
    }

    /**
     * 测试支持的货币
     */
    async testSupportedCurrencies() {
        console.log('\n💰 测试支持的货币...');
        try {
            const response = await this.api.get('/v3/tatum/rate');
            console.log('✅ 获取汇率成功');
            console.log('💱 支持的货币数量:', Object.keys(response.data).length);
            
            // 检查USDT相关货币
            const usdtCurrencies = Object.keys(response.data).filter(currency => 
                currency.includes('USDT') || currency.includes('usdt')
            );
            console.log('🔍 USDT相关货币:', usdtCurrencies);
            return response.data;
        } catch (error) {
            console.log('❌ 获取支持货币失败:', error.response?.data || error.message);
            return null;
        }
    }

    /**
     * 测试区块链信息
     */
    async testBlockchainInfo() {
        console.log('\n⛓️ 测试区块链信息...');
        try {
            // 测试TRON网络信息
            const response = await this.api.get('/v3/tron/info');
            console.log('✅ TRON网络信息获取成功');
            console.log('📊 网络信息:', response.data);
            return response.data;
        } catch (error) {
            console.log('❌ 获取区块链信息失败:', error.response?.data || error.message);
            return null;
        }
    }

    /**
     * 测试账户余额查询
     */
    async testAccountBalance() {
        console.log('\n💰 测试账户余额查询...');
        try {
            // 尝试查询一个测试地址的余额
            const testAddress = 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE'; // TRON测试地址
            const response = await this.api.get(`/v3/tron/account/balance/${testAddress}`);
            console.log('✅ 余额查询成功');
            console.log('💳 地址余额:', response.data);
            return response.data;
        } catch (error) {
            console.log('❌ 余额查询失败:', error.response?.data || error.message);
            return null;
        }
    }

    /**
     * 运行所有测试
     */
    async runAllTests() {
        console.log('🚀 开始Tatum API诊断测试...\n');
        console.log('🔧 配置信息:');
        console.log('   API Key:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : '未设置');
        console.log('   Base URL:', this.baseUrl);
        console.log('   Network:', process.env.TATUM_NETWORK || '未设置');
        console.log('   Environment:', process.env.TATUM_ENVIRONMENT || '未设置');
        console.log('=' .repeat(50));

        const results = {
            apiKey: await this.testAPIKey(),
            virtualAccount: await this.testVirtualAccount(),
            currencies: await this.testSupportedCurrencies(),
            blockchain: await this.testBlockchainInfo(),
            balance: await this.testAccountBalance()
        };

        console.log('\n' + '=' .repeat(50));
        console.log('📋 测试结果总结:');
        console.log('   API密钥:', results.apiKey ? '✅ 有效' : '❌ 无效');
        console.log('   虚拟账户:', results.virtualAccount ? '✅ 可用' : '❌ 不可用');
        console.log('   货币支持:', results.currencies ? '✅ 可用' : '❌ 不可用');
        console.log('   区块链信息:', results.blockchain ? '✅ 可用' : '❌ 不可用');
        console.log('   余额查询:', results.balance ? '✅ 可用' : '❌ 不可用');

        // 提供建议
        console.log('\n💡 建议:');
        if (!results.apiKey) {
            console.log('   - 检查API密钥是否正确设置');
            console.log('   - 确认API密钥是否有效且未过期');
        }
        if (!results.virtualAccount) {
            console.log('   - 虚拟账户功能可能需要付费计划');
            console.log('   - 检查API密钥是否有虚拟账户权限');
            console.log('   - 考虑使用其他Tatum功能实现钱包服务');
        }
        if (results.apiKey && !results.virtualAccount) {
            console.log('   - API密钥有效但虚拟账户不可用，可能是权限问题');
            console.log('   - 建议联系Tatum支持或升级计划');
        }

        return results;
    }
}

// 运行测试
async function main() {
    const tester = new TatumAPITester();
    await tester.runAllTests();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = TatumAPITester;