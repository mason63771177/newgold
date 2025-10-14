/**
 * 创建测试钱包地址脚本
 * 用于生成Tron测试网钱包地址，申请测试USDT
 */

const { TatumSDK, Network } = require('@tatumio/tatum');
require('dotenv').config();

/**
 * 测试钱包生成器
 */
class TestWalletGenerator {
    constructor() {
        this.apiKey = process.env.TATUM_API_KEY;
        this.network = Network.TRON_SHASTA; // 使用Shasta测试网
        this.tatum = null;
    }

    /**
     * 初始化Tatum SDK
     */
    async initialize() {
        try {
            console.log('🔧 初始化Tatum SDK...');
            
            if (!this.apiKey || this.apiKey === 'your_tatum_api_key_here') {
                console.log('⚠️ 未配置真实API密钥，使用模拟模式');
                return this.generateMockWallet();
            }

            this.tatum = await TatumSDK.init({
                network: this.network,
                apiKey: {
                    v4: this.apiKey
                }
            });

            console.log('✅ Tatum SDK初始化成功');
            return true;

        } catch (error) {
            console.error('❌ Tatum SDK初始化失败:', error.message);
            return this.generateMockWallet();
        }
    }

    /**
     * 生成模拟钱包（当没有API密钥时）
     */
    generateMockWallet() {
        console.log('🎭 生成模拟测试钱包...');
        
        const mockWallet = {
            address: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE', // Shasta测试网地址
            privateKey: 'mock_private_key_for_testing',
            mnemonic: 'mock mnemonic phrase for testing purposes only'
        };

        console.log('\n📋 模拟测试钱包信息:');
        console.log(`   地址: ${mockWallet.address}`);
        console.log(`   私钥: ${mockWallet.privateKey}`);
        console.log(`   助记词: ${mockWallet.mnemonic}`);
        
        console.log('\n💡 获取测试USDT步骤:');
        console.log('1. 访问 Shasta 测试网水龙头: https://shasta.tronex.io/join/getJoinPage');
        console.log('2. 输入地址获取TRX: TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE');
        console.log('3. 访问 Nile 测试网水龙头: https://nileex.io/join/getJoinPage');
        console.log('4. 输入地址获取USDT: TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE');
        console.log('5. 每日可获取: 2000 TRX + 50000 USDT');

        return mockWallet;
    }

    /**
     * 生成真实的测试钱包
     */
    async generateRealWallet() {
        try {
            console.log('🔐 生成真实测试钱包...');
            
            // 使用Tatum生成钱包
            const wallet = await this.tatum.wallets.generateWallet();
            
            console.log('\n📋 测试钱包信息:');
            console.log(`   地址: ${wallet.address}`);
            console.log(`   私钥: ${wallet.privateKey}`);
            console.log(`   助记词: ${wallet.mnemonic}`);
            
            console.log('\n💡 获取测试USDT步骤:');
            console.log('1. 访问 Shasta 测试网水龙头: https://shasta.tronex.io/join/getJoinPage');
            console.log(`2. 输入地址获取TRX: ${wallet.address}`);
            console.log('3. 访问 Nile 测试网水龙头: https://nileex.io/join/getJoinPage');
            console.log(`4. 输入地址获取USDT: ${wallet.address}`);
            console.log('5. 每日可获取: 2000 TRX + 50000 USDT');

            return wallet;

        } catch (error) {
            console.error('❌ 生成钱包失败:', error.message);
            return this.generateMockWallet();
        }
    }

    /**
     * 运行钱包生成
     */
    async run() {
        console.log('🎯 测试钱包生成器\n');
        
        const initialized = await this.initialize();
        
        let wallet;
        if (initialized && this.tatum) {
            wallet = await this.generateRealWallet();
        } else {
            wallet = this.generateMockWallet();
        }

        console.log('\n🔒 安全提示:');
        console.log('- 这是测试钱包，仅用于测试目的');
        console.log('- 不要在主网使用这些私钥');
        console.log('- 测试完成后可以丢弃这些密钥');
        
        console.log('\n📊 下一步:');
        console.log('1. 复制钱包地址');
        console.log('2. 访问水龙头网站申请测试币');
        console.log('3. 等待交易确认');
        console.log('4. 开始测试充值流程');

        return wallet;
    }

    /**
     * 销毁SDK连接
     */
    async destroy() {
        if (this.tatum) {
            await this.tatum.destroy();
            console.log('🔧 Tatum SDK连接已关闭');
        }
    }
}

// 主函数
async function main() {
    const generator = new TestWalletGenerator();
    
    try {
        const wallet = await generator.run();
        return wallet;
    } catch (error) {
        console.error('❌ 钱包生成失败:', error);
    } finally {
        await generator.destroy();
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = TestWalletGenerator;