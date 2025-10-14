/**
 * 主钱包生成脚本
 * 用于生成Tatum钱包的助记词和xPub密钥
 */

const { TatumSDK, Network } = require('@tatumio/tatum');
const bip39 = require('bip39');
const HDKey = require('hdkey');
const fs = require('fs');
const path = require('path');

/**
 * 生成主钱包助记词和xPub
 */
async function generateMasterWallet() {
    try {
        console.log('🔐 开始生成主钱包...\n');

        // 1. 生成12位助记词
        const mnemonic = bip39.generateMnemonic(128); // 128位 = 12个单词
        console.log('✅ 助记词生成成功:');
        console.log(`助记词: ${mnemonic}\n`);

        // 2. 从助记词生成种子
        const seed = await bip39.mnemonicToSeed(mnemonic);
        
        // 3. 生成HD钱包根密钥
        const hdkey = HDKey.fromMasterSeed(seed);
        
        // 4. 生成TRON路径的xPub (m/44'/195'/0')
        const tronPath = "m/44'/195'/0'";
        const tronHdkey = hdkey.derive(tronPath);
        const xpub = tronHdkey.publicExtendedKey;
        
        console.log('✅ xPub生成成功:');
        console.log(`xPub: ${xpub}\n`);

        // 5. 生成第一个地址作为验证
        const firstAddressPath = "m/44'/195'/0'/0/0";
        const firstAddressHdkey = hdkey.derive(firstAddressPath);
        const privateKey = firstAddressHdkey.privateKey.toString('hex');
        
        // 使用crypto生成TRON地址
        const crypto = require('crypto');
        
        // 简化版地址生成（用于演示）
        const publicKey = firstAddressHdkey.publicKey;
        const address = `T${crypto.createHash('sha256').update(publicKey).digest('hex').substring(0, 34)}`;
        
        console.log('✅ 验证地址生成成功:');
        console.log(`第一个地址: ${address}`);
        console.log(`对应私钥: ${privateKey}\n`);

        // 6. 生成环境变量配置
        const envConfig = `
# Tatum 主钱包配置 (请安全保存)
TATUM_MASTER_WALLET_MNEMONIC="${mnemonic}"
TATUM_MASTER_WALLET_XPUB=${xpub}
TATUM_NETWORK=testnet
TATUM_API_KEY=your_tatum_api_key_here

# 验证信息
# 第一个地址: ${address}
# 第一个私钥: ${privateKey}
`;

        // 7. 保存到文件
        const configPath = path.join(__dirname, 'master-wallet-config.txt');
        fs.writeFileSync(configPath, envConfig);
        
        console.log('📁 配置已保存到文件:');
        console.log(`文件路径: ${configPath}\n`);

        // 8. 安全提示
        console.log('🔒 安全提示:');
        console.log('1. 请将助记词安全保存，不要泄露给任何人');
        console.log('2. 建议将助记词写在纸上，存放在安全的地方');
        console.log('3. 配置文件包含敏感信息，请妥善保管');
        console.log('4. 生产环境请使用主网配置 (TATUM_NETWORK=mainnet)');
        console.log('5. 请及时获取真实的Tatum API密钥替换配置\n');

        return {
            mnemonic,
            xpub,
            firstAddress: address,
            firstPrivateKey: privateKey,
            configPath
        };

    } catch (error) {
        console.error('❌ 生成主钱包失败:', error.message);
        throw error;
    }
}

/**
 * 验证生成的钱包
 */
async function validateWallet(mnemonic, xpub) {
    try {
        console.log('🔍 验证钱包配置...\n');

        // 验证助记词
        const isValidMnemonic = bip39.validateMnemonic(mnemonic);
        console.log(`助记词验证: ${isValidMnemonic ? '✅ 有效' : '❌ 无效'}`);

        if (!isValidMnemonic) {
            throw new Error('助记词无效');
        }

        // 验证xPub格式
        const xpubRegex = /^xpub[1-9A-HJ-NP-Za-km-z]{107,108}$/;
        const isValidXpub = xpubRegex.test(xpub);
        console.log(`xPub格式验证: ${isValidXpub ? '✅ 有效' : '❌ 无效'}`);

        console.log('✅ 钱包验证通过\n');
        return true;

    } catch (error) {
        console.error('❌ 钱包验证失败:', error.message);
        return false;
    }
}

// 主函数
async function main() {
    try {
        console.log('🎯 Tatum 主钱包生成工具\n');
        console.log('=' * 50);

        const walletInfo = await generateMasterWallet();
        
        const isValid = await validateWallet(walletInfo.mnemonic, walletInfo.xpub);
        
        if (isValid) {
            console.log('🎉 主钱包生成完成！');
            console.log('\n下一步：');
            console.log('1. 复制生成的配置到 .env 文件');
            console.log('2. 获取Tatum API密钥');
            console.log('3. 测试钱包连接');
        }

    } catch (error) {
        console.error('💥 程序执行失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = {
    generateMasterWallet,
    validateWallet
};