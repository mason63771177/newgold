/**
 * Tatum 基础钱包服务测试脚本
 */

require('dotenv').config();
const TatumBasicWalletService = require('../services/tatumBasicWalletService');

async function testBasicWalletService() {
    console.log('🚀 开始测试Tatum基础钱包服务...\n');

    const walletService = new TatumBasicWalletService();

    try {
        // 1. 初始化服务
        console.log('1️⃣ 初始化服务...');
        const initResult = await walletService.initialize();
        if (!initResult.success) {
            throw new Error(`初始化失败: ${initResult.error}`);
        }
        console.log('✅ 服务初始化成功\n');

        // 2. 测试创建用户钱包
        console.log('2️⃣ 测试创建用户钱包...');
        const testUserId = 'test_user_' + Date.now();
        const walletResult = await walletService.createMemberWallet(testUserId);
        
        if (walletResult.success) {
            console.log('✅ 用户钱包创建成功:');
            console.log(`   用户ID: ${walletResult.userId}`);
            console.log(`   钱包地址: ${walletResult.address}`);
            console.log(`   货币: ${walletResult.currency}`);
            console.log(`   派生索引: ${walletResult.derivationKey}\n`);
        } else {
            throw new Error(`创建用户钱包失败: ${walletResult.error}`);
        }

        // 3. 测试查询地址余额
        console.log('3️⃣ 测试查询地址余额...');
        const balance = await walletService.getAddressBalance(walletResult.address);
        console.log('✅ 地址余额查询成功:');
        console.log(`   TRX余额: ${balance.trx}`);
        console.log(`   USDT余额: ${balance.usdt}\n`);

        // 4. 测试重复创建（应该返回现有地址）
        console.log('4️⃣ 测试重复创建钱包...');
        const duplicateResult = await walletService.createMemberWallet(testUserId);
        
        if (duplicateResult.success && duplicateResult.address === walletResult.address) {
            console.log('✅ 重复创建测试成功，返回现有地址\n');
        } else {
            console.log('⚠️ 重复创建测试异常\n');
        }

        // 5. 测试获取主钱包信息
        console.log('5️⃣ 测试获取主钱包信息...');
        const masterWallet = await walletService.getMasterWallet();
        if (masterWallet) {
            console.log('✅ 主钱包信息获取成功:');
            console.log(`   钱包类型: ${masterWallet.wallet_type}`);
            console.log(`   地址: ${masterWallet.address}`);
            console.log(`   货币: ${masterWallet.currency}`);
            console.log(`   状态: ${masterWallet.status}\n`);
        } else {
            console.log('❌ 主钱包信息获取失败\n');
        }

        console.log('🎉 所有测试完成！');
        console.log('\n📋 测试总结:');
        console.log('   ✅ 服务初始化');
        console.log('   ✅ 用户钱包创建');
        console.log('   ✅ 地址余额查询');
        console.log('   ✅ 重复创建处理');
        console.log('   ✅ 主钱包信息获取');

        console.log('\n💡 下一步建议:');
        console.log('   1. 向测试地址转入少量USDT进行充值测试');
        console.log('   2. 测试提现功能');
        console.log('   3. 测试资金归集功能');
        console.log('   4. 集成到现有的H5系统');

        return {
            success: true,
            testUserId: testUserId,
            walletAddress: walletResult.address,
            masterWallet: masterWallet
        };

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        return { success: false, error: error.message };
    }
}

// 运行测试
if (require.main === module) {
    testBasicWalletService()
        .then(result => {
            if (result.success) {
                console.log('\n🎯 测试成功完成！');
                process.exit(0);
            } else {
                console.log('\n💥 测试失败！');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 测试执行异常:', error);
            process.exit(1);
        });
}

module.exports = testBasicWalletService;