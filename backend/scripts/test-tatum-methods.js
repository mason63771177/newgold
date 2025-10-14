/**
 * 测试修复后的 Tatum 方法
 */

const realTatumWalletService = require('../services/realTatumWalletService');

async function testTatumMethods() {
    console.log('开始测试 Tatum 方法...\n');
    
    try {
        // 1. 测试网络信息获取
        console.log('1. 测试 getNetworkInfo...');
        try {
            const networkInfo = await realTatumWalletService.getNetworkInfo();
            console.log('✅ 网络信息获取成功:', JSON.stringify(networkInfo, null, 2));
        } catch (error) {
            console.log('❌ 网络信息获取失败:', error.message);
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // 2. 测试主钱包余额获取
        console.log('2. 测试 getMasterWalletBalance...');
        try {
            const balance = await realTatumWalletService.getMasterWalletBalance();
            console.log('✅ 主钱包余额获取成功:', JSON.stringify(balance, null, 2));
        } catch (error) {
            console.log('❌ 主钱包余额获取失败:', error.message);
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // 3. 测试地址交易获取（使用用户 ID 21 的地址）
        console.log('3. 测试 getAddressTransactions...');
        const testAddress = 'TCs5tng2fCQKM2LNgGoVaJUsQMUxeRjLkL'; // 用户 ID 21 的地址
        try {
            const transactions = await realTatumWalletService.getAddressTransactions(testAddress);
            console.log('✅ 地址交易获取成功:', JSON.stringify(transactions, null, 2));
        } catch (error) {
            console.log('❌ 地址交易获取失败:', error.message);
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // 4. 测试地址生成（使用现有用户 ID 21）
        console.log('4. 测试 createDepositAddress...');
        const existingUserId = 21;
        try {
            const address1 = await realTatumWalletService.createDepositAddress(existingUserId);
            console.log('✅ 第一次调用 - 地址生成成功:', address1);
            
            // 再次调用，应该返回相同地址
            const address2 = await realTatumWalletService.createDepositAddress(existingUserId);
            console.log('✅ 第二次调用 - 地址获取成功:', address2);
            
            // 验证一致性
            if (address1 === address2) {
                console.log('✅ 地址一致性验证通过');
            } else {
                console.log('❌ 地址一致性验证失败');
            }
        } catch (error) {
            console.log('❌ 地址生成失败:', error.message);
        }
        
    } catch (error) {
        console.error('测试过程中发生错误:', error);
    }
    
    console.log('\n测试完成！');
    process.exit(0);
}

testTatumMethods();