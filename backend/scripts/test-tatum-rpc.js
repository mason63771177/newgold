const { TatumSDK, Network } = require('@tatumio/tatum');

async function testTatumRPC() {
    try {
        console.log('初始化 Tatum SDK...');
        const tatum = await TatumSDK.init({
            network: Network.TRON,
            apiKey: {
                v4: process.env.TATUM_API_KEY || 'test-key'
            }
        });
        
        console.log('RPC object:', tatum.rpc);
        console.log('RPC methods:', Object.getOwnPropertyNames(tatum.rpc));
        console.log('RPC prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(tatum.rpc)));
        
        // 尝试调用一些 RPC 方法
        try {
            const blockInfo = await tatum.rpc.getNowBlock();
            console.log('getNowBlock 成功:', blockInfo ? 'OK' : 'Empty');
        } catch (error) {
            console.log('getNowBlock 错误:', error.message);
        }
        
        await tatum.destroy();
        console.log('测试完成');
    } catch (error) {
        console.error('测试失败:', error.message);
    }
}

testTatumRPC();