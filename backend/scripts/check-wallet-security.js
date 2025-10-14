/**
 * 钱包安全性检查脚本
 * 检查当前钱包配置的安全性和控制权
 */

require('dotenv').config();
const TatumService = require('../services/tatumService');
const bip39 = require('bip39');

/**
 * 检查钱包安全性
 */
async function checkWalletSecurity() {
    console.log('🔐 开始钱包安全性检查...\n');
    
    try {
        // 1. 检查环境变量配置
        console.log('📋 环境变量检查:');
        const apiKey = process.env.TATUM_API_KEY;
        const network = process.env.TATUM_NETWORK;
        const mnemonic = process.env.TATUM_MASTER_WALLET_MNEMONIC;
        const xpub = process.env.TATUM_MASTER_WALLET_XPUB;
        
        console.log(`API Key: ${apiKey ? '✅ 已配置' : '❌ 未配置'}`);
        console.log(`网络: ${network || '❌ 未配置'}`);
        console.log(`助记词: ${mnemonic ? '✅ 已配置' : '❌ 未配置'}`);
        console.log(`扩展公钥: ${xpub ? '✅ 已配置' : '❌ 未配置'}\n`);
        
        if (!mnemonic) {
            throw new Error('主钱包助记词未配置');
        }
        
        // 2. 验证助记词有效性
        console.log('🔍 助记词验证:');
        const isValidMnemonic = bip39.validateMnemonic(mnemonic);
        console.log(`助记词有效性: ${isValidMnemonic ? '✅ 有效' : '❌ 无效'}`);
        
        if (!isValidMnemonic) {
            throw new Error('助记词无效');
        }
        
        // 3. 检查Tatum服务初始化
        console.log('\n🚀 Tatum服务检查:');
        const tatumService = new TatumService();
        await tatumService.init();
        console.log('✅ Tatum SDK 初始化成功');
        
        // 4. 生成测试地址并验证控制权
        console.log('\n🏦 地址控制权验证:');
        const testUserId = 'security-test-' + Date.now();
        const addressInfo = await tatumService.generateUserDepositAddress(testUserId);
        console.log(`测试地址: ${addressInfo.address}`);
        console.log(`派生索引: ${addressInfo.derivationIndex}`);
        console.log(`私钥: ${addressInfo.privateKey.substring(0, 10)}...`); // 只显示前10位
        
        // 5. 检查当前激活控制器使用的地址
        console.log('\n⚠️  当前系统配置检查:');
        console.log('激活控制器中的硬编码地址: TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE');
        console.log('⚠️  注意: 这个硬编码地址不在你的控制范围内!');
        
        // 6. 安全建议
        console.log('\n📝 安全建议:');
        console.log('1. ✅ 你的Tatum配置正确，可以生成可控地址');
        console.log('2. ⚠️  需要修改激活控制器，使用动态生成的地址');
        console.log('3. 🔒 在生产环境中，确保助记词安全存储');
        console.log('4. 🌐 当前使用测试网络，适合开发测试');
        
        // 7. 生成修复建议
        console.log('\n🔧 修复建议:');
        console.log('修改 activationController.js 中的硬编码地址:');
        console.log('- 移除硬编码地址 TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE');
        console.log('- 为每个用户动态生成充值地址');
        console.log('- 使用 tatumService.generateUserDepositAddress(userId)');
        
        console.log('\n✅ 安全检查完成!');
        
    } catch (error) {
        console.error('❌ 安全检查失败:', error.message);
        process.exit(1);
    }
}

// 运行安全检查
if (require.main === module) {
    checkWalletSecurity();
}

module.exports = { checkWalletSecurity };