const bip39 = require('bip39');
const { BIP32Factory } = require('bip32');
const ecc = require('tiny-secp256k1');
const { TronWeb } = require('tronweb');

const bip32 = BIP32Factory(ecc);

/**
 * 尝试不同的助记词来找到正确的地址
 */
async function findCorrectMnemonic() {
    const targetAddress = 'TXJhKZoXZsYY24HbNgVY8GRwNVc6L94WDx';
    
    // 可能的助记词列表
    const possibleMnemonics = [
        'update kid shop wheel pelican series pitch green audit vicious jacket void',
        'course match choose salon fiscal enhance dilemma abstract you used weather humble',
        // 可以添加其他可能的助记词
    ];

    const tronWeb = new TronWeb({
        fullHost: 'https://api.shasta.trongrid.io'
    });

    console.log('目标地址:', targetAddress);
    console.log('开始搜索匹配的助记词...\n');

    for (const mnemonic of possibleMnemonics) {
        console.log('测试助记词:', mnemonic);
        
        try {
            const seed = bip39.mnemonicToSeedSync(mnemonic);
            const root = bip32.fromSeed(seed);
            
            // 测试不同的派生路径和索引
            const paths = [
                "m/44'/195'/0'/0/0",
                "m/44'/195'/0'/0/1", 
                "m/44'/195'/0'/0/2",
                "m/44'/195'/1'/0/0",
                "m/44'/60'/0'/0/0",  // ETH 路径
                "m/44'/0'/0'/0/0",   // BTC 路径
            ];

            for (const path of paths) {
                const child = root.derivePath(path);
                const privateKeyHex = Buffer.from(child.privateKey).toString('hex');
                const address = tronWeb.address.fromPrivateKey(privateKeyHex);
                
                console.log(`  路径 ${path}: ${address}`);
                
                if (address === targetAddress) {
                    console.log(`\n🎉 找到匹配！`);
                    console.log(`助记词: ${mnemonic}`);
                    console.log(`派生路径: ${path}`);
                    console.log(`私钥: ${privateKeyHex}`);
                    console.log(`地址: ${address}`);
                    return;
                }
            }
            
        } catch (error) {
            console.log(`  错误: ${error.message}`);
        }
        
        console.log('');
    }
    
    console.log('❌ 未找到匹配的助记词和路径组合');
    console.log('\n建议：');
    console.log('1. 检查是否有其他助记词');
    console.log('2. 确认目标地址是否正确');
    console.log('3. 可能需要使用不同的网络（主网 vs 测试网）');
}

findCorrectMnemonic();