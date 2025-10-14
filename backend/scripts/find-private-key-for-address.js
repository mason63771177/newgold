const { TronWeb } = require('tronweb');
const bip39 = require('bip39');
const bip32 = require('bip32');

/**
 * 尝试找到能生成目标地址的私钥
 */
async function findPrivateKeyForAddress() {
    const targetAddress = 'TXJhKZoXZsYY24HbNgVY8GRwNVc6L94WDx';
    
    console.log('🔍 尝试找到能生成目标地址的私钥...\n');
    console.log(`目标地址: ${targetAddress}\n`);
    
    // 从 .env 文件中的两个助记词
    const mnemonics = [
        'course match choose salon fiscal enhance dilemma abstract you used weather humble',
        'update kid shop wheel pelican series pitch green audit vicious jacket void'
    ];
    
    // 常见的派生路径
    const derivationPaths = [
        "m/44'/195'/0'/0/0",    // TRON 标准路径
        "m/44'/195'/0'/0/1",    // 第二个地址
        "m/44'/195'/0'/0/2",    // 第三个地址
        "m/44'/195'/1'/0/0",    // 不同账户
        "m/44'/60'/0'/0/0",     // ETH 路径
        "m/44'/0'/0'/0/0",      // BTC 路径
        "m/44'/195'/0'/0",      // 无最后一级
        "m/44'/195'/0'",        // 更短路径
        "m/44'/195'",           // 最短路径
    ];
    
    try {
        const tronWeb = new TronWeb({
            fullHost: 'https://api.trongrid.io'
        });
        
        for (let i = 0; i < mnemonics.length; i++) {
            const mnemonic = mnemonics[i];
            console.log(`\n📝 测试助记词 ${i + 1}: ${mnemonic.substring(0, 20)}...`);
            
            if (!bip39.validateMnemonic(mnemonic)) {
                console.log('❌ 助记词无效');
                continue;
            }
            
            for (const path of derivationPaths) {
                try {
                    console.log(`  🔑 测试路径: ${path}`);
                    
                    // 生成种子
                    const seed = await bip39.mnemonicToSeed(mnemonic);
                    
                    // 创建 HD 节点
                    const root = bip32.fromSeed(seed);
                    
                    // 派生私钥
                    const child = root.derivePath(path);
                    const privateKey = child.privateKey.toString('hex');
                    
                    // 生成地址
                    const generatedAddress = tronWeb.address.fromPrivateKey(privateKey);
                    
                    console.log(`    生成地址: ${generatedAddress}`);
                    
                    if (generatedAddress === targetAddress) {
                        console.log('\n🎉 找到匹配的配置！');
                        console.log(`助记词: ${mnemonic}`);
                        console.log(`派生路径: ${path}`);
                        console.log(`私钥: ${privateKey}`);
                        console.log(`地址: ${generatedAddress}`);
                        
                        console.log('\n📋 建议的 .env 配置:');
                        console.log(`TATUM_MASTER_WALLET_MNEMONIC=${mnemonic}`);
                        console.log(`MASTER_WALLET_ADDRESS=${generatedAddress}`);
                        console.log(`PAYMENT_PRIVATE_KEY=${privateKey}`);
                        
                        return {
                            mnemonic,
                            path,
                            privateKey,
                            address: generatedAddress
                        };
                    }
                    
                } catch (error) {
                    console.log(`    ❌ 路径 ${path} 失败: ${error.message}`);
                }
            }
        }
        
        console.log('\n❌ 未找到匹配的助记词和路径组合');
        
        // 尝试直接使用已知的私钥验证
        console.log('\n🔍 验证已知私钥...');
        const knownPrivateKey = '7bc70610b96693ac9672c2ed0d0c23e4bc8dd9884fc469d4df7a4b8b25edeb51';
        const addressFromKnownKey = tronWeb.address.fromPrivateKey(knownPrivateKey);
        console.log(`已知私钥生成的地址: ${addressFromKnownKey}`);
        console.log(`是否匹配目标地址: ${addressFromKnownKey === targetAddress ? '✅' : '❌'}`);
        
        if (addressFromKnownKey === targetAddress) {
            console.log('\n💡 建议直接使用已知私钥配置:');
            console.log(`PAYMENT_PRIVATE_KEY=${knownPrivateKey}`);
            console.log(`MASTER_WALLET_ADDRESS=${targetAddress}`);
        }
        
        return null;
        
    } catch (error) {
        console.error('❌ 搜索过程中出错:', error.message);
        return null;
    }
}

// 运行搜索
findPrivateKeyForAddress()
    .then(result => {
        if (result) {
            console.log('\n✅ 成功找到匹配配置');
        } else {
            console.log('\n❌ 未找到匹配配置');
        }
        process.exit(result ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ 脚本执行失败:', error);
        process.exit(1);
    });