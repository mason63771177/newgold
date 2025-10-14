/**
 * 检查钱包余额脚本
 * 查询TRX和USDT余额，以及最近的交易记录
 */

const { TronWeb } = require('tronweb');
require('dotenv').config();

/**
 * 初始化TronWeb实例
 */
function initTronWeb() {
    const fullNode = process.env.TRON_GRID_API || 'https://api.nileex.io';
    const solidityNode = process.env.TRON_GRID_API || 'https://api.nileex.io';
    const eventServer = process.env.TRON_GRID_API || 'https://api.nileex.io';
    
    return new TronWeb(fullNode, solidityNode, eventServer);
}

/**
 * 检查TRX余额
 */
async function checkTrxBalance(tronWeb, address) {
    try {
        const balance = await tronWeb.trx.getBalance(address);
        return tronWeb.fromSun(balance);
    } catch (error) {
        console.error('检查TRX余额失败:', error.message);
        return 0;
    }
}

/**
 * 检查USDT余额
 */
async function checkUsdtBalance(tronWeb, address, contractAddress) {
    try {
        const contract = await tronWeb.contract().at(contractAddress);
        const balance = await contract.balanceOf(address).call();
        return tronWeb.toDecimal(balance) / Math.pow(10, 6); // USDT有6位小数
    } catch (error) {
        console.error('检查USDT余额失败:', error.message);
        return 0;
    }
}

/**
 * 主函数
 */
async function main() {
    console.log('🔍 开始检查钱包余额...\n');
    
    // 要检查的钱包地址
    const walletAddress = 'TNBAWXqecQ7mMgHz9DYviBmQsg5k7j8h2w';
    
    // 使用Shasta测试网
    const tronWeb = new TronWeb({
        fullHost: 'https://api.shasta.trongrid.io',
        headers: { "TRON-PRO-API-KEY": 'your-api-key' }
    });
    
    // Shasta测试网USDT合约地址
    const usdtContractAddress = 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs';
    
    console.log(`📍 检查地址: ${walletAddress}`);
    console.log(`🌐 网络: TRON Shasta 测试网`);
    console.log('=' .repeat(60) + '\n');
    
    try {
        // 1. 检查TRX余额
        console.log('💰 检查TRX余额...');
        const trxBalance = await tronWeb.trx.getBalance(walletAddress);
        const trxAmount = trxBalance / 1000000;
        
        console.log(`   TRX余额: ${trxAmount} TRX`);
        console.log(`   Sun余额: ${trxBalance} sun`);
        
        if (trxAmount > 0) {
            console.log('   ✅ 账户已激活，有TRX余额');
        } else {
            console.log('   ⚠️ 账户余额为0，可能未收到TRX');
        }
        
        // 2. 检查USDT余额
        console.log('\n💵 检查USDT余额...');
        let usdtAmount = 0;
        try {
            // 使用TronWeb的triggerSmartContract方法
            const parameter = [{type:'address',value:walletAddress}];
            const options = {
                feeLimit: 100000000,
                callValue: 0
            };
            
            const transaction = await tronWeb.transactionBuilder.triggerSmartContract(
                usdtContractAddress,
                "balanceOf(address)",
                options,
                parameter,
                walletAddress
            );
            
            if (transaction.result && transaction.result.result) {
                const result = transaction.constant_result[0];
                if (result) {
                    const balance = tronWeb.toBigNumber('0x' + result).toString();
                    usdtAmount = parseFloat(balance) / 1000000; // USDT是6位小数
                    
                    console.log(`   USDT合约地址: ${usdtContractAddress}`);
                    console.log(`   USDT余额: ${usdtAmount} USDT`);
                    console.log(`   原始余额: ${balance}`);
                    
                    if (usdtAmount > 0) {
                        console.log('   ✅ 有USDT余额');
                    } else {
                        console.log('   ⚠️ USDT余额为0，可能未收到USDT');
                    }
                } else {
                    console.log('   ⚠️ 无法获取USDT余额数据');
                }
            } else {
                console.log('   ⚠️ USDT合约调用失败');
            }
        } catch (usdtError) {
            console.log('   ❌ USDT余额检查失败:', usdtError.message);
        }
        
        // 3. 检查账户信息
        console.log('\n📊 检查账户状态...');
        try {
            const accountInfo = await tronWeb.trx.getAccount(walletAddress);
            
            if (accountInfo && Object.keys(accountInfo).length > 0) {
                console.log('   ✅ 账户存在且已激活');
                console.log(`   账户类型: ${accountInfo.type || 'Normal'}`);
                if (accountInfo.create_time) {
                    console.log(`   创建时间: ${new Date(accountInfo.create_time).toLocaleString()}`);
                }
            } else {
                console.log('   ⚠️ 账户不存在或未激活');
            }
        } catch (accountError) {
            console.log('   ❌ 账户信息检查失败:', accountError.message);
        }
        
        // 4. 获取最近交易
        console.log('\n📋 检查最近交易...');
        try {
            const transactions = await tronWeb.trx.getTransactionsFromAddress(walletAddress, 5);
            
            if (transactions && transactions.length > 0) {
                console.log(`   找到 ${transactions.length} 笔最近交易:`);
                
                transactions.forEach((tx, index) => {
                    const timestamp = new Date(tx.raw_data.timestamp).toLocaleString();
                    const txId = tx.txID;
                    
                    console.log(`   ${index + 1}. 交易ID: ${txId.substring(0, 16)}...`);
                    console.log(`      时间: ${timestamp}`);
                    console.log(`      类型: ${tx.raw_data.contract[0].type}`);
                });
            } else {
                console.log('   ⚠️ 暂无交易记录');
            }
        } catch (txError) {
            console.log('   ❌ 交易记录获取失败:', txError.message);
        }
        
        // 5. 总结
        console.log('\n📋 余额检查总结:');
        console.log('=' .repeat(40));
        console.log(`💰 TRX余额: ${trxAmount} TRX ${trxAmount > 0 ? '✅' : '⚠️'}`);
        console.log(`💵 USDT余额: 检查中... ${usdtAmount > 0 ? '✅' : '⚠️'}`);
        
        console.log('\n💡 获取测试币建议:');
        if (trxAmount === 0) {
            console.log('🔸 获取测试TRX: https://shasta.tronex.io/join/getJoinPage');
        }
        console.log('🔸 获取测试USDT: @TronShastaBot (Telegram)');
        
        if (trxAmount > 0) {
            console.log('\n🎉 钱包已激活，可以开始测试！');
        }
        
        return {
            address: walletAddress,
            trxBalance: trxAmount,
            activated: trxAmount > 0
        };
        
    } catch (error) {
        console.error('❌ 余额检查失败:', error.message);
        throw error;
    }
}

// 执行检查
main().then(result => {
    console.log('检查结果:', JSON.stringify(result, null, 2));
    process.exit(0);
}).catch(error => {
    console.error('检查失败:', error);
    process.exit(1);
});