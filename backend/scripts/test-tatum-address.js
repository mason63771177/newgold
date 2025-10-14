const { TatumSDK, Network } = require('@tatumio/tatum');

async function testTatumAddress() {
    try {
        console.log('初始化 Tatum SDK...');
        const tatum = await TatumSDK.init({
            network: Network.TRON,
            apiKey: {
                v4: process.env.TATUM_API_KEY || 'test-key'
            }
        });
        
        console.log('Address object:', tatum.address);
        console.log('Address methods:', Object.getOwnPropertyNames(tatum.address));
        console.log('Address prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(tatum.address)));
        
        // 测试地址余额查询（v4 兼容方法）
        try {
            const testAddress = 'TML5fDoMy6ThrD5rr7rXRQfoFFznbQQ8ux';
            console.log(`\n测试地址: ${testAddress}`);
            
            // 使用 address.getBalance 方法
            const balance = await tatum.address.getBalance(testAddress);
            console.log('✅ 地址余额查询成功:', balance);
            
            // 使用 address.getFullBalance 方法
            const fullBalance = await tatum.address.getFullBalance(testAddress);
            console.log('✅ 完整余额查询成功:', fullBalance);
            
        } catch (error) {
            console.log('❌ 地址查询错误:', error.message);
        }
        
        // 测试RPC方法获取交易（如果可用）
        try {
            console.log('\n测试RPC方法...');
            if (tatum.rpc) {
                console.log('RPC methods available:', Object.keys(tatum.rpc));
                
                // 尝试获取账户信息
                const accountInfo = await tatum.rpc.getAccount('TML5fDoMy6ThrD5rr7rXRQfoFFznbQQ8ux');
                console.log('✅ RPC账户信息:', accountInfo);
            } else {
                console.log('⚠️ RPC对象不可用');
            }
        } catch (error) {
            console.log('❌ RPC调用错误:', error.message);
        }
        
        await tatum.destroy();
        console.log('测试完成');
    } catch (error) {
        console.error('测试失败:', error.message);
    }
}

testTatumAddress();