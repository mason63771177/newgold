/**
 * 生成测试钱包地址并提供申请测试USDT的指南
 */
require('dotenv').config();
const { TatumSDK, Network } = require('@tatumio/tatum');

async function generateTestWallet() {
  try {
    console.log('正在初始化Tatum SDK...');
    
    const tatum = await TatumSDK.init({
      network: Network.TRON_SHASTA,
      apiKey: {
        v4: process.env.TATUM_API_KEY
      }
    });
    
    console.log('正在生成测试钱包...');
    
    // 生成钱包地址
    const wallet = await tatum.wallets.generateWallet();
    
    console.log('\n=== 测试钱包信息 ===');
    console.log('地址:', wallet.address);
    console.log('私钥:', wallet.privateKey);
    console.log('助记词:', wallet.mnemonic);
    
    console.log('\n=== 申请测试USDT指南 ===');
    console.log('1. 官方水龙头: https://shasta.tronex.io/join/getJoinPage');
    console.log('2. Telegram机器人: 在TRON开发者群组中发送命令:');
    console.log('   !shasta_usdt ' + wallet.address);
    console.log('3. Discord机器人: 在#faucet频道发送命令:');
    console.log('   !shasta_usdt ' + wallet.address);
    
    console.log('\n=== 下一步操作 ===');
    console.log('1. 复制上面的地址到水龙头申请测试USDT');
    console.log('2. 等待几分钟让代币到账');
    console.log('3. 使用这个地址进行入金测试');
    
    console.log('\n=== 重要提醒 ===');
    console.log('- 这是测试网地址，仅用于测试');
    console.log('- 测试代币没有实际价值');
    console.log('- 请妥善保存私钥和助记词');
    
    await tatum.destroy();
    
    // 返回钱包信息供后续使用
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic
    };
    
  } catch (error) {
    console.error('生成钱包失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  generateTestWallet()
    .then(() => {
      console.log('\n钱包生成完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { generateTestWallet };