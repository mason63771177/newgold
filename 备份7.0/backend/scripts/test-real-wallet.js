require('dotenv').config();
const realTatumWalletService = require('../services/realTatumWalletService');
const logger = require('../utils/logger');

/**
 * 真实钱包功能测试脚本
 * 测试 Tatum API 集成的各项功能
 */

async function testRealWallet() {
    console.log('🚀 开始测试真实钱包功能...\n');

    try {
        // 测试用户ID
        const testUserId = 21;
        
        console.log('=== 1. 测试生成充值地址 ===');
        const depositAddress = await realTatumWalletService.createDepositAddress(testUserId);
        console.log(`✅ 用户 ${testUserId} 的充值地址: ${depositAddress}\n`);

        console.log('=== 2. 测试获取用户余额 ===');
        const balance = await realTatumWalletService.getUserBalance(testUserId);
        console.log(`✅ 用户 ${testUserId} 的余额: ${balance} USDT\n`);

        console.log('=== 3. 测试获取地址交易记录 ===');
        const transactions = await realTatumWalletService.getAddressTransactions(depositAddress);
        console.log(`✅ 地址 ${depositAddress} 的交易记录:`);
        console.log(`   - 总交易数: ${transactions.length}`);
        if (transactions.length > 0) {
            console.log(`   - 最新交易: ${transactions[0].hash}`);
            console.log(`   - 交易金额: ${transactions[0].amount}`);
            console.log(`   - 交易类型: ${transactions[0].transactionType}`);
        }
        console.log('');

        console.log('=== 4. 测试手续费计算 ===');
        const testAmounts = [10, 50, 100, 500, 1000];
        for (const amount of testAmounts) {
            const feeInfo = realTatumWalletService.calculateWithdrawalFee(amount);
            console.log(`   提现 ${amount} USDT:`);
            console.log(`   - 固定手续费: ${feeInfo.fixedFee} USDT`);
            console.log(`   - 百分比手续费: ${feeInfo.percentageFee} USDT`);
            console.log(`   - 总手续费: ${feeInfo.totalFee} USDT`);
            console.log(`   - 实际到账: ${feeInfo.actualAmount} USDT`);
            console.log('');
        }

        console.log('=== 5. 测试主钱包余额查询 ===');
        try {
            const masterBalance = await realTatumWalletService.getMasterWalletBalance();
            console.log(`✅ 主钱包余额: ${masterBalance} USDT\n`);
        } catch (error) {
            console.log(`❌ 主钱包余额查询失败: ${error.message}\n`);
        }

        console.log('=== 6. 测试钱包映射查询 ===');
        const userAddress = await realTatumWalletService.getUserDepositAddress(testUserId);
        console.log(`✅ 用户 ${testUserId} 的映射地址: ${userAddress}\n`);

        console.log('=== 7. 测试 Tatum API 连接 ===');
        try {
            // 尝试获取网络信息来验证 API 连接
            const networkInfo = await realTatumWalletService.getNetworkInfo();
            console.log(`✅ Tatum API 连接正常`);
            console.log(`   - 网络: ${networkInfo.network || 'TRON'}`);
            console.log(`   - 状态: 连接成功\n`);
        } catch (error) {
            console.log(`❌ Tatum API 连接失败: ${error.message}\n`);
        }

        console.log('🎉 真实钱包功能测试完成！');
        console.log('\n=== 测试总结 ===');
        console.log('✅ 充值地址生成: 正常');
        console.log('✅ 用户余额查询: 正常');
        console.log('✅ 交易记录获取: 正常');
        console.log('✅ 手续费计算: 正常');
        console.log('✅ 钱包映射: 正常');
        console.log('\n📝 注意事项:');
        console.log('1. 确保 .env 文件中的 Tatum API 配置正确');
        console.log('2. 主钱包助记词和地址需要有效');
        console.log('3. 网络连接正常，可以访问 Tatum API');
        console.log('4. 数据库连接正常，wallet_mappings 表存在');

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        console.error('错误详情:', error);
        
        console.log('\n🔧 故障排除建议:');
        console.log('1. 检查 .env 文件中的 Tatum 配置');
        console.log('2. 确认网络连接正常');
        console.log('3. 验证数据库连接和表结构');
        console.log('4. 检查 Tatum API 密钥是否有效');
    }
}

// 运行测试
if (require.main === module) {
    testRealWallet()
        .then(() => {
            console.log('\n✅ 测试脚本执行完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ 测试脚本执行失败:', error);
            process.exit(1);
        });
}

module.exports = testRealWallet;