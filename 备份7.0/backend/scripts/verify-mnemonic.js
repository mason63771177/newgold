const bip39 = require('bip39');
const { BIP32Factory } = require('bip32');
const ecc = require('tiny-secp256k1');
const { TronWeb } = require('tronweb');

/**
 * 验证助记词和地址的对应关系
 */
async function verifyMnemonic() {
    try {
        const bip32 = BIP32Factory(ecc);
        const mnemonic = 'update kid shop wheel pelican series pitch green audit vicious jacket void';

        console.log('助记词:', mnemonic);

        // 生成种子
        const seed = bip39.mnemonicToSeedSync(mnemonic);
        console.log('种子长度:', seed.length);

        // 生成根密钥
        const root = bip32.fromSeed(seed);
        
        // 派生路径 m/44'/195'/0'/0/0 (TRON 标准路径)
        const child = root.derivePath("m/44'/195'/0'/0/0");
        const privateKeyBuffer = child.privateKey;
        
        // 确保私钥是正确的十六进制格式
        const privateKeyHex = Buffer.from(privateKeyBuffer).toString('hex');

        console.log('私钥 Buffer:', privateKeyBuffer);
        console.log('私钥 (hex):', privateKeyHex);

        // 创建 TronWeb 实例
        const tronWeb = new TronWeb({
            fullHost: 'https://api.shasta.trongrid.io'
        });

        // 从私钥生成地址
        const address = tronWeb.address.fromPrivateKey(privateKeyHex);
        console.log('生成的地址:', address);
        console.log('期望的地址: TXJhKZoXZsYY24HbNgVY8GRwNVc6L94WDx');
        console.log('地址匹配:', address === 'TXJhKZoXZsYY24HbNgVY8GRwNVc6L94WDx');

        if (address === 'TXJhKZoXZsYY24HbNgVY8GRwNVc6L94WDx') {
            console.log('✅ 助记词和地址匹配正确！');
        } else {
            console.log('❌ 助记词和地址不匹配！');
            console.log('可能的原因：');
            console.log('1. 助记词不正确');
            console.log('2. 派生路径不正确');
            console.log('3. 网络环境不同（主网 vs 测试网）');
        }

    } catch (error) {
        console.error('验证过程中出错:', error.message);
    }
}

verifyMnemonic();