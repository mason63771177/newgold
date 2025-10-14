const { TronWeb } = require('tronweb');

// 配置
const TRON_GRID_API = 'https://api.trongrid.io';
const USDT_CONTRACT_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

// 地址信息
const MASTER_WALLET_ADDRESS = 'TPRyvdMdisT45XgCHmySiUtvUTeaVzP3zb';  // 主钱包地址
const PRIVATE_KEY = '7bc70610b96693ac9672c2ed0d0c23e4bc8dd9884fc469d4df7a4b8b25edeb51';

/**
 * 验证充值后的余额
 */
async function verifyBalanceAfterDeposit() {
    try {
        console.log('=== 验证充值后余额 ===');
        
        // 初始化 TronWeb
        const tronWeb = new TronWeb({
            fullHost: TRON_GRID_API,
            privateKey: PRIVATE_KEY
        });

        // 验证私钥和地址匹配
        const addressFromPrivateKey = tronWeb.address.fromPrivateKey(PRIVATE_KEY);
        console.log('私钥生成的地址:', addressFromPrivateKey);
        console.log('主钱包地址:', MASTER_WALLET_ADDRESS);
        console.log('地址匹配:', addressFromPrivateKey === MASTER_WALLET_ADDRESS);

        if (addressFromPrivateKey !== MASTER_WALLET_ADDRESS) {
            throw new Error('私钥与主钱包地址不匹配！');
        }

        console.log('\n=== 余额检查 ===');
        
        // 检查 TRX 余额
        const trxBalance = await tronWeb.trx.getBalance(MASTER_WALLET_ADDRESS);
        console.log('TRX 余额:', tronWeb.fromSun(trxBalance), 'TRX');

        // 检查 USDT 余额
        const usdtContract = await tronWeb.contract().at(USDT_CONTRACT_ADDRESS);
        const usdtBalance = await usdtContract.balanceOf(MASTER_WALLET_ADDRESS).call();
        const usdtBalanceFormatted = usdtBalance.toString() / 1000000; // USDT 有6位小数
        console.log('USDT 余额:', usdtBalanceFormatted, 'USDT');

        console.log('\n=== 验证结果 ===');
        if (usdtBalanceFormatted >= 5000) {
            console.log('✅ 充值成功！主钱包已有', usdtBalanceFormatted, 'USDT');
            console.log('✅ 可以开始进行钱包功能测试');
        } else {
            console.log('❌ 充值未完成，当前余额:', usdtBalanceFormatted, 'USDT');
        }

        // 检查是否有足够的 TRX 作为手续费
        const minTrxRequired = 10; // 至少需要10 TRX
        if (tronWeb.fromSun(trxBalance) >= minTrxRequired) {
            console.log('✅ TRX 余额充足，可以支付交易手续费');
        } else {
            console.log('⚠️  TRX 余额不足，建议充值至少', minTrxRequired, 'TRX 用于支付手续费');
            console.log('   当前 TRX 余额:', tronWeb.fromSun(trxBalance), 'TRX');
        }

        return {
            address: MASTER_WALLET_ADDRESS,
            trxBalance: tronWeb.fromSun(trxBalance),
            usdtBalance: usdtBalanceFormatted,
            isReady: usdtBalanceFormatted >= 5000 && tronWeb.fromSun(trxBalance) >= minTrxRequired
        };

    } catch (error) {
        console.error('验证失败:', error.message);
        console.error('详细错误:', error);
        return null;
    }
}

// 执行验证
verifyBalanceAfterDeposit().then(result => {
    if (result && result.isReady) {
        console.log('\n🎉 主钱包配置完成，可以开始使用钱包功能！');
    }
});