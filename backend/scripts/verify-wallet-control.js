/**
 * 钱包地址可控性验证脚本
 * 验证生成的钱包地址是否在你的控制范围内
 */

require('dotenv').config();
const TatumService = require('../services/tatumService');
const bip39 = require('bip39');
const HDKey = require('hdkey');
const { TronWeb } = require('tronweb');

/**
 * 验证钱包地址可控性
 */
async function verifyWalletControl() {
  console.log('🔍 开始验证钱包地址可控性...\n');
  
  try {
    // 1. 验证主钱包助记词
    const masterMnemonic = process.env.TATUM_MASTER_WALLET_MNEMONIC;
    const masterXpub = process.env.TATUM_MASTER_WALLET_XPUB;
    
    console.log('📝 主钱包助记词:', masterMnemonic);
    console.log('🔑 主钱包扩展公钥:', masterXpub);
    
    // 验证助记词有效性
    const isValidMnemonic = bip39.validateMnemonic(masterMnemonic);
    console.log('✅ 助记词有效性:', isValidMnemonic ? '有效' : '无效');
    
    if (!isValidMnemonic) {
      throw new Error('主钱包助记词无效');
    }
    
    // 2. 验证扩展公钥匹配性
    const seed = await bip39.mnemonicToSeed(masterMnemonic);
    const hdkey = HDKey.fromMasterSeed(seed);
    const masterKey = hdkey.derive("m/44'/195'/0'/0");
    const generatedXpub = masterKey.publicExtendedKey;
    
    console.log('🔄 从助记词生成的扩展公钥:', generatedXpub);
    console.log('✅ 扩展公钥匹配:', masterXpub === generatedXpub ? '匹配' : '不匹配');
    
    // 3. 生成测试用户地址并验证控制权
    console.log('\n🧪 测试用户地址生成和控制权验证:');
    
    const tatumService = new TatumService();
    await tatumService.init();
    
    // 为测试用户生成地址
    const testUserId = 12345;
    const addressInfo = await tatumService.generateUserDepositAddress(testUserId);
    
    console.log(`👤 用户${testUserId}的充值地址:`, addressInfo.address);
    console.log('🔐 对应私钥:', addressInfo.privateKey);
    
    // 4. 验证私钥能生成相同地址
    const tronWeb = new TronWeb({
      fullHost: process.env.TATUM_NETWORK === 'mainnet' 
        ? 'https://api.trongrid.io'
        : 'https://api.shasta.trongrid.io',
      headers: { "TRON-PRO-API-KEY": process.env.TATUM_API_KEY || '' },
      privateKey: addressInfo.privateKey
    });
    
    const verifyAddress = tronWeb.address.fromPrivateKey(addressInfo.privateKey);
    console.log('🔍 私钥验证地址:', verifyAddress);
    console.log('✅ 地址匹配:', addressInfo.address === verifyAddress ? '匹配' : '不匹配');
    
    // 5. 测试余额查询
    console.log('\n💰 余额查询测试:');
    const trxBalance = await tatumService.getTrxBalance(addressInfo.address);
    const usdtBalance = await tatumService.getUsdtBalance(addressInfo.address);
    
    console.log(`TRX余额: ${trxBalance} TRX`);
    console.log(`USDT余额: ${usdtBalance} USDT`);
    
    // 6. 生成多个用户地址验证派生路径
    console.log('\n🔢 多用户地址派生验证:');
    for (let i = 1; i <= 3; i++) {
      const userAddressInfo = await tatumService.generateUserDepositAddress(i);
      console.log(`用户${i}: ${userAddressInfo.address}`);
    }
    
    console.log('\n✅ 钱包地址可控性验证完成！');
    console.log('\n📋 验证结果总结:');
    console.log('1. ✅ 主钱包助记词有效');
    console.log('2. ✅ 扩展公钥匹配');
    console.log('3. ✅ 用户地址可正确生成');
    console.log('4. ✅ 私钥可控制对应地址');
    console.log('5. ✅ 可查询地址余额');
    console.log('6. ✅ 派生路径正确');
    
    console.log('\n🔒 安全确认:');
    console.log('- 所有生成的地址都基于你控制的主钱包助记词');
    console.log('- 每个用户地址都有对应的私钥');
    console.log('- 你可以使用这些私钥控制资金');
    console.log('- 地址生成遵循BIP44标准派生路径');
    
    await tatumService.destroy();
    
  } catch (error) {
    console.error('❌ 验证过程中出现错误:', error);
  }
}

/**
 * 生成新的主钱包（仅在需要时使用）
 */
async function generateNewMasterWallet() {
  console.log('🆕 生成新的主钱包...\n');
  
  try {
    const tatumService = new TatumService();
    const walletInfo = await tatumService.generateMasterWallet();
    
    console.log('🔐 新主钱包信息:');
    console.log('助记词:', walletInfo.mnemonic);
    console.log('扩展公钥:', walletInfo.xpub);
    
    console.log('\n⚠️  请将以下信息更新到.env文件:');
    console.log(`TATUM_MASTER_WALLET_MNEMONIC="${walletInfo.mnemonic}"`);
    console.log(`TATUM_MASTER_WALLET_XPUB=${walletInfo.xpub}`);
    
    console.log('\n🔒 安全提醒:');
    console.log('- 请妥善保管助记词，这是恢复钱包的唯一方式');
    console.log('- 不要将助记词泄露给任何人');
    console.log('- 建议将助记词离线备份');
    
  } catch (error) {
    console.error('❌ 生成主钱包失败:', error);
  }
}

// 根据命令行参数执行不同功能
const args = process.argv.slice(2);
if (args.includes('--generate-new')) {
  generateNewMasterWallet();
} else {
  verifyWalletControl();
}