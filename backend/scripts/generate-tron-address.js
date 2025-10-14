/**
 * 生成正确格式的TRON地址
 */
const crypto = require('crypto');
const bip39 = require('bip39');
const hdkey = require('hdkey');
const secp256k1 = require('tiny-secp256k1');

// TRON地址生成函数
function generateTronAddress() {
    try {
        // 生成助记词
        const mnemonic = bip39.generateMnemonic();
        console.log('助记词:', mnemonic);
        
        // 从助记词生成种子
        const seed = bip39.mnemonicToSeedSync(mnemonic);
        
        // 生成HD钱包
        const root = hdkey.fromMasterSeed(seed);
        
        // TRON的派生路径 m/44'/195'/0'/0/0
        const child = root.derive("m/44'/195'/0'/0/0");
        const privateKey = child.privateKey;
        
        // 生成公钥
        const publicKey = secp256k1.pointFromScalar(privateKey, true);
        
        // 生成TRON地址
        const address = generateTronAddressFromPublicKey(publicKey);
        
        console.log('生成的TRON地址:', address);
        console.log('地址长度:', address.length);
        console.log('私钥:', privateKey.toString('hex'));
        
        return {
            mnemonic,
            address,
            privateKey: privateKey.toString('hex')
        };
        
    } catch (error) {
        console.error('生成地址时出错:', error);
        return null;
    }
}

// 从公钥生成TRON地址
function generateTronAddressFromPublicKey(publicKey) {
    // 移除0x04前缀（如果存在）
    const pubKeyBytes = publicKey.slice(1);
    
    // Keccak256哈希
    const hash = crypto.createHash('sha3-256').update(pubKeyBytes).digest();
    
    // 取后20字节
    const addressBytes = hash.slice(-20);
    
    // 添加TRON网络前缀 0x41
    const addressWithPrefix = Buffer.concat([Buffer.from([0x41]), addressBytes]);
    
    // Base58Check编码
    return base58CheckEncode(addressWithPrefix);
}

// Base58Check编码
function base58CheckEncode(payload) {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    
    // 双重SHA256哈希
    const hash1 = crypto.createHash('sha256').update(payload).digest();
    const hash2 = crypto.createHash('sha256').update(hash1).digest();
    
    // 取前4字节作为校验和
    const checksum = hash2.slice(0, 4);
    
    // 拼接payload和校验和
    const fullPayload = Buffer.concat([payload, checksum]);
    
    // Base58编码
    let num = BigInt('0x' + fullPayload.toString('hex'));
    let encoded = '';
    
    while (num > 0) {
        const remainder = num % 58n;
        encoded = alphabet[Number(remainder)] + encoded;
        num = num / 58n;
    }
    
    // 处理前导零
    for (let i = 0; i < fullPayload.length && fullPayload[i] === 0; i++) {
        encoded = '1' + encoded;
    }
    
    return encoded;
}

// 运行生成器
if (require.main === module) {
    console.log('🎯 TRON地址生成工具\n');
    const result = generateTronAddress();
    
    if (result) {
        console.log('\n✅ 地址生成成功！');
        console.log('📋 请将以下信息保存到安全的地方：');
        console.log('助记词:', result.mnemonic);
        console.log('地址:', result.address);
        console.log('私钥:', result.privateKey);
    } else {
        console.log('❌ 地址生成失败');
    }
}

module.exports = { generateTronAddress };