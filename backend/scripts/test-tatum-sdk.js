const { TatumSDK, Network } = require('@tatumio/tatum');

async function testTatumSDK() {
    try {
        console.log('初始化 Tatum SDK...');
        const tatum = await TatumSDK.init({
            network: Network.TRON
        });
        
        console.log('Tatum SDK keys:', Object.keys(tatum));
        console.log('Has address?', !!tatum.address);
        console.log('Has rpc?', !!tatum.rpc);
        
        if (tatum.address) {
            console.log('Address methods:', Object.keys(tatum.address));
        }
        
        if (tatum.rpc) {
            console.log('RPC methods:', Object.keys(tatum.rpc));
        }
        
        await tatum.destroy();
        console.log('测试完成');
    } catch (error) {
        console.error('测试失败:', error.message);
    }
}

testTatumSDK();