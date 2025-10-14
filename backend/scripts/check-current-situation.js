const { TronWeb } = require('tronweb');

// 配置
const TRON_GRID_API = 'https://api.trongrid.io';
const USDT_CONTRACT_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

// 地址信息
const PRIVATE_KEY = '7bc70610b96693ac9672c2ed0d0c23e4bc8dd9884fc469d4df7a4b8b25edeb51';
const FUNDED_ADDRESS = 'TXJhKZoXZsYY24HbNgVY8GRwNVc6L94WDx';  // 有5000 USDT的地址
const GENERATED_ADDRESS = 'TPRyvdMdisT45XgCHmySiUtvUTeaVzP3zb';  // 私钥生成的地址

/**
 * 检查当前情况
 */
async function checkCurrentSituation() {
    try {
        console.log('=== 当前情况分析 ===');
        
        // 初始化 TronWeb
        const tronWeb = new TronWeb({
            fullHost: TRON_GRID_API
        });

        // 验证私钥生成的地址
        const addressFromPrivateKey = tronWeb.address.fromPrivateKey(PRIVATE_KEY);
        console.log('用户提供的私钥:', PRIVATE_KEY);
        console.log('私钥生成的地址:', addressFromPrivateKey);
        console.log('有资金的地址:', FUNDED_ADDRESS);
        console.log('地址匹配:', addressFromPrivateKey === FUNDED_ADDRESS);

        console.log('\n=== 余额检查 ===');
        
        // 获取 USDT 合约
        const usdtContract = await tronWeb.contract().at(USDT_CONTRACT_ADDRESS);

        // 检查有资金地址的余额
        console.log('\n1. 有资金的地址 (TXJhKZoXZsYY24HbNgVY8GRwNVc6L94WDx):');
        try {
            const fundedTrxBalance = await tronWeb.trx.getBalance(FUNDED_ADDRESS);
            console.log('   TRX 余额:', tronWeb.fromSun(fundedTrxBalance), 'TRX');
            
            const fundedUsdtBalance = await usdtContract.balanceOf(FUNDED_ADDRESS).call();
            const fundedUsdtFormatted = fundedUsdtBalance.toString() / 1000000;
            console.log('   USDT 余额:', fundedUsdtFormatted, 'USDT');
        } catch (error) {
            console.log('   余额查询失败:', error.message);
        }

        // 检查私钥生成地址的余额
        console.log('\n2. 私钥生成的地址 (TPRyvdMdisT45XgCHmySiUtvUTeaVzP3zb):');
        try {
            const generatedTrxBalance = await tronWeb.trx.getBalance(GENERATED_ADDRESS);
            console.log('   TRX 余额:', tronWeb.fromSun(generatedTrxBalance), 'TRX');
            
            const generatedUsdtBalance = await usdtContract.balanceOf(GENERATED_ADDRESS).call();
            const generatedUsdtFormatted = generatedUsdtBalance.toString() / 1000000;
            console.log('   USDT 余额:', generatedUsdtFormatted, 'USDT');
        } catch (error) {
            console.log('   余额查询失败:', error.message);
        }

        console.log('\n=== 结论 ===');
        console.log('1. 用户提供的私钥控制地址:', addressFromPrivateKey);
        console.log('2. 有5000 USDT的地址:', FUNDED_ADDRESS);
        console.log('3. 要执行转账，需要有资金地址的私钥');
        console.log('4. 当前提供的私钥无法控制有资金的地址');

    } catch (error) {
        console.error('检查失败:', error.message);
        console.error('详细错误:', error);
    }
}

// 执行检查
checkCurrentSituation();