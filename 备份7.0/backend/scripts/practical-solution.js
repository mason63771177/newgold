const { TronWeb } = require('tronweb');

/**
 * 实用解决方案：使用有资金的地址作为主钱包
 */
async function practicalSolution() {
    console.log('🔧 实用解决方案分析...\n');
    
    // 已知信息
    const fundedAddress = 'TXJhKZoXZsYY24HbNgVY8GRwNVc6L94WDx';  // 有 5000 USDT
    const userMnemonicAddress = 'TPRyvdMdisT45XgCHmySiUtvUTeaVzP3zb';  // 用户助记词生成的地址
    const userPrivateKey = '7bc70610b96693ac9672c2ed0d0c23e4bc8dd9884fc469d4df7a4b8b25edeb51';
    
    console.log('📊 当前状况:');
    console.log(`有资金的地址: ${fundedAddress} (5000 USDT)`);
    console.log(`用户助记词地址: ${userMnemonicAddress} (余额未知)`);
    console.log(`用户私钥: ${userPrivateKey}`);
    
    try {
        const tronWeb = new TronWeb({
            fullHost: 'https://api.trongrid.io'
        });
        
        // 验证用户私钥确实生成用户助记词地址
        const addressFromPrivateKey = tronWeb.address.fromPrivateKey(userPrivateKey);
        console.log(`\n🔍 验证: 用户私钥生成地址 ${addressFromPrivateKey}`);
        console.log(`匹配用户助记词地址: ${addressFromPrivateKey === userMnemonicAddress ? '✅' : '❌'}`);
        
        // 检查用户助记词地址的余额
        console.log('\n💰 检查用户助记词地址余额...');
        const trxBalance = await tronWeb.trx.getBalance(userMnemonicAddress);
        console.log(`TRX 余额: ${tronWeb.fromSun(trxBalance)} TRX`);
        
        // 检查 USDT 余额
        const usdtContractAddress = 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs';
        try {
            const contract = await tronWeb.contract().at(usdtContractAddress);
            const usdtBalance = await contract.balanceOf(userMnemonicAddress).call();
            const usdtBalanceFormatted = tronWeb.toBigNumber(usdtBalance).dividedBy(1000000).toNumber();
            console.log(`USDT 余额: ${usdtBalanceFormatted} USDT`);
        } catch (error) {
            console.log(`USDT 余额查询失败: ${error.message}`);
        }
        
        console.log('\n💡 解决方案建议:');
        console.log('\n方案 1: 使用有资金的地址作为主钱包');
        console.log(`- 优点: 立即可用，有 5000 USDT 资金`);
        console.log(`- 缺点: 需要找到对应的私钥才能进行转账`);
        console.log(`- 配置: MASTER_WALLET_ADDRESS=${fundedAddress}`);
        
        console.log('\n方案 2: 转移资金到用户助记词地址');
        console.log(`- 优点: 使用用户提供的助记词和私钥`);
        console.log(`- 缺点: 需要先找到有资金地址的私钥进行转账`);
        console.log(`- 配置: MASTER_WALLET_ADDRESS=${userMnemonicAddress}`);
        console.log(`- 配置: PAYMENT_PRIVATE_KEY=${userPrivateKey}`);
        
        console.log('\n🎯 推荐方案:');
        console.log('如果你有有资金地址的私钥，建议使用方案 1');
        console.log('如果没有，需要先获取有资金地址的私钥，然后选择合适的方案');
        
        console.log('\n📋 当前 .env 配置建议:');
        console.log('# 使用有资金的地址作为主钱包');
        console.log(`MASTER_WALLET_ADDRESS=${fundedAddress}`);
        console.log('# 如果有对应私钥，请设置:');
        console.log('# PAYMENT_PRIVATE_KEY=<有资金地址的私钥>');
        console.log('');
        console.log('# 或者使用用户助记词地址（需要先转移资金）');
        console.log(`# MASTER_WALLET_ADDRESS=${userMnemonicAddress}`);
        console.log(`# PAYMENT_PRIVATE_KEY=${userPrivateKey}`);
        
    } catch (error) {
        console.error('❌ 分析过程中出错:', error.message);
    }
}

// 运行分析
practicalSolution()
    .then(() => {
        console.log('\n✅ 分析完成');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ 脚本执行失败:', error);
        process.exit(1);
    });