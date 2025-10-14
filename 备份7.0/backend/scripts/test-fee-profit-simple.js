/**
 * 简化的手续费利润功能测试脚本
 * 专注于测试数据库操作和基本功能
 */

const feeProfitService = require('../services/feeProfitService');
const { pool } = require('../config/database');

/**
 * 测试手续费计算
 */
async function testFeeCalculation() {
    console.log('\n🧪 测试手续费计算...');
    
    const testAmount = 100;
    const customerFee = feeProfitService.calculateCustomerFee(testAmount);
    const profitInfo = feeProfitService.calculateFeeProfit(testAmount);
    
    console.log('📊 客户手续费计算结果:', customerFee);
    console.log('💰 利润计算结果:', profitInfo);
    
    return { customerFee, profitInfo };
}

/**
 * 测试数据库插入
 */
async function testDatabaseInsert() {
    console.log('\n🧪 测试数据库插入...');
    
    const testData = {
        withdrawalId: `test_${Date.now()}`,
        originalAmount: 100,
        customerFee: 3,
        tatumFee: 1,
        profitAmount: 2,
        profitMargin: 66.67,
        profitTxHash: `0xtest_${Date.now()}`,
        status: 'completed'
    };
    
    try {
        await feeProfitService.recordFeeProfitTransfer(
            testData.withdrawalId,
            testData.originalAmount,
            testData.customerFee,
            testData.tatumFee,
            testData.profitAmount,
            testData.profitMargin,
            testData.profitTxHash,
            testData.status
        );
        
        console.log('✅ 数据库插入成功');
        
        // 验证插入的数据
        const query = 'SELECT * FROM fee_profit_records WHERE withdrawal_id = ?';
        const [rows] = await pool.execute(query, [testData.withdrawalId]);
        
        if (rows.length > 0) {
            console.log('✅ 数据验证成功:', rows[0]);
            return rows[0];
        } else {
            console.log('❌ 数据验证失败: 未找到插入的记录');
            return null;
        }
        
    } catch (error) {
        console.error('❌ 数据库插入失败:', error);
        return null;
    }
}

/**
 * 测试统计查询
 */
async function testStatsQuery() {
    console.log('\n🧪 测试统计查询...');
    
    try {
        const stats = await feeProfitService.getFeeProfitStats(30);
        console.log('📊 统计查询结果:', stats);
        return stats;
    } catch (error) {
        console.error('❌ 统计查询失败:', error);
        return null;
    }
}

/**
 * 测试完整的利润转账流程
 */
async function testCompleteFlow() {
    console.log('\n🧪 测试完整的利润转账流程...');
    
    const withdrawalId = `test_complete_${Date.now()}`;
    const amount = 100;
    const originalTxHash = `0xoriginal_${Date.now()}`;
    
    try {
        const result = await feeProfitService.transferFeeProfit(withdrawalId, amount, originalTxHash);
        console.log('💰 利润转账结果:', result);
        
        // 查询数据库记录
        const query = 'SELECT * FROM fee_profit_records WHERE withdrawal_id = ?';
        const [rows] = await pool.execute(query, [withdrawalId]);
        
        if (rows.length > 0) {
            console.log('✅ 数据库记录:', rows[0]);
        }
        
        return result;
    } catch (error) {
        console.error('❌ 完整流程测试失败:', error);
        return null;
    }
}

/**
 * 清理测试数据
 */
async function cleanupTestData() {
    console.log('\n🧹 清理测试数据...');
    
    try {
        const query = "DELETE FROM fee_profit_records WHERE withdrawal_id LIKE 'test_%'";
        const [result] = await pool.execute(query);
        console.log(`✅ 清理完成，删除了 ${result.affectedRows} 条测试记录`);
    } catch (error) {
        console.error('❌ 清理测试数据失败:', error);
    }
}

/**
 * 运行所有测试
 */
async function runTests() {
    console.log('🚀 开始手续费利润功能测试...\n');
    
    try {
        // 1. 测试手续费计算
        await testFeeCalculation();
        
        // 2. 测试数据库插入
        await testDatabaseInsert();
        
        // 3. 测试统计查询
        await testStatsQuery();
        
        // 4. 测试完整流程
        await testCompleteFlow();
        
        // 5. 清理测试数据
        await cleanupTestData();
        
        console.log('\n✅ 所有测试完成！');
        
    } catch (error) {
        console.error('\n❌ 测试过程中发生错误:', error);
    } finally {
        // 关闭数据库连接
        if (pool) {
            await pool.end();
        }
        process.exit(0);
    }
}

// 运行测试
runTests();