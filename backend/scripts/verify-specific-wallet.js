/**
 * 验证特定钱包信息的真实有效性
 * 验证地址、私钥、公钥的匹配关系和有效性
 */

const { TronWeb } = require('tronweb');

/**
 * 特定钱包验证器
 */
class SpecificWalletVerifier {
    constructor() {
        // 使用Shasta测试网
        this.tronWeb = new TronWeb({
            fullHost: 'https://api.shasta.trongrid.io',
            headers: { "TRON-PRO-API-KEY": 'your-api-key' }
        });
    }

    /**
     * 验证钱包信息的完整性和一致性
     */
    async verifyWalletInfo(address, privateKey, publicKey) {
        console.log('🔍 开始验证钱包信息...\n');
        
        const results = {
            address: address,
            privateKey: privateKey,
            publicKey: publicKey,
            tests: {}
        };

        try {
            // 1. 验证私钥格式
            console.log('1️⃣ 验证私钥格式...');
            const isValidPrivateKeyFormat = /^[0-9A-Fa-f]{64}$/.test(privateKey);
            console.log(`   私钥格式: ${isValidPrivateKeyFormat ? '✅ 有效' : '❌ 无效'}`);
            console.log(`   私钥长度: ${privateKey.length} 字符`);
            results.tests.privateKeyFormat = isValidPrivateKeyFormat;

            // 2. 验证公钥格式
            console.log('\n2️⃣ 验证公钥格式...');
            const isValidPublicKeyFormat = /^04[0-9A-Fa-f]{128}$/.test(publicKey);
            console.log(`   公钥格式: ${isValidPublicKeyFormat ? '✅ 有效' : '❌ 无效'}`);
            console.log(`   公钥长度: ${publicKey.length} 字符`);
            results.tests.publicKeyFormat = isValidPublicKeyFormat;

            // 3. 验证地址格式
            console.log('\n3️⃣ 验证地址格式...');
            const isValidAddressFormat = this.tronWeb.isAddress(address);
            console.log(`   地址格式: ${isValidAddressFormat ? '✅ 有效' : '❌ 无效'}`);
            console.log(`   地址长度: ${address.length} 字符`);
            console.log(`   地址前缀: ${address.substring(0, 2)}`);
            results.tests.addressFormat = isValidAddressFormat;

            // 4. 验证私钥和地址的匹配关系
            console.log('\n4️⃣ 验证私钥→地址匹配...');
            try {
                const derivedAddress = this.tronWeb.address.fromPrivateKey(privateKey);
                const addressMatch = derivedAddress === address;
                console.log(`   从私钥生成地址: ${derivedAddress}`);
                console.log(`   目标地址: ${address}`);
                console.log(`   匹配结果: ${addressMatch ? '✅ 匹配' : '❌ 不匹配'}`);
                results.tests.privateKeyAddressMatch = addressMatch;
            } catch (error) {
                console.log(`   ❌ 私钥→地址验证失败: ${error.message}`);
                results.tests.privateKeyAddressMatch = false;
            }

            // 5. 验证私钥和公钥的匹配关系
            console.log('\n5️⃣ 验证私钥→公钥匹配...');
            try {
                const derivedPublicKey = this.tronWeb.address.fromPrivateKey(privateKey, true);
                const publicKeyMatch = derivedPublicKey.toLowerCase() === publicKey.toLowerCase();
                console.log(`   从私钥生成公钥: ${derivedPublicKey}`);
                console.log(`   目标公钥: ${publicKey}`);
                console.log(`   匹配结果: ${publicKeyMatch ? '✅ 匹配' : '❌ 不匹配'}`);
                results.tests.privateKeyPublicKeyMatch = publicKeyMatch;
            } catch (error) {
                console.log(`   ❌ 私钥→公钥验证失败: ${error.message}`);
                results.tests.privateKeyPublicKeyMatch = false;
            }

            // 6. 测试交易签名能力
            console.log('\n6️⃣ 测试交易签名能力...');
            try {
                this.tronWeb.setPrivateKey(privateKey);
                
                // 创建一个测试交易（向TRON基金会地址转账）
                const testToAddress = 'TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH';
                const transaction = await this.tronWeb.transactionBuilder.sendTrx(
                    testToAddress,
                    1000000, // 1 TRX
                    address
                );
                
                console.log('   ✅ 交易创建成功');
                
                // 签名交易
                const signedTx = await this.tronWeb.trx.sign(transaction, privateKey);
                const hasSignature = signedTx.signature && signedTx.signature.length > 0;
                
                console.log('   ✅ 交易签名成功');
                console.log(`   交易ID: ${signedTx.txID}`);
                console.log(`   签名验证: ${hasSignature ? '✅ 有效' : '❌ 无效'}`);
                
                results.tests.transactionSigning = hasSignature;
                results.testTransactionId = signedTx.txID;
                
            } catch (error) {
                console.log(`   ❌ 交易签名测试失败: ${error.message}`);
                results.tests.transactionSigning = false;
            }

            // 7. 测试消息签名能力
            console.log('\n7️⃣ 测试消息签名能力...');
            try {
                const testMessage = 'TRON钱包验证测试消息';
                const messageSignature = await this.tronWeb.trx.signMessageV2(testMessage, privateKey);
                
                console.log('   ✅ 消息签名成功');
                console.log(`   签名: ${messageSignature.substring(0, 20)}...`);
                
                results.tests.messageSigning = true;
                results.testMessageSignature = messageSignature;
                
            } catch (error) {
                console.log(`   ❌ 消息签名测试失败: ${error.message}`);
                results.tests.messageSigning = false;
            }

            // 8. 检查账户状态
            console.log('\n8️⃣ 检查账户状态...');
            try {
                const accountInfo = await this.tronWeb.trx.getAccount(address);
                
                if (accountInfo && Object.keys(accountInfo).length > 0) {
                    console.log('   ✅ 账户已激活');
                    console.log(`   余额: ${accountInfo.balance || 0} sun (${(accountInfo.balance || 0) / 1000000} TRX)`);
                    results.tests.accountActivated = true;
                    results.balance = accountInfo.balance || 0;
                } else {
                    console.log('   ⚠️ 账户未激活（需要接收TRX来激活）');
                    results.tests.accountActivated = false;
                    results.balance = 0;
                }
                
            } catch (error) {
                console.log(`   ⚠️ 账户状态检查失败: ${error.message}`);
                results.tests.accountActivated = false;
                results.balance = 0;
            }

            return results;

        } catch (error) {
            console.error('❌ 验证过程发生错误:', error.message);
            results.error = error.message;
            return results;
        }
    }

    /**
     * 生成验证报告
     */
    generateReport(results) {
        console.log('\n📋 验证结果总结:');
        console.log('=====================================');
        
        const tests = results.tests;
        let passedTests = 0;
        let totalTests = 0;
        
        // 统计测试结果
        for (const [testName, result] of Object.entries(tests)) {
            totalTests++;
            if (result) passedTests++;
            
            const status = result ? '✅' : '❌';
            const testDisplayName = {
                privateKeyFormat: '私钥格式验证',
                publicKeyFormat: '公钥格式验证', 
                addressFormat: '地址格式验证',
                privateKeyAddressMatch: '私钥地址匹配',
                privateKeyPublicKeyMatch: '私钥公钥匹配',
                transactionSigning: '交易签名能力',
                messageSigning: '消息签名能力',
                accountActivated: '账户激活状态'
            }[testName] || testName;
            
            console.log(`${status} ${testDisplayName}: ${result ? '通过' : '失败'}`);
        }
        
        console.log(`\n📊 测试统计: ${passedTests}/${totalTests} 项通过`);
        
        // 核心功能验证
        const coreTests = [
            'privateKeyFormat',
            'addressFormat', 
            'privateKeyAddressMatch',
            'transactionSigning'
        ];
        
        const coreTestsPassed = coreTests.every(test => tests[test]);
        
        console.log('\n🎯 最终结论:');
        if (coreTestsPassed) {
            console.log('✅ 钱包完全真实有效！');
            console.log('💡 验证要点:');
            console.log('   ✓ 私钥格式正确且有效');
            console.log('   ✓ 地址格式正确且有效');
            console.log('   ✓ 私钥能正确生成对应地址');
            console.log('   ✓ 具备完整的交易签名能力');
            console.log('   ✓ 你拥有该钱包的完全控制权');
        } else {
            console.log('❌ 钱包存在问题！');
            console.log('🔧 失败的测试:');
            coreTests.forEach(test => {
                if (!tests[test]) {
                    console.log(`   - ${test}`);
                }
            });
        }
        
        console.log('\n📍 钱包详细信息:');
        console.log(`   地址: ${results.address}`);
        console.log(`   私钥: ${results.privateKey.substring(0, 8)}...${results.privateKey.substring(-8)}`);
        console.log(`   公钥: ${results.publicKey.substring(0, 8)}...${results.publicKey.substring(-8)}`);
        console.log(`   网络: TRON Shasta 测试网`);
        console.log(`   余额: ${(results.balance || 0) / 1000000} TRX`);
        
        if (!tests.accountActivated) {
            console.log('\n💡 激活账户步骤:');
            console.log('1. 访问 Shasta 水龙头: https://shasta.tronex.io/join/getJoinPage');
            console.log(`2. 输入地址获取TRX: ${results.address}`);
            console.log('3. 获取TRX后账户将自动激活');
        }
        
        return coreTestsPassed;
    }
}

/**
 * 主函数
 */
async function main() {
    // 用户提供的钱包信息
    const walletInfo = {
        address: 'TNBAWXqecQ7mMgHz9DYviBmQsg5k7j8h2w',
        privateKey: 'D52980164A4B7A50E14E86BD80546163074549D4D3C6F5EC4610C9CA13A60ADC',
        publicKey: '043A128356EFF0876EBF0A0747B4A7DCB3879AC807D2BA8184804752A56AF6652FCD15EE9D6DEE02670BC07CF528D877A1BFE4EB23AA7090FD0453FEF9F45F0185'
    };
    
    console.log('🚀 开始验证用户提供的钱包信息...\n');
    console.log('📋 待验证信息:');
    console.log(`   地址: ${walletInfo.address}`);
    console.log(`   私钥: ${walletInfo.privateKey.substring(0, 8)}...${walletInfo.privateKey.substring(-8)}`);
    console.log(`   公钥: ${walletInfo.publicKey.substring(0, 8)}...${walletInfo.publicKey.substring(-8)}`);
    console.log('\n' + '='.repeat(50) + '\n');
    
    try {
        const verifier = new SpecificWalletVerifier();
        const results = await verifier.verifyWalletInfo(
            walletInfo.address,
            walletInfo.privateKey, 
            walletInfo.publicKey
        );
        
        const isValid = verifier.generateReport(results);
        
        if (isValid) {
            console.log('\n🎉 验证完成：钱包信息完全真实有效！');
            process.exit(0);
        } else {
            console.log('\n💥 验证失败：钱包信息存在问题！');
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

module.exports = SpecificWalletVerifier;