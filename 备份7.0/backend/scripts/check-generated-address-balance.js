const { TronWeb } = require('tronweb');

/**
 * 检查生成地址的余额
 */
async function checkGeneratedAddressBalance() {
    const generatedAddress = 'TPRyvdMdisT45XgCHmySiUtvUTeaVzP3zb';
    const targetAddress = 'TXJhKZoXZsYY24HbNgVY8GRwNVc6L94WDx';
    const usdtContractAddress = 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs';
    
    console.log('🔍 检查地址余额...\n');
    
    try {
        const tronWeb = new TronWeb({
            fullHost: 'https://api.trongrid.io'
        });
        
        // 检查生成地址的 TRX 余额
        console.log(`📍 检查地址: ${generatedAddress}`);
        const trxBalance = await tronWeb.trx.getBalance(generatedAddress);
        console.log(`TRX 余额: ${tronWeb.fromSun(trxBalance)} TRX`);
        
        // 检查生成地址的 USDT 余额
        try {
            const contract = await tronWeb.contract().at(usdtContractAddress);
            const usdtBalance = await contract.balanceOf(generatedAddress).call();
            const usdtBalanceFormatted = tronWeb.toBigNumber(usdtBalance).dividedBy(1000000).toNumber();
            console.log(`USDT 余额: ${usdtBalanceFormatted} USDT`);
        } catch (error) {
            console.log(`USDT 余额查询失败: ${error.message}`);
        }
        
        console.log('\n📍 对比目标地址: ' + targetAddress);
        
        // 检查目标地址的 TRX 余额
        const targetTrxBalance = await tronWeb.trx.getBalance(targetAddress);
        console.log(`目标地址 TRX 余额: ${tronWeb.fromSun(targetTrxBalance)} TRX`);
        
        // 检查目标地址的 USDT 余额
        try {
            const contract = await tronWeb.contract().at(usdtContractAddress);
            const targetUsdtBalance = await contract.balanceOf(targetAddress).call();
            const targetUsdtBalanceFormatted = tronWeb.toBigNumber(targetUsdtBalance).dividedBy(1000000).toNumber();
            console.log(`目标地址 USDT 余额: ${targetUsdtBalanceFormatted} USDT`);
        } catch (error) {
            console.log(`目标地址 USDT 余额查询失败: ${error.message}`);
        }
        
        console.log('\n💡 分析结果:');
        console.log(`- 用户助记词生成的地址: ${generatedAddress}`);
        console.log(`- 期望的目标地址: ${targetAddress}`);
        console.log(`- 地址是否匹配: ${generatedAddress === targetAddress ? '✅' : '❌'}`);
        
        if (generatedAddress !== targetAddress) {
            console.log('\n🤔 可能的情况:');
            console.log('1. 用户提供的助记词对应不同的地址');
            console.log('2. 需要使用不同的派生路径');
            console.log('3. 目标地址可能来自不同的助记词');
            console.log('\n建议: 使用有余额的地址作为主钱包地址');
        }
        
    } catch (error) {
        console.error('❌ 检查余额时出错:', error.message);
    }
}

// 运行检查
checkGeneratedAddressBalance()
    .then(() => {
        console.log('\n✅ 余额检查完成');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ 脚本执行失败:', error);
        process.exit(1);
    });