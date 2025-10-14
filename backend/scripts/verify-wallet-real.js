/**
 * 真实钱包验证脚本
 * 准确测试钱包的可用性和控制权
 */

const { TronWeb } = require('tronweb');
const fs = require('fs');

/**
 * 真实钱包验证器
 */
class RealWalletVerifier {
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
            return walletData;
        } catch (error) {
            console.error('❌ 加载钱包失败:', error.message);
            throw error;
        }
    }

    /**
     * 验证私钥和地址匹配
     */
    verifyKeyAddressMatch(privateKey, address) {
        try {
            console.log('\n🔍 验证私钥和地址匹配...');
            
            const derivedAddress = this.tronWeb.address.fromPrivateKey(privateKey);
            const isMatch = derivedAddress === address;
            
            console.log(`   从私钥生成地址: ${derivedAddress}`);
            console.log(`   目标地址: ${address}`);
            console.log(`   匹配结果: ${isMatch ? '✅ 匹配' : '❌ 不匹配'}`);
            
            return isMatch;

        } catch (error) {
            console.error('❌ 验证失败:', error.message);
            return false;
        }
    }

    /**
     * 测试交易签名能力（向不同地址转账）
     */
    async testTransactionSigning(privateKey, fromAddress) {
        try {
            console.log('\n✍️ 测试交易签名能力...');
            
            // 设置私钥
            this.tronWeb.setPrivateKey(privateKey);
            
            // 使用一个不同的测试地址（TRON基金会地址）
            const testToAddress = 'TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH';
            
            // 创建转账交易（向不同地址转账）
            const transaction = await this.tronWeb.transactionBuilder.sendTrx(
                testToAddress,
                1000000, // 1 TRX
                fromAddress
            );
            
            console.log('   ✅ 交易创建成功');
            
            // 签名交易
            const signedTx = await this.tronWeb.trx.sign(transaction, privateKey);
            console.log('   ✅ 交易签名成功');
            console.log(`   交易ID: ${signedTx.txID}`);
            
            // 验证签名（检查签名是否存在）
            const hasSignature = signedTx.signature && signedTx.signature.length > 0;
            console.log(`   签名验证: ${hasSignature ? '✅ 有效' : '❌ 无效'}`);
            console.log(`   签名长度: ${signedTx.signature ? signedTx.signature.length : 0}`);
            
            return {
                success: true,
                canCreateTx: true,
                canSign: true,
                validSignature: hasSignature,
                txId: signedTx.txID
            };

        } catch (error) {
            console.error('❌ 交易签名测试失败:', error.message);
            return {
                success: false,
                error: error.message,
                canCreateTx: false,
                canSign: false,
                validSignature: false
            };
        }
    }

    /**
     * 测试消息签名能力
     */
    async testMessageSigning(privateKey) {
        try {
            console.log('\n📝 测试消息签名能力...');
            
            const message = 'Test message for wallet verification';
            
            // 签名消息
            const signature = await this.tronWeb.trx.signMessageV2(message, privateKey);
            console.log('   ✅ 消息签名成功');
            console.log(`   签名: ${signature}`);
            
            return {
                success: true,
                signature: signature
            };

        } catch (error) {
            console.error('❌ 消息签名测试失败:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 检查账户状态
     */
    async checkAccountStatus(address) {
        try {
            console.log('\n📊 检查账户状态...');
            
            const accountInfo = await this.tronWeb.trx.getAccount(address);
            
            if (accountInfo && Object.keys(accountInfo).length > 0) {
                console.log('   ✅ 账户已激活');
                console.log(`   余额: ${accountInfo.balance || 0} sun (${(accountInfo.balance || 0) / 1000000} TRX)`);
                return {
                    exists: true,
                    activated: true,
                    balance: accountInfo.balance || 0
                };
            } else {
                console.log('   ⚠️ 账户未激活（需要接收TRX来激活）');
                return {
                    exists: false,
                    activated: false,
                    balance: 0
                };
            }

        } catch (error) {
            console.log('   ⚠️ 账户不存在或未激活:', error.message);
            return {
                exists: false,
                activated: false,
                balance: 0,
                error: error.message
            };
        }
    }

    /**
     * 运行完整验证
     */
    async runCompleteVerification() {
        try {
            console.log('🚀 开始真实钱包验证...\n');
            
            // 1. 加载钱包
            const wallet = this.loadWallet();
            
            // 2. 验证私钥和地址匹配
            const keyMatch = this.verifyKeyAddressMatch(wallet.privateKey, wallet.address);
            
            if (!keyMatch) {
                throw new Error('私钥和地址不匹配！');
            }
            
            // 3. 检查账户状态
            const accountStatus = await this.checkAccountStatus(wallet.address);
            
            // 4. 测试交易签名
            const txSigningResult = await this.testTransactionSigning(wallet.privateKey, wallet.address);
            
            // 5. 测试消息签名
            const msgSigningResult = await this.testMessageSigning(wallet.privateKey);
            
            // 6. 综合评估
            console.log('\n📋 验证结果总结:');
            console.log('=====================================');
            console.log(`✅ 私钥地址匹配: ${keyMatch ? '通过' : '失败'}`);
            console.log(`${accountStatus.activated ? '✅' : '⚠️'} 账户状态: ${accountStatus.activated ? '已激活' : '未激活'}`);
            console.log(`${txSigningResult.success ? '✅' : '❌'} 交易签名: ${txSigningResult.success ? '通过' : '失败'}`);
            console.log(`${msgSigningResult.success ? '✅' : '❌'} 消息签名: ${msgSigningResult.success ? '通过' : '失败'}`);
            
            const overallSuccess = keyMatch && txSigningResult.success;
            
            console.log('\n🎯 最终结论:');
            if (overallSuccess) {
                console.log('✅ 钱包完全可用！你拥有完全控制权');
                console.log('💡 可以执行的操作:');
                console.log('   - 接收TRX和代币');
                console.log('   - 发送交易（需要先充值TRX作为手续费）');
                console.log('   - 签名任何交易和消息');
                console.log('   - 与智能合约交互');
            } else {
                console.log('❌ 钱包存在问题，不能正常使用');
                console.log('🔧 问题详情:');
                if (!keyMatch) console.log('   - 私钥和地址不匹配');
                if (!txSigningResult.success) console.log(`   - 交易签名失败: ${txSigningResult.error}`);
            }
            
            console.log('\n📍 钱包信息:');
            console.log(`   地址: ${wallet.address}`);
            console.log(`   网络: TRON Shasta 测试网`);
            console.log(`   余额: ${accountStatus.balance / 1000000} TRX`);
            
            if (!accountStatus.activated) {
                console.log('\n💡 激活账户步骤:');
                console.log('1. 访问 Shasta 水龙头: https://shasta.tronex.io/join/getJoinPage');
                console.log(`2. 输入地址获取TRX: ${wallet.address}`);
                console.log('3. 获取TRX后账户将自动激活');
            }
            
            return {
                success: overallSuccess,
                details: {
                    keyMatch,
                    accountStatus,
                    txSigning: txSigningResult,
                    msgSigning: msgSigningResult
                },
                wallet: {
                    address: wallet.address,
                    network: 'TRON_SHASTA'
                }
            };

        } catch (error) {
            console.error('❌ 验证过程失败:', error.message);
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
        const verifier = new RealWalletVerifier();
        const result = await verifier.runCompleteVerification();
        
        if (result.success) {
            console.log('\n🎉 验证完成：钱包真实有效且可用！');
            process.exit(0);
        } else {
            console.log('\n💥 验证失败：钱包存在问题！');
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

module.exports = RealWalletVerifier;