const { TatumSDK, Network, Tron } = require('@tatumio/tatum');

async function testDepositTransfer() {
    try {
        console.log('🚀 开始执行充值转账测试...');
        
        // 初始化 Tatum SDK
        const tatum = await TatumSDK.init({
            network: Network.TRON_SHASTA,
            apiKey: {
                v4: process.env.TATUM_API_KEY
            }
        });

        // 主钱包信息（测试币申请到的地址）
        const fromAddress = 'TXJhKZoXZsYY24HbNgVY8GRwNVc6L94WDx';
        const fromPrivateKey = process.env.MAIN_WALLET_PRIVATE_KEY;
        
        // 目标地址（新用户的充值地址）
        const toAddress = 'TYeVe8dn6NEZYwUiu7GmFpF8jsP8uMTrNZ';
        
        // 转账金额（100 USDT）
        const amount = '100';
        
        console.log(`📤 从地址: ${fromAddress}`);
        console.log(`📥 到地址: ${toAddress}`);
        console.log(`💰 金额: ${amount} USDT`);
        
        // 检查主钱包余额
        console.log('\n🔍 检查主钱包余额...');
        const balance = await tatum.rpc.getAccount(fromAddress);
        console.log('主钱包余额:', JSON.stringify(balance, null, 2));
        
        // 执行转账
        console.log('\n💸 执行转账...');
        const txResult = await tatum.transaction.send({
            fromPrivateKey: fromPrivateKey,
            to: toAddress,
            amount: amount,
            currency: 'USDT_TRON'
        });
        
        console.log('\n✅ 转账结果:');
        console.log('Transaction Hash:', txResult.txId);
        console.log('完整结果:', JSON.stringify(txResult, null, 2));
        
        // 等待交易确认
        console.log('\n⏳ 等待交易确认...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 检查交易状态
        const txInfo = await tatum.rpc.getTransactionInfo(txResult.txId);
        console.log('\n📊 交易信息:');
        console.log(JSON.stringify(txInfo, null, 2));
        
        await tatum.destroy();
        
    } catch (error) {
        console.error('❌ 转账测试失败:', error);
        process.exit(1);
    }
}

testDepositTransfer();
