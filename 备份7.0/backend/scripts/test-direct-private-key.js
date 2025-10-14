const { TronWeb } = require('tronweb');

/**
 * 直接使用私钥生成地址进行验证
 */
async function testDirectPrivateKey() {
    const privateKey = '7bc70610b96693ac9672c2ed0d0c23e4bc8dd9884fc469d4df7a4b8b25edeb51';
    const expectedAddress = 'TXJhKZoXZsYY24HbNgVY8GRwNVc6L94WDx';
    
    console.log('🔍 直接使用私钥验证地址生成...\n');
    console.log(`私钥: ${privateKey}`);
    console.log(`期望地址: ${expectedAddress}\n`);
    
    try {
        // 使用 TronWeb 从私钥生成地址
        const tronWeb = new TronWeb({
            fullHost: 'https://api.trongrid.io'
        });
        
        const generatedAddress = tronWeb.address.fromPrivateKey(privateKey);
        console.log(`生成的地址: ${generatedAddress}`);
        
        // 验证地址是否匹配
        const addressMatch = generatedAddress === expectedAddress;
        console.log(`地址匹配: ${addressMatch ? '✅' : '❌'}`);
        
        if (addressMatch) {
            console.log('\n🎉 验证成功！私钥能正确生成目标地址');
            console.log('\n💡 这意味着我们可以直接使用这个私钥配置主钱包');
            console.log('\n📋 建议的配置更新:');
            console.log(`PAYMENT_PRIVATE_KEY=${privateKey}`);
            console.log(`MASTER_WALLET_ADDRESS=${expectedAddress}`);
            return true;
        } else {
            console.log('\n❌ 验证失败，私钥无法生成期望的地址');
            console.log(`期望: ${expectedAddress}`);
            console.log(`实际: ${generatedAddress}`);
            return false;
        }
        
    } catch (error) {
        console.error('❌ 验证过程中出错:', error.message);
        return false;
    }
}

// 运行验证
testDirectPrivateKey()
    .then(success => {
        if (success) {
            console.log('\n✅ 私钥验证通过');
        } else {
            console.log('\n❌ 私钥验证失败');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ 验证脚本执行失败:', error);
        process.exit(1);
    });