const { TronWeb } = require('tronweb');

/**
 * 检查指定地址的 USDT 余额
 */
async function checkUSDTBalance() {
    try {
        const tronWeb = new TronWeb({
            fullHost: 'https://api.shasta.trongrid.io'
        });

        const address = 'TXJhKZoXZsYY24HbNgVY8GRwNVc6L94WDx';
        const usdtContract = 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs';

        console.log('检查地址:', address);
        console.log('USDT 合约:', usdtContract);

        // 转换地址为十六进制格式
        const hexAddress = tronWeb.address.toHex(address).replace('0x', '');
        const parameter = '000000000000000000000000' + hexAddress;

        console.log('十六进制地址:', hexAddress);
        console.log('调用参数:', parameter);

        // 调用合约查询余额
        const result = await tronWeb.transactionBuilder.triggerConstantContract(
            usdtContract,
            'balanceOf(address)',
            {
                feeLimit: 100000000,
                callValue: 0
            },
            [{ type: 'address', value: address }],
            address  // 设置 owner_address
        );

        if (result.result.result) {
            const balance = tronWeb.toBigNumber('0x' + result.constant_result[0]).toString();
            const balanceInUsdt = balance / 1000000; // USDT 有 6 位小数
            
            console.log('原始余额:', balance);
            console.log('USDT 余额:', balanceInUsdt);
        } else {
            console.log('查询失败:', result);
        }

    } catch (error) {
        console.error('检查余额时出错:', error.message);
    }
}

checkUSDTBalance();