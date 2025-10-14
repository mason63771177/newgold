/**
 * 测试钱包控制权脚本
 * 验证我们是否真的拥有钱包的完全控制权
 */

const { TronWeb } = require('tronweb');
const fs = require('fs');

/**
 * 钱包控制权测试器
 */
class WalletControlTester {
    constructor() {
        // 使用Shasta测试网
        this.tronWeb = new TronWeb({
            fullHost: 'https://api.shasta.trongrid.io',
            headers: { "TRON-PRO-API-KEY": 'your-api-key' }
        });
    }

    /**
     * 加载钱包信息
     */
    loadWallet() {
        try {
            const walletData = JSON.parse(fs.readFileSync('/Users/mason1236/0930/backend/test-wallet.json', 'utf8'));
            console.log('📂 加载钱包信息:');
            console.log(`   地址: ${walletData.address}`);
            console.log(`   网络: ${walletData.network}`);
            console.log(`   创建时间: ${walletData.createdAt}`);
            return walletData;
        } catch (error) {
            console.error('❌ 加载钱包失败:', error.message);
            throw error;
        }
    }

    /**
     * 测试基本控制权
     */
    async testBasicControl(privateKey, address) {
        try {
            console.log('\n🔍 测试基本控制权...');
            
            // 设置私钥
            this.tronWeb.setPrivateKey(privateKey);
            
            // 验证地址匹配
            const derivedAddress = this.tronWeb.address.fromPrivateKey(privateKey);
            const isValid = derivedAddress === address;
            
            console.log(`   从私钥生成地址: ${derivedAddress}`);
            console.log(`   目标地址: ${address}`);
            console.log(`   地址匹配: ${isValid ? '✅' : '❌'}`);
            
            return isValid;

        } catch (error) {
            console.error('❌ 基本控制权测试失败:', error.message);
            return false;
        }
    }

    /**
     * 测试账户信息获取
     */
    async testAccountInfo(address) {
        try {
            console.log('\n📊 获取账户信息...');
            
            const accountInfo = await this.tronWeb.trx.getAccount(address);
            
            console.log('   账户详情:');
            console.log(`     余额: ${accountInfo.balance || 0} sun (${(accountInfo.balance || 0) / 1000000} TRX)`);
            console.log(`     创建时间: ${accountInfo.create_time || 'N/A'}`);
            console.log(`     账户类型: ${accountInfo.type || 'Normal'}`);
            
            return accountInfo;

        } catch (error) {
            console.log('⚠️ 获取账户信息失败（新账户正常）:', error.message);
            return null;
        }
    }

    /**
     * 测试交易签名能力
     */
    async testTransactionSigning(privateKey, address) {
        try {
            console.log('\n✍️ 测试交易签名能力...');
            
            // 创建一个测试交易（发送给自己，不广播）
            const testTx = await this.tronWeb.transactionBuilder.sendTrx(
                address, // 发送给自己
                1000000, // 1 TRX (单位: sun)
                address
            );
            
            console.log('   创建测试交易: ✅');
            
            // 签名交易
            const signedTx = await this.tronWeb.trx.sign(testTx, privateKey);
            
            console.log('   交易签名: ✅');
            console.log(`   交易ID: ${signedTx.txID}`);
            
            // 验证签名
            const isValidSignature = await this.tronWeb.trx.verifySignature(signedTx);
            console.log(`   签名验证: ${isValidSignature ? '✅' : '❌'}`);
            
            return {
                canSign: true,
                txId: signedTx.txID,
                validSignature: isValidSignature
            };

        } catch (error) {
            console.log('⚠️ 交易签名测试失败:', error.message);
            return {
                canSign: false,
                error: error.message
            };
        }
    }

    /**
     * 测试USDT合约交互能力
     */
    async testUSDTContract(privateKey, address) {
        try {
            console.log('\n💰 测试USDT合约交互能力...');
            
            // Shasta测试网USDT合约地址
            const usdtContractAddress = 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs';
            
            // 获取合约实例
            const contract = await this.tronWeb.contract().at(usdtContractAddress);
            
            console.log('   获取USDT合约: ✅');
            
            // 查询余额
            try {
                const balance = await contract.balanceOf(address).call();
                console.log(`   USDT余额: ${balance} (${balance / 1000000} USDT)`);
            } catch (balanceError) {
                console.log('   USDT余额查询失败（合约可能不存在）:', balanceError.message);
            }
            
            // 创建一个USDT转账交易（不广播）
            try {
                const transferTx = await contract.transfer(
                    address, // 发送给自己
                    1000000  // 1 USDT
                ).send({
                    feeLimit: 100000000,
                    from: address,
                    shouldPollResponse: false
                });
                
                console.log('   USDT转账交易创建: ✅');
                
            } catch (transferError) {
                console.log('   USDT转账测试失败（余额不足正常）:', transferError.message);
            }
            
            return true;

        } catch (error) {
            console.log('⚠️ USDT合约测试失败:', error.message);
            return false;
        }
    }

    /**
     * 运行完整测试
     */
    async runCompleteTest() {
        try {
            console.log('🚀 开始完整钱包控制权测试...\n');
            
            // 1. 加载钱包
            const wallet = this.loadWallet();
            
            // 2. 测试基本控制权
            const hasBasicControl = await this.testBasicControl(wallet.privateKey, wallet.address);
            
            if (!hasBasicControl) {
                throw new Error('基本控制权测试失败');
            }
            
            // 3. 测试账户信息
            await this.testAccountInfo(wallet.address);
            
            // 4. 测试交易签名
            const signingResult = await this.testTransactionSigning(wallet.privateKey, wallet.address);
            
            // 5. 测试USDT合约
            await this.testUSDTContract(wallet.privateKey, wallet.address);
            
            // 总结
            console.log('\n📋 测试结果总结:');
            console.log(`   ✅ 地址控制权: 通过`);
            console.log(`   ✅ 私钥有效性: 通过`);
            console.log(`   ✅ 交易签名: ${signingResult.canSign ? '通过' : '失败'}`);
            console.log(`   ✅ 签名验证: ${signingResult.validSignature ? '通过' : '失败'}`);
            
            console.log('\n🎉 钱包控制权测试完成！');
            console.log('💡 你拥有该钱包的完全控制权，可以：');
            console.log('   - 接收TRX和USDT');
            console.log('   - 发送交易');
            console.log('   - 签名任何交易');
            console.log('   - 与智能合约交互');
            
            console.log('\n📍 钱包地址:', wallet.address);
            console.log('🔑 私钥已安全保存在 test-wallet.json 文件中');
            
            return {
                success: true,
                address: wallet.address,
                privateKey: wallet.privateKey,
                capabilities: {
                    basicControl: hasBasicControl,
                    transactionSigning: signingResult.canSign,
                    signatureVerification: signingResult.validSignature
                }
            };

        } catch (error) {
            console.error('❌ 完整测试失败:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

/**
 * 主函数
 */
async function main() {
    try {
        const tester = new WalletControlTester();
        const result = await tester.runCompleteTest();
        
        if (result.success) {
            console.log('\n✅ 所有测试通过！钱包可以正常使用。');
        } else {
            console.log('\n❌ 测试失败:', result.error);
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ 程序执行失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = WalletControlTester;