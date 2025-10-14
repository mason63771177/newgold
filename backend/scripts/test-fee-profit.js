/**
 * 手续费利润功能测试脚本
 * 测试提币时的手续费利润分离功能
 */

const feeProfitService = require('../services/feeProfitService');
const tatumWalletService = require('../services/tatumWalletService');

/**
 * 测试手续费计算功能
 */
async function testFeeCalculation() {
    console.log('\n🧪 测试手续费计算功能...');
    
    const testAmounts = [10, 50, 100, 500, 1000];
    
    for (const amount of testAmounts) {
        console.log(`\n💰 测试金额: ${amount} USDT`);
        
        // 客户手续费
        const customerFee = feeProfitService.calculateCustomerFee(amount);
        console.log('客户手续费:', customerFee);
        
        // 手续费利润
        const profit = feeProfitService.calculateFeeProfit(amount);
        console.log('手续费利润:', profit);
    }
}

/**
 * 测试手续费利润转账功能（模拟）
 */
async function testFeeProfitTransfer() {
    console.log('\n🧪 测试手续费利润转账功能...');
    
    const testWithdrawalId = 'test_withdrawal_' + Date.now();
    const testAmount = 100;
    const testTxHash = '0x' + Math.random().toString(16).substr(2, 64);
    
    try {
        console.log(`\n📤 模拟提币: ${testWithdrawalId}`);
        console.log(`💰 提币金额: ${testAmount} USDT`);
        console.log(`🔗 提币交易哈希: ${testTxHash}`);
        
        // 注意：这里只是测试逻辑，不会真正发送交易
        const result = await feeProfitService.transferFeeProfit(testWithdrawalId, testAmount, testTxHash);
        
        if (result.success) {
            console.log('✅ 手续费利润转账成功:', result);
        } else {
            console.log('⚠️ 无需处理手续费利润:', result.reason);
        }
        
    } catch (error) {
        console.error('❌ 手续费利润转账测试失败:', error.message);
    }
}

/**
 * 测试获取利润钱包余额
 */
async function testGetProfitWalletBalance() {
    console.log('\n🧪 测试获取利润钱包余额...');
    
    try {
        const balance = await feeProfitService.getProfitWalletBalance();
        console.log(`💰 利润钱包余额: ${balance} USDT`);
    } catch (error) {
        console.error('❌ 获取利润钱包余额失败:', error.message);
    }
}

/**
 * 测试获取手续费利润统计
 */
async function testGetFeeProfitStats() {
    console.log('\n🧪 测试获取手续费利润统计...');
    
    try {
        const stats = await feeProfitService.getFeeProfitStats();
        console.log('📊 手续费利润统计:');
        console.table(stats);
    } catch (error) {
        console.error('❌ 获取手续费利润统计失败:', error.message);
    }
}

/**
 * 测试完整的提币流程（包含手续费利润分离）
 */
async function testCompleteWithdrawalFlow() {
    console.log('\n🧪 测试完整的提币流程...');
    
    const testUserId = 'test_user_' + Date.now();
    const testToAddress = 'TTestAddress1234567890123456789012345';
    const testAmount = 100;
    
    try {
        console.log(`\n👤 用户ID: ${testUserId}`);
        console.log(`📍 目标地址: ${testToAddress}`);
        console.log(`💰 提币金额: ${testAmount} USDT`);
        
        // 注意：这里只是演示流程，实际测试需要有效的用户余额和钱包配置
        console.log('\n⚠️ 注意：这是模拟测试，不会执行真实的区块链交易');
        
        // 计算手续费
        const feeDetails = tatumWalletService.calculateWithdrawalFee(testAmount);
        console.log('📊 手续费详情:', feeDetails);
        
        // 计算利润
        const profit = feeProfitService.calculateFeeProfit(testAmount);
        console.log('💎 预期利润:', profit);
        
        console.log('\n✅ 提币流程测试完成（模拟）');
        
    } catch (error) {
        console.error('❌ 提币流程测试失败:', error.message);
    }
}

/**
 * 主测试函数
 */
async function runTests() {
    console.log('🚀 开始手续费利润功能测试...');
    console.log('=' .repeat(50));
    
    try {
        await testFeeCalculation();
        await testFeeProfitTransfer();
        await testGetProfitWalletBalance();
        await testGetFeeProfitStats();
        await testCompleteWithdrawalFlow();
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ 所有测试完成！');
        
    } catch (error) {
        console.error('\n❌ 测试过程中发生错误:', error);
    } finally {
        // 清理资源
        process.exit(0);
    }
}

// 运行测试
if (require.main === module) {
    runTests();
}

module.exports = {
    testFeeCalculation,
    testFeeProfitTransfer,
    testGetProfitWalletBalance,
    testGetFeeProfitStats,
    testCompleteWithdrawalFlow
};