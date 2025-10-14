const { TronWeb } = require('tronweb');

// 配置
const TRON_GRID_API = 'https://api.trongrid.io';
const USDT_CONTRACT_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

// 用户提供的信息
const PRIVATE_KEY = '7bc70610b96693ac9672c2ed0d0c23e4bc8dd9884fc469d4df7a4b8b25edeb51';
const SOURCE_ADDRESS = 'TXJhKZoXZsYY24HbNgVY8GRwNVc6L94WDx';  // 有5000 USDT的地址
const TARGET_ADDRESS = 'TPRyvdMdisT45XgCHmySiUtvUTeaVzP3zb';  // 目标地址

/**
 * 验证私钥并执行转账
 */
async function verifyAndTransfer() {
    try {
        console.log('=== 验证私钥和地址匹配 ===');
        
        // 初始化 TronWeb
        const tronWeb = new TronWeb({
            fullHost: TRON_GRID_API,
            privateKey: PRIVATE_KEY
        });

        // 验证私钥生成的地址
        const generatedAddress = tronWeb.address.fromPrivateKey(PRIVATE_KEY);
        console.log('私钥生成的地址:', generatedAddress);
        console.log('期望的源地址:', SOURCE_ADDRESS);
        console.log('地址匹配:', generatedAddress === SOURCE_ADDRESS);

        if (generatedAddress !== SOURCE_ADDRESS) {
            throw new Error('私钥与源地址不匹配！');
        }

        console.log('\n=== 检查余额 ===');
        
        // 检查源地址的 TRX 余额
        const trxBalance = await tronWeb.trx.getBalance(SOURCE_ADDRESS);
        console.log('源地址 TRX 余额:', tronWeb.fromSun(trxBalance), 'TRX');

        // 检查源地址的 USDT 余额
        const usdtContract = await tronWeb.contract().at(USDT_CONTRACT_ADDRESS);
        const usdtBalance = await usdtContract.balanceOf(SOURCE_ADDRESS).call();
        const usdtBalanceFormatted = usdtBalance.toString() / 1000000; // USDT 有6位小数
        console.log('源地址 USDT 余额:', usdtBalanceFormatted, 'USDT');

        // 检查目标地址的 USDT 余额（转账前）
        const targetUsdtBalanceBefore = await usdtContract.balanceOf(TARGET_ADDRESS).call();
        const targetUsdtBalanceBeforeFormatted = targetUsdtBalanceBefore.toString() / 1000000;
        console.log('目标地址转账前 USDT 余额:', targetUsdtBalanceBeforeFormatted, 'USDT');

        // 验证余额是否足够
        if (usdtBalanceFormatted < 5000) {
            throw new Error(`USDT 余额不足！当前余额: ${usdtBalanceFormatted} USDT`);
        }

        if (trxBalance < 10000000) { // 至少需要10 TRX作为手续费
            throw new Error(`TRX 余额不足支付手续费！当前余额: ${tronWeb.fromSun(trxBalance)} TRX`);
        }

        console.log('\n=== 执行转账 ===');
        
        // 转账 5000 USDT
        const transferAmount = 5000 * 1000000; // 5000 USDT，转换为最小单位
        console.log('转账金额:', transferAmount, '(最小单位)');
        console.log('从地址:', SOURCE_ADDRESS);
        console.log('到地址:', TARGET_ADDRESS);

        // 执行转账
        const transaction = await usdtContract.transfer(TARGET_ADDRESS, transferAmount).send({
            feeLimit: 100000000, // 100 TRX 手续费限制
            callValue: 0,
            shouldPollResponse: true
        });

        console.log('转账交易哈希:', transaction);

        // 等待交易确认
        console.log('\n等待交易确认...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 检查转账后的余额
        console.log('\n=== 转账后余额检查 ===');
        
        const sourceUsdtBalanceAfter = await usdtContract.balanceOf(SOURCE_ADDRESS).call();
        const sourceUsdtBalanceAfterFormatted = sourceUsdtBalanceAfter.toString() / 1000000;
        console.log('源地址转账后 USDT 余额:', sourceUsdtBalanceAfterFormatted, 'USDT');

        const targetUsdtBalanceAfter = await usdtContract.balanceOf(TARGET_ADDRESS).call();
        const targetUsdtBalanceAfterFormatted = targetUsdtBalanceAfter.toString() / 1000000;
        console.log('目标地址转账后 USDT 余额:', targetUsdtBalanceAfterFormatted, 'USDT');

        console.log('\n=== 转账完成 ===');
        console.log('转账金额:', 5000, 'USDT');
        console.log('交易哈希:', transaction);
        console.log('状态: 成功');

    } catch (error) {
        console.error('转账失败:', error.message);
        console.error('详细错误:', error);
    }
}

// 执行验证和转账
verifyAndTransfer();