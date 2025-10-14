const realTatumWalletService = require('../services/realTatumWalletService');

async function debugCreateAddress() {
    try {
        console.log('开始调试地址创建过程...');
        
        // 初始化服务
        await realTatumWalletService.initialize();
        console.log('✅ 服务初始化成功');
        
        const userId = 21;
        console.log(`\n为用户 ${userId} 创建充值地址...`);
        
        // 步骤1: 检查现有地址
        console.log('\n步骤1: 检查现有地址');
        const existingAddress = await realTatumWalletService.getUserDepositAddress(userId);
        console.log('现有地址:', existingAddress);
        
        // 步骤2: 获取派生索引
        console.log('\n步骤2: 获取派生索引');
        const derivationIndex = await realTatumWalletService.getNextDerivationIndex(userId);
        console.log('派生索引:', derivationIndex);
        
        // 步骤3: 生成地址
        console.log('\n步骤3: 生成地址');
        const childWallet = realTatumWalletService.generateTronAddressFromMnemonic(
            realTatumWalletService.masterMnemonic,
            derivationIndex
        );
        console.log('生成的钱包:');
        console.log('- 地址:', childWallet.address);
        console.log('- 私钥长度:', childWallet.privateKey ? childWallet.privateKey.length : 'undefined');
        
        // 步骤4: 保存地址映射
        console.log('\n步骤4: 保存地址映射');
        await realTatumWalletService.saveWalletMapping(userId, childWallet.address, derivationIndex, childWallet.privateKey);
        console.log('地址映射保存完成');
        
        // 步骤5: 验证保存结果
        console.log('\n步骤5: 验证保存结果');
        const savedAddress = await realTatumWalletService.getUserDepositAddress(userId);
        console.log('数据库中保存的地址:', savedAddress);
        
        if (savedAddress && savedAddress !== '0' && savedAddress.startsWith('T')) {
            console.log('✅ 地址创建和保存成功');
        } else {
            console.log('❌ 地址创建或保存失败');
        }
        
    } catch (error) {
        console.error('调试过程中出错:', error);
        console.error('错误堆栈:', error.stack);
    } finally {
        await realTatumWalletService.destroy();
        process.exit(0);
    }
}

debugCreateAddress();