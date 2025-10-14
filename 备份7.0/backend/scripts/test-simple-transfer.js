/**
 * 简单的USDT转账测试脚本
 * 使用现有的钱包服务进行转账
 */

const walletService = require('../services/realTatumWalletService');

async function testSimpleTransfer() {
    try {
        console.log('🚀 开始执行简单转账测试...');
        
        // 初始化钱包服务
        await walletService.initialize();
        
        // 转账参数
        const toAddress = 'TYeVe8dn6NEZYwUiu7GmFpF8jsP8uMTrNZ'; // 新用户的充值地址
        const amount = 100; // 100 USDT
        
        console.log(`📤 目标地址: ${toAddress}`);
        console.log(`💰 转账金额: ${amount} USDT`);
        
        // 获取主钱包私钥
        const privateKey = await walletService.getMasterWalletPrivateKey();
        console.log('🔑 已获取主钱包私钥');
        
        // 检查主钱包余额
        console.log('\n🔍 检查主钱包余额...');
        const balance = await walletService.getMasterWalletBalance();
        console.log('主钱包余额:', JSON.stringify(balance, null, 2));
        
        if (parseFloat(balance.usdt) < amount) {
            throw new Error(`主钱包USDT余额不足: ${balance.usdt} < ${amount}`);
        }
        
        // 执行转账
        console.log('\n💸 执行转账...');
        const txHash = await walletService.sendUSDT(privateKey, toAddress, amount);
        
        console.log('\n✅ 转账成功!');
        console.log('Transaction Hash:', txHash);
        
        // 等待一段时间让交易确认
        console.log('\n⏳ 等待交易确认...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        console.log('🎉 转账测试完成!');
        
    } catch (error) {
        console.error('❌ 转账测试失败:', error.message);
        console.error('详细错误:', error);
    } finally {
        // 清理资源
        await walletService.destroy();
        process.exit(0);
    }
}

testSimpleTransfer();