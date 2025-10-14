const realTatumWalletService = require('../services/realTatumWalletService');

async function fixUserAddress() {
    try {
        console.log('开始修复用户地址...');
        
        // 初始化服务
        await realTatumWalletService.initialize();
        console.log('✅ 服务初始化成功');
        
        const userId = 21;
        console.log(`\n修复用户 ${userId} 的充值地址...`);
        
        // 强制重新生成地址
        const newAddress = await realTatumWalletService.createDepositAddress(userId);
        console.log(`✅ 新地址生成成功: ${newAddress}`);
        
        // 验证地址是否正确保存
        const savedAddress = await realTatumWalletService.getUserDepositAddress(userId);
        console.log(`数据库中保存的地址: ${savedAddress}`);
        
        if (savedAddress && savedAddress !== '0' && savedAddress.startsWith('T')) {
            console.log('✅ 地址修复成功');
        } else {
            console.log('❌ 地址修复失败');
        }
        
    } catch (error) {
        console.error('修复过程中出错:', error);
    } finally {
        await realTatumWalletService.destroy();
        process.exit(0);
    }
}

fixUserAddress();