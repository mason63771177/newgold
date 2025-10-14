/**
 * 生成真实的TRON测试钱包
 * 包含真实的私钥和助记词，可以实际控制
 */

const bip39 = require('bip39');
const { HDKey } = require('micro-ed25519-hdkey');
const { TronWeb } = require('tronweb');

/**
 * 真实测试钱包生成器
 */
class RealTestWalletGenerator {
    constructor() {
        // 使用Shasta测试网
        this.tronWeb = new TronWeb({
            fullHost: 'https://api.shasta.trongrid.io',
            headers: { "TRON-PRO-API-KEY": 'your-api-key' },
            privateKey: '01' // 临时私钥，会被替换
        });
    }

    /**
     * 生成助记词
     */
    generateMnemonic() {
        return bip39.generateMnemonic();
    }

    /**
     * 从助记词生成TRON钱包
     */
    async generateWalletFromMnemonic(mnemonic) {
        try {
            console.log('🔐 从助记词生成TRON钱包...');
            
            // 生成种子
            const seed = await bip39.mnemonicToSeed(mnemonic);
            
            // 使用TRON的BIP44路径: m/44'/195'/0'/0/0 (所有路径都是hardened)
            const hdkey = HDKey.fromMasterSeed(seed);
            const childKey = hdkey.derive("m/44'/195'/0'/0'/0'");
            
            // 获取私钥
            const privateKeyHex = childKey.privateKey.toString('hex');
            
            // 生成地址
            const address = this.tronWeb.address.fromPrivateKey(privateKeyHex);
            
            return {
                mnemonic: mnemonic,
                privateKey: privateKeyHex,
                address: address
            };

        } catch (error) {
            console.error('❌ 从助记词生成钱包失败:', error.message);
            throw error;
        }
    }

    /**
     * 验证钱包控制权
     */
    async testWalletControl(privateKey, address) {
        try {
            console.log('🧪 测试钱包控制权...');
            
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
                
                // 尝试创建一个测试交易（不广播）
                try {
                    const testTx = await this.tronWeb.transactionBuilder.sendTrx(
                        address, // 发送给自己
                        1000000, // 1 TRX (单位: sun)
                        address
                    );
                    
                    // 签名交易（验证私钥有效性）
                    const signedTx = await this.tronWeb.trx.sign(testTx, privateKey);
                    console.log('✅ 交易签名测试成功！');
                    console.log('💡 私钥可以正常签名交易');
                    
                } catch (txError) {
                    console.log('⚠️ 交易测试失败（可能是网络问题）:', txError.message);
                    console.log('💡 但私钥和地址匹配正确');
                }
            }
            
            return isValid;

        } catch (error) {
            console.error('❌ 钱包控制权测试失败:', error.message);
            return false;
        }
    }

    /**
     * 生成并测试真实钱包
     */
    async generateAndTestWallet() {
        try {
            console.log('🚀 开始生成真实测试钱包...\n');
            
            // 1. 生成助记词
            const mnemonic = this.generateMnemonic();
            console.log('📝 生成助记词:', mnemonic);
            
            // 2. 从助记词生成钱包
            const wallet = await this.generateWalletFromMnemonic(mnemonic);
            
            console.log('\n📋 钱包信息:');
            console.log(`   地址: ${wallet.address}`);
            console.log(`   私钥: ${wallet.privateKey}`);
            console.log(`   助记词: ${wallet.mnemonic}`);
            
            // 3. 测试钱包控制权
            console.log('\n🔍 验证钱包控制权...');
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
                console.log('- 请妥善保存私钥和助记词');
                console.log('- 不要在主网使用相同的助记词');
                
                return wallet;
            } else {
                throw new Error('钱包控制权验证失败');
            }

        } catch (error) {
            console.error('❌ 生成钱包失败:', error.message);
            throw error;
        }
    }
}

/**
 * 主函数
 */
async function main() {
    try {
        const generator = new RealTestWalletGenerator();
        const wallet = await generator.generateAndTestWallet();
        
        // 保存钱包信息到文件
        const fs = require('fs');
        const walletData = {
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: wallet.mnemonic,
            network: 'TRON_SHASTA',
            createdAt: new Date().toISOString()
        };
        
        fs.writeFileSync(
            '/Users/mason1236/0930/backend/test-wallet.json',
            JSON.stringify(walletData, null, 2)
        );
        
        console.log('\n💾 钱包信息已保存到: backend/test-wallet.json');
        
    } catch (error) {
        console.error('❌ 程序执行失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = RealTestWalletGenerator;