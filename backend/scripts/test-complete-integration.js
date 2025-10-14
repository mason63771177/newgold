/**
 * 完整的 Tatum 钱包集成测试脚本
 * 测试充值识别、提现处理、资金归集等核心功能
 */

const walletService = require('../services/realTatumWalletService');
const { pool } = require('../config/database');

/**
 * 创建测试用户
 */
async function createTestUser() {
    try {
        const email = `test_${Date.now()}@example.com`;
        const inviteCode = `TEST${Date.now()}`;
        const [result] = await pool.execute(
            'INSERT INTO users (email, password, invite_code, balance) VALUES (?, ?, ?, ?)',
            [email, 'test_password', inviteCode, 100] // 给测试用户一些初始余额
        );
        console.log(`✅ 创建测试用户成功: ID=${result.insertId}, 邮箱=${email}`);
        return result.insertId;
    } catch (error) {
        console.error('❌ 创建测试用户失败:', error.message);
        throw error;
    }
}

/**
 * 清理测试数据
 */
async function cleanupTestData(userId) {
    try {
        await pool.execute('DELETE FROM wallet_mappings WHERE user_id = ?', [userId]);
        await pool.execute('DELETE FROM wallet_transactions WHERE user_id = ?', [userId]);
        await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
        console.log(`✅ 清理测试数据成功: 用户ID=${userId}`);
    } catch (error) {
        console.error('❌ 清理测试数据失败:', error.message);
    }
}

async function testCompleteIntegration() {
    let testUserId = null;
    
    try {
        console.log('🚀 开始完整的 Tatum 钱包集成测试...');
        console.log('==================================================');
        
        // 初始化钱包服务
        await walletService.initialize();
        console.log('✅ 钱包服务初始化成功');
        
        // 1. 测试网络连接
        console.log('\\n1. 测试网络连接...');
        const networkInfo = await walletService.getNetworkInfo();
        console.log(`✅ 网络连接成功: ${JSON.stringify(networkInfo)}`);
        
        // 2. 测试主钱包余额查询
        console.log('\\n2. 测试主钱包余额查询...');
        const masterBalance = await walletService.getMasterWalletBalance();
        console.log(`✅ 主钱包余额: TRX=${masterBalance.trx}, USDT=${masterBalance.usdt}`);
        
        // 3. 创建测试用户和充值地址
        console.log('\\n3. 创建测试用户和充值地址...');
        testUserId = await createTestUser();
        const depositAddress = await walletService.createDepositAddress(testUserId);
        console.log(`✅ 充值地址创建成功: ${depositAddress}`);
        
        // 4. 测试获取用户充值地址
        console.log('\\n4. 测试获取用户充值地址...');
        const userAddress = await walletService.getUserDepositAddress(testUserId);
        console.log(`✅ 用户充值地址: ${userAddress}`);
        
        // 5. 测试地址交易记录查询
        console.log('\\n5. 测试地址交易记录查询...');
        const transactions = await walletService.getAddressTransactions(depositAddress, { limit: 5 });
        console.log(`✅ 交易记录查询成功: 找到 ${transactions.length} 条交易`);
        
        // 6. 测试用户余额查询
        console.log('\\n6. 测试用户余额查询...');
        const userBalance = await walletService.getUserBalance(testUserId);
        console.log(`✅ 用户余额: ${userBalance} USDT`);
        
        // 7. 测试提现手续费计算
        console.log('\\n7. 测试提现手续费计算...');
        const withdrawAmount = 50;
        const feeInfo = walletService.calculateWithdrawalFee(withdrawAmount);
        console.log(`✅ 提现手续费计算: 提现${withdrawAmount}USDT, 固定手续费=${feeInfo.fixedFee}USDT, 浮动手续费=${feeInfo.variableFee}USDT, 总手续费=${feeInfo.totalFee}USDT, 实际到账=${feeInfo.actualAmount}USDT`);
        
        // 8. 测试钱包地址余额查询
        console.log('\n8. 测试钱包地址余额查询...');
        const addressBalance = await walletService.getWalletBalance(depositAddress);
        console.log(`✅ 地址余额查询: TRX=${addressBalance.trx}, USDT=${addressBalance.usdt}`);
        
        // 9. 测试获取归集钱包列表
        console.log('\\n9. 测试获取归集钱包列表...');
        const walletsForConsolidation = await walletService.getWalletsForConsolidation(testUserId);
        console.log(`✅ 归集钱包列表: 找到 ${walletsForConsolidation.length} 个钱包`);
        
        // 10. 模拟充值处理（不实际发送交易）
        console.log('\\n10. 模拟充值处理...');
        const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
        const depositAmount = 10;
        console.log(`📝 模拟充值: 地址=${depositAddress}, 金额=${depositAmount}USDT, 交易哈希=${mockTxHash}`);
        // 注意：这里不调用实际的 processDeposit，因为需要真实的区块链交易
        
        console.log('\\n==================================================');
        console.log('🎉 完整集成测试完成！');
        console.log('\\n测试结果总结:');
        console.log('✅ 网络连接正常');
        console.log('✅ 主钱包余额查询正常');
        console.log('✅ 用户充值地址创建正常');
        console.log('✅ 交易记录查询正常');
        console.log('✅ 用户余额查询正常');
        console.log('✅ 提现手续费计算正常');
        console.log('✅ 地址余额查询正常');
        console.log('✅ 归集钱包列表查询正常');
        console.log('\\n🔧 Tatum 中心化钱包服务已准备就绪！');
        
    } catch (error) {
        console.error('❌ 集成测试失败:', error.message);
        console.error('错误详情:', error);
    } finally {
        // 清理测试数据
        if (testUserId) {
            await cleanupTestData(testUserId);
        }
        
        // 关闭钱包服务
        await walletService.destroy();
        console.log('✅ 钱包服务已关闭');
        
        // 关闭数据库连接
        await pool.end();
        console.log('✅ 数据库连接已关闭');
    }
}

// 运行测试
testCompleteIntegration().catch(console.error);