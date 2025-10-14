const realTatumWalletService = require('../services/realTatumWalletService');

async function debugAddressGeneration() {
    try {
        console.log('开始调试地址生成...');
        
        // 初始化服务
        await realTatumWalletService.initialize();
        console.log('✅ 服务初始化成功');
        
        // 测试为用户ID 21 重新生成地址
        const userId = 21;
        console.log(`\n为用户 ${userId} 生成新地址...`);
        
        // 获取下一个派生索引
        const derivationIndex = await realTatumWalletService.getNextDerivationIndex(userId);
        console.log(`派生索引: ${derivationIndex}`);
        
        // 直接调用地址生成方法
        const childWallet = realTatumWalletService.generateTronAddressFromMnemonic(
            realTatumWalletService.masterMnemonic,
            derivationIndex
        );
        
        console.log('生成的钱包信息:');
        console.log('- 地址:', childWallet.address);
        console.log('- 私钥长度:', childWallet.privateKey ? childWallet.privateKey.length : 'undefined');
        console.log('- 私钥:', childWallet.privateKey);
        
        // 验证地址格式
        if (childWallet.address && childWallet.address !== '0' && childWallet.address.startsWith('T')) {
            console.log('✅ 地址生成成功');
        } else {
            console.log('❌ 地址生成失败');
        }
        
    } catch (error) {
        console.error('调试过程中出错:', error);
    } finally {
        await realTatumWalletService.destroy();
        process.exit(0);
    }
}

debugAddressGeneration();