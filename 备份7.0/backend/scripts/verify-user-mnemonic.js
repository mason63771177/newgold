const bip39 = require('bip39');
const HDKey = require('hdkey');
const { TronWeb } = require('tronweb');

/**
 * 验证用户提供的助记词
 */
async function verifyUserMnemonic() {
    const userMnemonic = "course match choose salon fiscal enhance dilemma abstract you used weather humble";
    const expectedAddress = 'TXJhKZoXZsYY24HbNgVY8GRwNVc6L94WDx';
    const expectedPrivateKey = '7bc70610b96693ac9672c2ed0d0c23e4bc8dd9884fc469d4df7a4b8b25edeb51';
    
    console.log('🔍 验证用户提供的助记词...\n');
    console.log(`助记词: ${userMnemonic}`);
    console.log(`期望地址: ${expectedAddress}`);
    console.log(`期望私钥: ${expectedPrivateKey}\n`);
    
    // 验证助记词有效性
    const isValid = bip39.validateMnemonic(userMnemonic);
    console.log(`助记词有效性: ${isValid ? '✅ 有效' : '❌ 无效'}`);
    
    if (!isValid) {
        console.log('❌ 助记词无效，无法继续验证');
        return false;
    }
    
    try {
        // 使用标准 Tron 派生路径
        const derivationPath = "m/44'/195'/0'/0/0";
        console.log(`使用派生路径: ${derivationPath}`);
        
        const seed = await bip39.mnemonicToSeed(userMnemonic);
        const hdkey = HDKey.fromMasterSeed(seed);
        const derivedKey = hdkey.derive(derivationPath);
        
        if (!derivedKey.privateKey) {
            console.log('❌ 无法从助记词生成私钥');
            return false;
        }
        
        const privateKeyHex = derivedKey.privateKey.toString('hex');
        console.log(`生成的私钥: ${privateKeyHex}`);
        
        // 验证私钥是否匹配
        const privateKeyMatch = privateKeyHex === expectedPrivateKey;
        console.log(`私钥匹配: ${privateKeyMatch ? '✅' : '❌'}`);
        
        // 使用 TronWeb 生成地址
        const tronWeb = new TronWeb({
            fullHost: 'https://api.trongrid.io'
        });
        
        const generatedAddress = tronWeb.address.fromPrivateKey(privateKeyHex);
        console.log(`生成的地址: ${generatedAddress}`);
        
        // 验证地址是否匹配
        const addressMatch = generatedAddress === expectedAddress;
        console.log(`地址匹配: ${addressMatch ? '✅' : '❌'}`);
        
        if (privateKeyMatch && addressMatch) {
            console.log('\n🎉 验证成功！用户提供的助记词正确');
            console.log('\n📋 建议更新的环境变量:');
            console.log(`TATUM_MASTER_WALLET_MNEMONIC="${userMnemonic}"`);
            console.log(`MASTER_WALLET_MNEMONIC="${userMnemonic}"`);
            console.log(`MASTER_WALLET_ADDRESS=${expectedAddress}`);
            console.log(`PAYMENT_PRIVATE_KEY=${expectedPrivateKey}`);
            return true;
        } else {
            console.log('\n❌ 验证失败，生成的地址或私钥不匹配');
            return false;
        }
        
    } catch (error) {
        console.error('❌ 验证过程中出错:', error.message);
        return false;
    }
}

// 运行验证
verifyUserMnemonic()
    .then(success => {
        if (success) {
            console.log('\n✅ 助记词验证通过，可以更新配置');
        } else {
            console.log('\n❌ 助记词验证失败，请检查提供的信息');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ 验证脚本执行失败:', error);
        process.exit(1);
    });