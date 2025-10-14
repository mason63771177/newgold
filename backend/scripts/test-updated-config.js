const { TronWeb } = require('tronweb');
require('dotenv').config();

/**
 * 测试更新后的配置
 */
async function testUpdatedConfig() {
    console.log('🔧 测试更新后的配置...\n');
    
    // 从环境变量读取配置
    const masterWalletMnemonic = process.env.MASTER_WALLET_MNEMONIC;
    const masterWalletAddress = process.env.MASTER_WALLET_ADDRESS;
    const tatumMasterWalletMnemonic = process.env.TATUM_MASTER_WALLET_MNEMONIC;
    const paymentPrivateKey = process.env.PAYMENT_PRIVATE_KEY;
    
    console.log('📋 当前配置:');
    console.log(`MASTER_WALLET_MNEMONIC: ${masterWalletMnemonic}`);
    console.log(`MASTER_WALLET_ADDRESS: ${masterWalletAddress}`);
    console.log(`TATUM_MASTER_WALLET_MNEMONIC: ${tatumMasterWalletMnemonic}`);
    console.log(`PAYMENT_PRIVATE_KEY: ${paymentPrivateKey}`);
    
    try {
        const tronWeb = new TronWeb({
            fullHost: 'https://api.trongrid.io'
        });
        
        // 验证私钥生成的地址
        console.log('\n🔍 验证私钥生成的地址...');
        const addressFromPrivateKey = tronWeb.address.fromPrivateKey(paymentPrivateKey);
        console.log(`私钥生成的地址: ${addressFromPrivateKey}`);
        console.log(`配置的主钱包地址: ${masterWalletAddress}`);
        console.log(`地址匹配: ${addressFromPrivateKey === masterWalletAddress ? '✅' : '❌'}`);
        
        // 检查主钱包余额
        console.log('\n💰 检查主钱包余额...');
        const trxBalance = await tronWeb.trx.getBalance(masterWalletAddress);
        console.log(`TRX 余额: ${tronWeb.fromSun(trxBalance)} TRX`);
        
        // 检查 USDT 余额
        const usdtContractAddress = process.env.USDT_CONTRACT_ADDRESS || 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs';
        try {
            const contract = await tronWeb.contract().at(usdtContractAddress);
            const usdtBalance = await contract.balanceOf(masterWalletAddress).call();
            const usdtBalanceFormatted = tronWeb.toBigNumber(usdtBalance).dividedBy(1000000).toNumber();
            console.log(`USDT 余额: ${usdtBalanceFormatted} USDT`);
        } catch (error) {
            console.log(`USDT 余额查询失败: ${error.message}`);
        }
        
        // 验证助记词一致性
        console.log('\n🔍 验证助记词一致性...');
        console.log(`MASTER_WALLET_MNEMONIC === TATUM_MASTER_WALLET_MNEMONIC: ${masterWalletMnemonic === tatumMasterWalletMnemonic ? '✅' : '❌'}`);
        
        if (addressFromPrivateKey === masterWalletAddress) {
            console.log('\n✅ 配置验证成功！');
            console.log('- 私钥能正确生成主钱包地址');
            console.log('- 可以开始使用钱包服务');
            
            // 检查是否需要转移资金
            const oldFundedAddress = 'TXJhKZoXZsYY24HbNgVY8GRwNVc6L94WDx';
            if (masterWalletAddress !== oldFundedAddress) {
                console.log('\n⚠️  注意: 需要将资金从旧地址转移到新地址');
                console.log(`旧地址 (有5000 USDT): ${oldFundedAddress}`);
                console.log(`新地址 (当前主钱包): ${masterWalletAddress}`);
                console.log('请确保有旧地址的私钥来进行资金转移');
            }
        } else {
            console.log('\n❌ 配置验证失败！');
            console.log('私钥无法生成配置的主钱包地址');
        }
        
    } catch (error) {
        console.error('❌ 配置测试失败:', error.message);
    }
}

// 运行测试
testUpdatedConfig()
    .then(() => {
        console.log('\n✅ 配置测试完成');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ 脚本执行失败:', error);
        process.exit(1);
    });