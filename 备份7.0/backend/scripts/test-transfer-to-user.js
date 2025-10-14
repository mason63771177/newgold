/**
 * 测试从主钱包向用户充值地址转账USDT
 * 使用真实的Tatum钱包服务进行转账
 */

const walletService = require('../services/realTatumWalletService');
require('dotenv').config();

// 用户充值地址（从注册测试中获得）
const USER_DEPOSIT_ADDRESS = 'TYeVe8dn6NEZYwUiu7GmFpF8jsP8uMTrNZ';
const TRANSFER_AMOUNT = 100; // USDT

/**
 * 主函数
 */
async function main() {
    try {
        console.log('='.repeat(60));
        console.log('🎯 开始从主钱包向用户充值地址转账测试');
        console.log('='.repeat(60));
        
        // 1. 初始化钱包服务
        console.log('🔧 初始化Tatum钱包服务...');
        await walletService.initialize();
        console.log('✅ 钱包服务初始化成功');
        
        // 2. 获取主钱包地址
        const masterWalletAddress = walletService.masterWallet.address;
        console.log(`📍 主钱包地址: ${masterWalletAddress}`);
        console.log(`📍 目标充值地址: ${USER_DEPOSIT_ADDRESS}`);
        console.log(`💰 转账金额: ${TRANSFER_AMOUNT} USDT`);
        
        console.log('\n' + '-'.repeat(40));
        
        // 3. 检查主钱包USDT余额
        console.log('💰 检查主钱包USDT余额...');
        const masterBalance = await walletService.getWalletBalance(masterWalletAddress);
        console.log(`主钱包USDT余额: ${masterBalance.usdt} USDT`);
        
        if (parseFloat(masterBalance.usdt) < TRANSFER_AMOUNT) {
            throw new Error(`主钱包USDT余额不足: ${masterBalance.usdt} < ${TRANSFER_AMOUNT}`);
        }
        
        console.log('\n' + '-'.repeat(40));
        
        // 4. 检查目标地址初始余额
        console.log('🔍 检查目标地址初始余额...');
        const initialBalance = await walletService.getWalletBalance(USER_DEPOSIT_ADDRESS);
        console.log(`目标地址初始USDT余额: ${initialBalance.usdt} USDT`);
        
        console.log('\n' + '-'.repeat(40));
        
        // 5. 执行转账
        console.log('🚀 开始执行USDT转账...');
        const masterPrivateKey = await walletService.getMasterWalletPrivateKey();
        const txResult = await walletService.sendUSDT(
            masterPrivateKey,
            USER_DEPOSIT_ADDRESS,
            TRANSFER_AMOUNT
        );
        
        console.log('✅ 转账交易已提交!');
        console.log(`交易哈希: ${txResult.txId}`);
        
        console.log('\n' + '-'.repeat(40));
        
        // 6. 等待交易确认
        console.log('⏳ 等待交易确认...');
        let confirmations = 0;
        let maxWaitTime = 60; // 最多等待60秒
        let waitTime = 0;
        
        while (confirmations === 0 && waitTime < maxWaitTime) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // 等待5秒
            waitTime += 5;
            
            try {
                const txStatus = await walletService.getTransactionStatus(txResult.txId);
                if (txStatus && txStatus.confirmed) {
                    confirmations = 1;
                    console.log('✅ 交易已确认!');
                } else {
                    console.log(`⏳ 等待确认中... (${waitTime}s)`);
                }
            } catch (error) {
                console.log(`⏳ 检查交易状态中... (${waitTime}s)`);
            }
        }
        
        console.log('\n' + '-'.repeat(40));
        
        // 7. 检查转账后余额
        console.log('💰 检查转账后余额...');
        const finalBalance = await walletService.getWalletBalance(USER_DEPOSIT_ADDRESS);
        console.log(`目标地址最终USDT余额: ${finalBalance.usdt} USDT`);
        
        const balanceIncrease = parseFloat(finalBalance.usdt) - parseFloat(initialBalance.usdt);
        console.log(`余额增加: ${balanceIncrease} USDT`);
        
        console.log('\n' + '='.repeat(60));
        console.log('📋 转账测试结果汇总:');
        console.log('='.repeat(60));
        console.log(`主钱包地址: ${masterWalletAddress}`);
        console.log(`目标充值地址: ${USER_DEPOSIT_ADDRESS}`);
        console.log(`转账金额: ${TRANSFER_AMOUNT} USDT`);
        console.log(`交易哈希: ${txResult.txId}`);
        console.log(`初始余额: ${initialBalance.usdt} USDT`);
        console.log(`最终余额: ${finalBalance.usdt} USDT`);
        console.log(`余额增加: ${balanceIncrease} USDT`);
        console.log(`交易状态: ${confirmations > 0 ? '已确认' : '待确认'}`);
        console.log('='.repeat(60));
        
        // 保存测试结果
        const testResult = {
            masterWalletAddress,
            targetAddress: USER_DEPOSIT_ADDRESS,
            transferAmount: TRANSFER_AMOUNT,
            txHash: txResult.txId,
            initialBalance: initialBalance.usdt,
            finalBalance: finalBalance.usdt,
            balanceIncrease,
            confirmed: confirmations > 0,
            timestamp: new Date().toISOString()
        };
        
        const fs = require('fs');
        fs.writeFileSync('test-transfer-result.json', JSON.stringify(testResult, null, 2));
        console.log('\n💾 转账测试结果已保存到: test-transfer-result.json');
        
        return testResult;
        
    } catch (error) {
        console.error('\n💥 转账测试失败:', error.message);
        throw error;
    } finally {
        if (walletService) {
            await walletService.destroy();
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main().then(result => {
        console.log('\n✅ 转账测试完成!');
        process.exit(0);
    }).catch(error => {
        console.error('\n❌ 转账测试失败:', error.message);
        process.exit(1);
    });
}

module.exports = { main };