/**
 * Tatum虚拟钱包功能测试
 * 测试虚拟账户创建、充值监听、资金归集等功能
 */

const tatumVirtualAccountService = require('../services/tatumVirtualAccountService');
const axios = require('axios');

class VirtualWalletTester {
    constructor() {
        this.service = tatumVirtualAccountService;
        this.baseURL = 'http://localhost:3000';
    }

    /**
     * 测试创建虚拟钱包
     */
    async testCreateVirtualWallet() {
        console.log('\n=== 测试创建虚拟钱包 ===');
        
        try {
            const testUserId = 'test_user_' + Date.now();
            console.log(`测试用户ID: ${testUserId}`);
            
            // 调用API创建虚拟钱包
            const response = await axios.post(`${this.baseURL}/api/virtual-wallet/create`, {
                userId: testUserId,
                userName: `测试用户${testUserId}`
            });
            
            console.log('创建结果:', response.data);
            
            if (response.data.success) {
                console.log('✅ 虚拟钱包创建成功');
                console.log(`虚拟账户ID: ${response.data.data.virtualAccountId}`);
                console.log(`充值地址: ${response.data.data.depositAddress}`);
                return response.data.data;
            } else {
                console.log('❌ 虚拟钱包创建失败:', response.data.message);
                return null;
            }
        } catch (error) {
            console.log('❌ 测试失败:', error.message);
            return null;
        }
    }

    /**
     * 测试获取钱包信息
     */
    async testGetWalletInfo(userId) {
        console.log('\n=== 测试获取钱包信息 ===');
        
        try {
            const response = await axios.get(`${this.baseURL}/api/virtual-wallet/${userId}`);
            console.log('钱包信息:', response.data);
            
            if (response.data.success) {
                console.log('✅ 获取钱包信息成功');
                return response.data.data;
            } else {
                console.log('❌ 获取钱包信息失败:', response.data.message);
                return null;
            }
        } catch (error) {
            console.log('❌ 测试失败:', error.message);
            return null;
        }
    }

    /**
     * 测试获取钱包余额
     */
    async testGetWalletBalance(userId) {
        console.log('\n=== 测试获取钱包余额 ===');
        
        try {
            const response = await axios.get(`${this.baseURL}/api/virtual-wallet/${userId}/balance`);
            console.log('余额信息:', response.data);
            
            if (response.data.success) {
                console.log('✅ 获取余额成功');
                console.log(`USDT余额: ${response.data.data.balance} USDT`);
                return response.data.data;
            } else {
                console.log('❌ 获取余额失败:', response.data.message);
                return null;
            }
        } catch (error) {
            console.log('❌ 测试失败:', error.message);
            return null;
        }
    }

    /**
     * 测试模拟Webhook回调
     */
    async testWebhookCallback(virtualAccountId, amount = '10') {
        console.log('\n=== 测试Webhook回调 ===');
        
        try {
            // 模拟Tatum Webhook数据
            const webhookData = {
                subscriptionType: 'INCOMING_FUNGIBLE_TX',
                accountId: virtualAccountId,
                currency: 'USDT',
                amount: amount,
                blockNumber: 12345678,
                txId: '0x' + Math.random().toString(16).substr(2, 64),
                from: 'TTestFromAddress123456789012345678901234',
                to: 'TTestToAddress123456789012345678901234',
                date: Date.now(),
                reference: 'test_deposit'
            };
            
            console.log('发送Webhook数据:', webhookData);
            
            const response = await axios.post(`${this.baseURL}/api/tatum/webhook`, webhookData);
            console.log('Webhook处理结果:', response.data);
            
            if (response.data.success) {
                console.log('✅ Webhook处理成功');
                return true;
            } else {
                console.log('❌ Webhook处理失败:', response.data.message);
                return false;
            }
        } catch (error) {
            console.log('❌ 测试失败:', error.message);
            return false;
        }
    }

    /**
     * 测试资金归集
     */
    async testFundConsolidation(userId) {
        console.log('\n=== 测试资金归集 ===');
        
        try {
            const response = await axios.post(`${this.baseURL}/api/virtual-wallet/${userId}/consolidate`);
            console.log('归集结果:', response.data);
            
            if (response.data.success) {
                console.log('✅ 资金归集成功');
                return response.data.data;
            } else {
                console.log('❌ 资金归集失败:', response.data.message);
                return null;
            }
        } catch (error) {
            console.log('❌ 测试失败:', error.message);
            return null;
        }
    }

    /**
     * 测试获取充值历史
     */
    async testGetDepositHistory(userId) {
        console.log('\n=== 测试获取充值历史 ===');
        
        try {
            const response = await axios.get(`${this.baseURL}/api/virtual-wallet/${userId}/deposits`);
            console.log('充值历史:', response.data);
            
            if (response.data.success) {
                console.log('✅ 获取充值历史成功');
                console.log(`共${response.data.data.length}条充值记录`);
                return response.data.data;
            } else {
                console.log('❌ 获取充值历史失败:', response.data.message);
                return null;
            }
        } catch (error) {
            console.log('❌ 测试失败:', error.message);
            return null;
        }
    }

    /**
     * 运行完整测试流程
     */
    async runFullTest() {
        console.log('🚀 开始Tatum虚拟钱包完整测试流程');
        
        // 1. 创建虚拟钱包
        const walletData = await this.testCreateVirtualWallet();
        if (!walletData) {
            console.log('❌ 测试终止：无法创建虚拟钱包');
            return;
        }
        
        const userId = walletData.userId;
        const virtualAccountId = walletData.virtualAccountId;
        
        // 等待1秒
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 2. 获取钱包信息
        await this.testGetWalletInfo(userId);
        
        // 3. 获取钱包余额
        await this.testGetWalletBalance(userId);
        
        // 4. 模拟充值回调
        await this.testWebhookCallback(virtualAccountId, '50');
        
        // 等待2秒让回调处理完成
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 5. 再次获取余额（应该有变化）
        await this.testGetWalletBalance(userId);
        
        // 6. 获取充值历史
        await this.testGetDepositHistory(userId);
        
        // 7. 测试资金归集
        await this.testFundConsolidation(userId);
        
        console.log('\n🎉 测试流程完成！');
    }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
    const tester = new VirtualWalletTester();
    tester.runFullTest().catch(console.error);
}

module.exports = VirtualWalletTester;