/**
 * 测试 Tatum API 连接和功能
 * 使用已知的有余额的 TRON 地址来验证 API 是否正常工作
 */

require('dotenv').config();

async function testTatumAPI() {
    console.log('开始测试 Tatum API 连接...\n');
    
    const apiKey = process.env.TATUM_API_KEY;
    
    if (!apiKey || apiKey === 'your-tatum-api-key-here') {
        console.error('❌ 请在 .env 文件中配置有效的 TATUM_API_KEY');
        return;
    }
    
    // 使用一个已知的有余额的 TRON 地址进行测试
    // 这是 TRON 基金会的一个公开地址
    const testAddress = 'TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH';
    
    console.log('1. 测试获取账户信息...');
    try {
        const accountResponse = await fetch(`https://api.tatum.io/v3/tron/account/${testAddress}`, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });
        
        if (accountResponse.ok) {
            const accountData = await accountResponse.json();
            console.log('✅ 账户信息获取成功:');
            console.log('   完整响应:', JSON.stringify(accountData, null, 2));
            
            // 解析 TRX 余额（单位是 sun，需要除以 1,000,000）
            const trxBalance = accountData.balance ? (accountData.balance / 1000000) : 0;
            console.log(`   TRX 余额: ${trxBalance} TRX`);
            
            // 解析创建时间
            if (accountData.createTime) {
                const createDate = new Date(accountData.createTime);
                console.log(`   创建时间: ${createDate.toISOString()}`);
            }
        } else {
            console.log(`❌ 账户信息获取失败: ${accountResponse.status}`);
            const errorText = await accountResponse.text();
            console.log(`   错误信息: ${errorText}`);
        }
    } catch (error) {
        console.log(`❌ 账户信息获取异常: ${error.message}`);
    }
    
    console.log('\n==================================================\n');
    
    console.log('2. 测试获取 USDT TRC20 余额...');
    try {
        const usdtContractAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
        const usdtResponse = await fetch(`https://api.tatum.io/v3/tatum/wallet/${usdtContractAddress}/balance/${testAddress}`, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });
        
        if (usdtResponse.ok) {
            const usdtData = await usdtResponse.json();
            const usdtBalance = usdtData.balance ? parseFloat(usdtData.balance) / 1000000 : 0;
            
            console.log('✅ USDT 余额获取成功:');
            console.log(`   USDT 余额: ${usdtBalance.toFixed(6)} USDT`);
        } else if (usdtResponse.status === 404) {
            console.log('✅ USDT 余额获取成功: 0 USDT (地址没有该代币)');
        } else {
            console.log(`❌ USDT 余额获取失败: ${usdtResponse.status}`);
            const errorText = await usdtResponse.text();
            console.log(`   错误信息: ${errorText}`);
        }
    } catch (error) {
        console.log(`❌ USDT 余额获取异常: ${error.message}`);
    }
    
    console.log('\n==================================================\n');
    
    console.log('3. 测试新地址（零余额）处理...');
    try {
        // 使用一个随机生成的地址（应该返回 404）
        const newAddress = 'TNewAddressWithNoBalanceTest123456789';
        const newAccountResponse = await fetch(`https://api.tatum.io/v3/tron/account/${newAddress}`, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });
        
        if (newAccountResponse.status === 404) {
            console.log('✅ 新地址处理正确: 返回 404（地址在链上没有记录）');
        } else if (newAccountResponse.ok) {
            const data = await newAccountResponse.json();
            console.log('✅ 新地址有数据:', data);
        } else {
            console.log(`❌ 新地址处理异常: ${newAccountResponse.status}`);
        }
    } catch (error) {
        console.log(`❌ 新地址测试异常: ${error.message}`);
    }
    
    console.log('\nTatum API 测试完成！');
}

// 运行测试
testTatumAPI().catch(console.error);