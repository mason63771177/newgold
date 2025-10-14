const bip39 = require('bip39');
const HDKey = require('hdkey');
const { TronWeb } = require('tronweb');

/**
 * 验证助记词是否能生成目标地址
 */
async function verifyMnemonic() {
    const targetAddress = 'TXJhKZoXZsYY24HbNgVY8GRwNVc6L94WDx';
    
    // 从 .env 文件中的两个助记词
    const mnemonics = [
        "course match choose salon fiscal enhance dilemma abstract you used weather humble", // MASTER_WALLET_MNEMONIC
        "update kid shop wheel pelican series pitch green audit vicious jacket void"  // TATUM_MASTER_WALLET_MNEMONIC
    ];
    
    // 常见的派生路径
    const derivationPaths = [
        "m/44'/195'/0'/0/0",  // Tron 标准路径
        "m/44'/195'/0'/0",    // 不带最后的 /0
        "m/44'/60'/0'/0/0",   // Ethereum 路径
        "m/44'/0'/0'/0/0",    // Bitcoin 路径
        "m/0'/0/0",           // 简化路径
        "m/0/0",              // 更简化路径
    ];
    
    console.log(`🎯 目标地址: ${targetAddress}\n`);
    
    for (let i = 0; i < mnemonics.length; i++) {
        const mnemonic = mnemonics[i];
        console.log(`📝 测试助记词 ${i + 1}: ${mnemonic}`);
        
        // 验证助记词有效性
        const isValid = bip39.validateMnemonic(mnemonic);
        console.log(`   有效性: ${isValid ? '✅' : '❌'}`);
        
        if (!isValid) {
            console.log('   跳过无效助记词\n');
            continue;
        }
        
        // 测试不同的派生路径
        for (const path of derivationPaths) {
            try {
                const seed = await bip39.mnemonicToSeed(mnemonic);
                const hdkey = HDKey.fromMasterSeed(seed);
                const derivedKey = hdkey.derive(path);
                
                if (!derivedKey.privateKey) {
                    console.log(`   路径 ${path}: ❌ 无法生成私钥`);
                    continue;
                }
                
                const privateKeyHex = derivedKey.privateKey.toString('hex');
                
                // 使用 TronWeb 生成地址
                const tronWeb = new TronWeb({
                    fullHost: 'https://api.trongrid.io'
                });
                
                const generatedAddress = tronWeb.address.fromPrivateKey(privateKeyHex);
                
                console.log(`   路径 ${path}: ${generatedAddress}`);
                
                if (generatedAddress === targetAddress) {
                    console.log(`\n🎉 找到匹配！`);
                    console.log(`助记词: ${mnemonic}`);
                    console.log(`派生路径: ${path}`);
                    console.log(`生成地址: ${generatedAddress}`);
                    console.log(`私钥: ${privateKeyHex}`);
                    
                    // 输出环境变量配置建议
                    console.log(`\n📋 建议的环境变量配置:`);
                    console.log(`TATUM_MASTER_WALLET_MNEMONIC="${mnemonic}"`);
                    console.log(`MASTER_WALLET_MNEMONIC="${mnemonic}"`);
                    console.log(`MASTER_WALLET_ADDRESS=${generatedAddress}`);
                    console.log(`PAYMENT_PRIVATE_KEY=${privateKeyHex}`);
                    
                    return {
                        mnemonic,
                        path,
                        address: generatedAddress,
                        privateKey: privateKeyHex
                    };
                }
                
            } catch (error) {
                console.log(`   路径 ${path}: ❌ 错误 - ${error.message}`);
            }
        }
        
        console.log(''); // 空行分隔
    }
    
    console.log('❌ 未找到匹配的助记词和派生路径组合');
    return null;
}

// 运行验证
verifyMnemonic()
    .then(result => {
        if (result) {
            console.log('\n✅ 验证完成，找到匹配的配置');
        } else {
            console.log('\n❌ 验证完成，未找到匹配的配置');
            console.log('\n💡 建议检查：');
            console.log('1. 目标地址是否正确');
            console.log('2. 助记词是否完整');
            console.log('3. 是否需要测试其他派生路径');
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ 验证过程中出错:', error);
        process.exit(1);
    });