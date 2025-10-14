/**
 * 简化的TRON钱包生成器
 * 直接使用TronWeb生成钱包
 */

const { TronWeb } = require('tronweb');
const bip39 = require('bip39');

/**
 * 简单TRON钱包生成器
 */
class SimpleTronWallet {
    constructor() {
        // 使用Shasta测试网
        this.tronWeb = new TronWeb({
            fullHost: 'https://api.shasta.trongrid.io',
            headers: { "TRON-PRO-API-KEY": 'your-api-key' }
        });
    }

    /**
     * 生成随机钱包
     */
    async generateRandomWallet() {
        try {
            console.log('🔐 生成随机TRON钱包...');
            
            // 使用TronWeb直接生成账户
            const account = await this.tronWeb.createAccount();
            
            console.log('\n📋 钱包信息:');
            console.log(`   地址: ${account.address.base58}`);
            console.log(`   私钥: ${account.privateKey}`);
            console.log(`   公钥: ${account.publicKey}`);
            
            return {
                address: account.address.base58,
                privateKey: account.privateKey,
                publicKey: account.publicKey
            };

        } catch (error) {
            console.error('❌ 生成钱包失败:', error.message);
            throw error;
        }
    }

    /**
     * 测试钱包控制权
     */
    async testWalletControl(privateKey, address) {
        try {
            console.log('\n🧪 测试钱包控制权...');
            
            // 设置私钥
            this.tronWeb.setPrivateKey(privateKey);
            
            // 验证地址匹配
            const derivedAddress = this.tronWeb.address.fromPrivateKey(privateKey);
            const isValid = derivedAddress === address;
            
            console.log(`   生成地址: ${derivedAddress}`);
            console.log(`   目标地址: ${address}`);
            console.log(`   地址匹配: ${isValid ? '✅' : '❌'}`);
            
            if (isValid) {
                console.log('✅ 钱包控制权验证成功！');
                
                // 获取账户信息
                try {
                    const accountInfo = await this.tronWeb.trx.getAccount(address);
                    console.log('📊 账户信息:', {
                        balance: accountInfo.balance || 0,
                        createTime: accountInfo.create_time || 'N/A'
                    });
                } catch (infoError) {
                    console.log('⚠️ 获取账户信息失败（新账户正常）:', infoError.message);
                }
            }
            
            return isValid;

        } catch (error) {
            console.error('❌ 钱包控制权测试失败:', error.message);
            return false;
        }
    }

    /**
     * 生成并测试钱包
     */
    async generateAndTestWallet() {
        try {
            console.log('🚀 开始生成TRON测试钱包...\n');
            
            // 1. 生成钱包
            const wallet = await this.generateRandomWallet();
            
            // 2. 测试控制权
            const hasControl = await this.testWalletControl(wallet.privateKey, wallet.address);
            
            if (hasControl) {
                console.log('\n🎉 钱包生成成功！你拥有完全控制权');
                
                console.log('\n💡 获取测试代币步骤:');
                console.log('1. 访问 Shasta TRX 水龙头: https://shasta.tronex.io/join/getJoinPage');
                console.log(`2. 输入地址获取TRX: ${wallet.address}`);
                console.log('3. 使用 Telegram Bot 获取USDT:');
                console.log('   - 搜索 @TronFAQBot');
                console.log(`   - 发送: !shasta_usdt ${wallet.address}`);
                console.log('   - 每次可获得 5000 USDT');
                
                console.log('\n⚠️ 重要提醒:');
                console.log('- 这是测试网钱包，仅用于开发测试');
                console.log('- 请妥善保存私钥');
                console.log('- 不要在主网使用相同的私钥');
                
                return wallet;
            } else {
                throw new Error('钱包控制权验证失败');
            }

        } catch (error) {
            console.error('❌ 生成钱包失败:', error.message);
            throw error;
        }
    }

    /**
     * 从私钥恢复钱包
     */
    async recoverFromPrivateKey(privateKey) {
        try {
            console.log('🔄 从私钥恢复钱包...');
            
            const address = this.tronWeb.address.fromPrivateKey(privateKey);
            
            const wallet = {
                address: address,
                privateKey: privateKey
            };
            
            console.log('\n📋 恢复的钱包信息:');
            console.log(`   地址: ${wallet.address}`);
            console.log(`   私钥: ${wallet.privateKey}`);
            
            // 测试控制权
            const hasControl = await this.testWalletControl(privateKey, address);
            
            if (hasControl) {
                console.log('✅ 钱包恢复成功！');
                return wallet;
            } else {
                throw new Error('钱包控制权验证失败');
            }

        } catch (error) {
            console.error('❌ 钱包恢复失败:', error.message);
            throw error;
        }
    }
}

/**
 * 主函数
 */
async function main() {
    try {
        const generator = new SimpleTronWallet();
        
        // 检查是否有命令行参数（私钥）
        const privateKey = process.argv[2];
        
        let wallet;
        if (privateKey) {
            // 从私钥恢复
            wallet = await generator.recoverFromPrivateKey(privateKey);
        } else {
            // 生成新钱包
            wallet = await generator.generateAndTestWallet();
        }
        
        // 保存钱包信息到文件
        const fs = require('fs');
        const walletData = {
            address: wallet.address,
            privateKey: wallet.privateKey,
            network: 'TRON_SHASTA',
            createdAt: new Date().toISOString()
        };
        
        fs.writeFileSync(
            '/Users/mason1236/0930/backend/test-wallet.json',
            JSON.stringify(walletData, null, 2)
        );
        
        console.log('\n💾 钱包信息已保存到: backend/test-wallet.json');
        
        return wallet;
        
    } catch (error) {
        console.error('❌ 程序执行失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = SimpleTronWallet;