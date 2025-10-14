/**
 * 专门检查USDT余额的脚本
 * 使用多种方法验证USDT是否到账
 */

const { TronWeb } = require('tronweb');

// 配置
const WALLET_ADDRESS = 'TNBAWXqecQ7mMgHz9DYviBmQsg5k7j8h2w';
const USDT_CONTRACT_ADDRESS = 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs'; // Shasta测试网USDT合约

/**
 * 初始化TronWeb
 */
function initTronWeb() {
    return new TronWeb({
        fullHost: 'https://api.shasta.trongrid.io',
        headers: { "TRON-PRO-API-KEY": 'your-api-key' },
        privateKey: '01' // 只用于查询，不需要真实私钥
    });
}

/**
 * 方法1: 使用合约直接调用
 */
async function checkUsdtByContract(tronWeb, address) {
    try {
        console.log('🔍 方法1: 合约直接调用');
        const contract = await tronWeb.contract().at(USDT_CONTRACT_ADDRESS);
        const balance = await contract.balanceOf(address).call();
        const usdtAmount = tronWeb.toDecimal(balance) / Math.pow(10, 6);
        
        console.log(`   原始余额: ${balance.toString()}`);
        console.log(`   USDT余额: ${usdtAmount} USDT`);
        return usdtAmount;
    } catch (error) {
        console.log(`   ❌ 失败: ${error.message}`);
        return null;
    }
}

/**
 * 方法2: 使用triggerSmartContract
 */
async function checkUsdtByTrigger(tronWeb, address) {
    try {
        console.log('\n🔍 方法2: triggerSmartContract调用');
        
        // 构建balanceOf函数调用
        const functionSelector = 'balanceOf(address)';
        const parameter = [
            {type: 'address', value: address}
        ];
        
        const result = await tronWeb.transactionBuilder.triggerSmartContract(
            USDT_CONTRACT_ADDRESS,
            functionSelector,
            {},
            parameter,
            address
        );
        
        if (result && result.constant_result && result.constant_result[0]) {
            const balance = tronWeb.toDecimal('0x' + result.constant_result[0]);
            const usdtAmount = balance / Math.pow(10, 6);
            
            console.log(`   原始余额: ${balance}`);
            console.log(`   USDT余额: ${usdtAmount} USDT`);
            return usdtAmount;
        } else {
            console.log('   ❌ 未获取到余额数据');
            return null;
        }
    } catch (error) {
        console.log(`   ❌ 失败: ${error.message}`);
        return null;
    }
}

/**
 * 方法3: 检查账户的TRC20代币
 */
async function checkAccountTokens(tronWeb, address) {
    try {
        console.log('\n🔍 方法3: 检查账户TRC20代币');
        
        // 获取账户信息
        const accountInfo = await tronWeb.trx.getAccount(address);
        
        if (accountInfo && accountInfo.assetV2) {
            console.log('   TRC20代币列表:');
            for (const [tokenId, balance] of Object.entries(accountInfo.assetV2)) {
                console.log(`   - Token ID: ${tokenId}, Balance: ${balance}`);
            }
        } else {
            console.log('   ❌ 未找到TRC20代币');
        }
        
        return accountInfo;
    } catch (error) {
        console.log(`   ❌ 失败: ${error.message}`);
        return null;
    }
}

/**
 * 方法4: 检查交易历史
 */
async function checkTransactionHistory(tronWeb, address) {
    try {
        console.log('\n🔍 方法4: 检查交易历史');
        
        // 尝试获取TRC20转账记录
        const url = `https://api.shasta.trongrid.io/v1/accounts/${address}/transactions/trc20`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.data && data.data.length > 0) {
            console.log(`   找到 ${data.data.length} 条TRC20交易记录:`);
            
            data.data.forEach((tx, index) => {
                if (index < 5) { // 只显示前5条
                    console.log(`   ${index + 1}. 合约: ${tx.token_info.address}`);
                    console.log(`      金额: ${tx.value / Math.pow(10, tx.token_info.decimals)} ${tx.token_info.symbol}`);
                    console.log(`      时间: ${new Date(tx.block_timestamp).toLocaleString()}`);
                    console.log(`      类型: ${tx.type}`);
                }
            });
            
            // 查找USDT相关交易
            const usdtTxs = data.data.filter(tx => 
                tx.token_info.address.toLowerCase() === USDT_CONTRACT_ADDRESS.toLowerCase()
            );
            
            if (usdtTxs.length > 0) {
                console.log(`\n   🎉 找到 ${usdtTxs.length} 条USDT交易!`);
                return usdtTxs;
            }
        } else {
            console.log('   ❌ 未找到TRC20交易记录');
        }
        
        return null;
    } catch (error) {
        console.log(`   ❌ 失败: ${error.message}`);
        return null;
    }
}

/**
 * 主函数
 */
async function main() {
    console.log('🔍 专门检查USDT余额...\n');
    console.log(`📍 钱包地址: ${WALLET_ADDRESS}`);
    console.log(`📍 USDT合约: ${USDT_CONTRACT_ADDRESS}`);
    console.log('=' .repeat(60));
    
    const tronWeb = initTronWeb();
    
    // 使用多种方法检查
    const method1Result = await checkUsdtByContract(tronWeb, WALLET_ADDRESS);
    const method2Result = await checkUsdtByTrigger(tronWeb, WALLET_ADDRESS);
    const method3Result = await checkAccountTokens(tronWeb, WALLET_ADDRESS);
    const method4Result = await checkTransactionHistory(tronWeb, WALLET_ADDRESS);
    
    // 总结结果
    console.log('\n📋 检查结果总结:');
    console.log('=' .repeat(40));
    
    if (method1Result !== null && method1Result > 0) {
        console.log(`✅ 方法1检测到USDT: ${method1Result} USDT`);
    } else if (method1Result === 0) {
        console.log('⚠️ 方法1显示USDT余额为0');
    } else {
        console.log('❌ 方法1检查失败');
    }
    
    if (method2Result !== null && method2Result > 0) {
        console.log(`✅ 方法2检测到USDT: ${method2Result} USDT`);
    } else if (method2Result === 0) {
        console.log('⚠️ 方法2显示USDT余额为0');
    } else {
        console.log('❌ 方法2检查失败');
    }
    
    if (method4Result && method4Result.length > 0) {
        console.log(`✅ 交易历史中找到 ${method4Result.length} 条USDT交易`);
    } else {
        console.log('❌ 交易历史中未找到USDT交易');
    }
    
    // 最终结论
    console.log('\n🎯 最终结论:');
    if ((method1Result && method1Result > 0) || (method2Result && method2Result > 0)) {
        console.log('🎉 USDT已到账！');
    } else if (method4Result && method4Result.length > 0) {
        console.log('🤔 有USDT交易记录，但余额显示为0，可能已被转出');
    } else {
        console.log('❌ USDT尚未到账，建议重新申请或等待');
    }
    
    console.log('\n💡 如果USDT未到账，可以:');
    console.log('1. 通过Telegram Bot重新申请: @TronShastaBot');
    console.log('2. 等待几分钟后重新检查');
    console.log('3. 确认申请时使用的地址是否正确');
}

// 运行检查
main().catch(error => {
    console.error('检查失败:', error);
});