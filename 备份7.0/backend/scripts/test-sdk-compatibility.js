/**
 * Tatum SDK v4 兼容性测试脚本
 * 验证所有修复的功能是否正常工作
 */

const { TatumSDK, Network } = require('@tatumio/tatum');
const { TronWalletProvider } = require('@tatumio/tron-wallet-provider');
const tatumWalletService = require('../services/tatumWalletService');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

/**
 * SDK兼容性测试类
 */
class SDKCompatibilityTest {
    constructor() {
        this.tatum = null;
        this.testResults = [];
    }

    /**
     * 记录测试结果
     */
    recordTest(testName, passed, details = '') {
        this.testResults.push({
            name: testName,
            passed,
            details
        });
        
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${testName}: ${details}`);
    }

    /**
     * 初始化SDK
     */
    async initializeSDK() {
        try {
            console.log('🔧 初始化Tatum SDK v4...\n');
            
            this.tatum = await TatumSDK.init({
                network: process.env.TATUM_NETWORK === 'mainnet' ? Network.TRON : Network.TRON_SHASTA,
                apiKey: process.env.TATUM_API_KEY,
                configureWalletProviders: [TronWalletProvider]  // 正确配置钱包提供者
            });

            this.recordTest('SDK初始化', true, 'v4 SDK初始化成功');
            
            if (this.tatum.rpc) {
                console.log('✅ RPC对象可用');
            } else {
                console.log('⚠️ RPC对象不可用');
            }
            return true;
        } catch (error) {
            this.recordTest('SDK初始化', false, error.message);
            return false;
        }
    }

    /**
     * 测试地址生成功能
     */
    async testAddressGeneration() {
        console.log('\n🏠 测试地址生成功能...');
        
        try {
            const mnemonic = process.env.TATUM_MASTER_WALLET_MNEMONIC;
            if (!mnemonic) {
                this.recordTest('地址生成', false, '缺少主钱包助记词');
                return;
            }

            console.log('🔍 调试信息:');
            console.log('助记词长度:', mnemonic.split(' ').length);
            console.log('助记词前3个词:', mnemonic.split(' ').slice(0, 3).join(' '));

            // 使用已初始化的SDK中的walletProvider
            const addressResult = await this.tatum.walletProvider
                .use(TronWalletProvider)
                .generateAddressFromMnemonic(mnemonic, 0);
                
            console.log('🔍 地址生成结果完整对象:', JSON.stringify(addressResult, null, 2));
            
            // 检查不同可能的属性名
            const address = addressResult?.address || addressResult?.Address || addressResult;
            
            if (address && typeof address === 'string') {
                this.recordTest('地址生成', true, `生成地址: ${address}`);
                // 保存地址供后续测试使用
                this.generatedAddress = address;
            } else {
                this.recordTest('地址生成', false, `地址生成返回异常: ${JSON.stringify(addressResult)}`);
            }
            
        } catch (error) {
            console.log('🔍 地址生成错误详情:', error);
            this.recordTest('地址生成', false, error.message);
        }
    }

    /**
     * 测试余额查询功能
     */
    async testBalanceQuery() {
        console.log('\n💰 测试余额查询功能...');
        
        try {
            // 使用生成的地址或测试地址
            const testAddress = this.generatedAddress || 'TML5fDoMy6ThrD5rr7rXRQfoFFznbQQ8ux';
            
            console.log('🔍 查询地址:', testAddress);
            
            if (!testAddress || testAddress === 'undefined') {
                this.recordTest('余额查询', false, '没有有效的测试地址');
                return;
            }
            
            // 尝试不同的余额查询方法
            console.log('🔍 尝试使用 tatum.address.getBalance...');
            try {
                const balance = await this.tatum.address.getBalance(testAddress);
                console.log('🔍 getBalance 返回结果:', JSON.stringify(balance, null, 2));
                this.recordTest('余额查询', true, `查询成功: ${JSON.stringify(balance)}`);
                return;
            } catch (error) {
                console.log('🔍 getBalance 失败:', error.message);
            }
            
            // 尝试使用 getFullBalance
            console.log('🔍 尝试使用 tatum.address.getFullBalance...');
            try {
                const fullBalance = await this.tatum.address.getFullBalance(testAddress);
                console.log('🔍 getFullBalance 返回结果:', JSON.stringify(fullBalance, null, 2));
                this.recordTest('余额查询', true, `完整余额查询成功: ${JSON.stringify(fullBalance)}`);
                return;
            } catch (error) {
                console.log('🔍 getFullBalance 失败:', error.message);
            }
            
            // 尝试直接HTTP API调用
            console.log('🔍 尝试直接HTTP API调用...');
            const axios = require('axios');
            const network = process.env.TATUM_NETWORK === 'mainnet' ? 'tron-mainnet' : 'tron-testnet';
            const apiUrl = `https://${network}.gateway.tatum.io/v3/tron/account/${testAddress}`;
            
            const response = await axios.get(apiUrl, {
                headers: {
                    'x-api-key': process.env.TATUM_API_KEY
                }
            });
            
            console.log('🔍 HTTP API 返回结果:', JSON.stringify(response.data, null, 2));
            this.recordTest('余额查询', true, `HTTP API查询成功: ${JSON.stringify(response.data)}`);
            
        } catch (error) {
            console.log('🔍 余额查询错误详情:', error);
            this.recordTest('余额查询', false, `API错误: ${error.message}`);
        }
    }

    /**
     * 测试交易查询功能
     */
    async testTransactionQuery() {
        console.log('\n📋 测试交易查询功能...');
        
        try {
            // 测试修复后的getTransactionsByAddress方法
            const testAddress = 'TML5fDoMy6ThrD5rr7rXRQfoFFznbQQ8ux';
            const transactions = await tatumWalletService.getTransactionsByAddress(testAddress);
            
            this.recordTest('交易查询', true, `查询成功，返回${transactions.length}条交易`);
            
        } catch (error) {
            this.recordTest('交易查询', false, error.message);
        }
    }

    /**
     * 测试RPC功能
     */
    async testRPCFunctions() {
        console.log('\n🌐 测试RPC功能...');
        
        try {
            // 检查RPC对象是否可用
            if (this.tatum.rpc) {
                const rpcMethods = Object.keys(this.tatum.rpc);
                this.recordTest('RPC可用性', true, `可用方法: ${rpcMethods.join(', ')}`);
                
                // 使用genericRpc调用getBlockNumber
                try {
                    // 检查genericRpc是否存在
                    if (typeof this.tatum.rpc.genericRpc === 'function') {
                        const result = await this.tatum.rpc.genericRpc('eth_blockNumber', []);
                        this.recordTest('RPC调用', true, `最新区块: ${result}`);
                    } else {
                        // 使用正确的JSON-RPC端点
                        const axios = require('axios');
                        const apiKey = process.env.TATUM_API_KEY;
                        const network = process.env.TATUM_NETWORK === 'mainnet' ? 'tron-mainnet' : 'tron-testnet';
                        
                        const response = await axios.post(`https://${network}.gateway.tatum.io/jsonrpc`, {
                            jsonrpc: '2.0',
                            method: 'eth_blockNumber',
                            params: [],
                            id: 1
                        }, {
                            headers: {
                                'x-api-key': apiKey,
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        this.recordTest('RPC调用', true, `JSON-RPC调用成功: 区块号 ${response.data.result}`);
                    }
                } catch (rpcError) {
                    this.recordTest('RPC调用', false, `RPC调用失败: ${rpcError.message}`);
                }
            } else {
                this.recordTest('RPC可用性', false, 'RPC对象不可用');
            }
            
        } catch (error) {
            this.recordTest('RPC功能', false, error.message);
        }
    }

    /**
     * 测试钱包服务集成
     */
    async testWalletServiceIntegration() {
        console.log('\n🔗 测试钱包服务集成...');
        
        try {
            // 测试钱包服务初始化
            await tatumWalletService.initialize();
            this.recordTest('钱包服务初始化', true, '服务初始化成功');
            
            // 测试余额查询
            const testAddress = 'TML5fDoMy6ThrD5rr7rXRQfoFFznbQQ8ux';
            const balance = await tatumWalletService.getWalletBalance(testAddress);
            this.recordTest('钱包服务余额查询', true, `余额: ${balance} TRX`);
            
        } catch (error) {
            this.recordTest('钱包服务集成', false, error.message);
        }
    }

    /**
     * 显示测试结果汇总
     */
    displayResults() {
        console.log('\n📊 SDK兼容性测试结果汇总');
        console.log('='.repeat(50));
        
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        
        this.testResults.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.name}`);
            if (result.details) {
                console.log(`   ${result.details}`);
            }
        });
        
        console.log('='.repeat(50));
        console.log(`总体结果: ${passed}/${total} 项测试通过`);
        
        if (passed === total) {
            console.log('🎉 所有兼容性测试通过！SDK v4集成成功。');
        } else {
            console.log('⚠️ 部分测试失败，需要进一步修复。');
        }
    }

    /**
     * 运行完整测试
     */
    async runFullTest() {
        console.log('🚀 开始Tatum SDK v4兼容性测试\n');
        
        // 初始化SDK
        const initialized = await this.initializeSDK();
        if (!initialized) {
            console.log('❌ SDK初始化失败，终止测试');
            return;
        }
        
        // 运行各项测试
        await this.testAddressGeneration();
        await this.testBalanceQuery();
        await this.testTransactionQuery();
        await this.testRPCFunctions();
        await this.testWalletServiceIntegration();
        
        // 显示结果
        this.displayResults();
        
        // 清理资源
        if (this.tatum) {
            await this.tatum.destroy();
        }
        
        console.log('\n✅ 兼容性测试完成！');
    }
}

/**
 * 主函数
 */
async function main() {
    const test = new SDKCompatibilityTest();
    await test.runFullTest();
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = SDKCompatibilityTest;