const walletService = require('../services/realTatumWalletService');

/**
 * 检查钱包服务实际使用的主钱包地址
 */
async function checkWalletServiceAddress() {
    try {
        console.log('初始化钱包服务...');
        await walletService.initialize();

        console.log('主钱包信息:');
        console.log('地址:', walletService.masterWallet.address);
        console.log('私钥存在:', !!walletService.masterWallet.privateKey);
        
        // 检查余额
        console.log('\n检查余额...');
        const balance = await walletService.getWalletBalance(walletService.masterWallet.address);
        console.log('TRX 余额:', balance.trx);
        console.log('USDT 余额:', balance.usdt);

        // 检查配置中的地址
        console.log('\n配置信息:');
        console.log('助记词:', process.env.TATUM_MASTER_WALLET_MNEMONIC);
        console.log('XPUB:', process.env.TATUM_MASTER_WALLET_XPUB);

    } catch (error) {
        console.error('检查过程中出错:', error.message);
    } finally {
        await walletService.destroy();
    }
}

checkWalletServiceAddress();