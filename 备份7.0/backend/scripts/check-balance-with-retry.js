const { TronWeb } = require('tronweb');

// 配置
const TRON_GRID_API = 'https://api.trongrid.io';
const USDT_CONTRACT_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

// 地址信息
const MASTER_WALLET_ADDRESS = 'TPRyvdMdisT45XgCHmySiUtvUTeaVzP3zb';

/**
 * 延迟函数
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 检查USDT余额（带重试）
 */
async function checkUsdtBalanceWithRetry(tronWeb, address, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`第 ${i + 1} 次尝试查询 USDT 余额...`);
            
            const usdtContract = await tronWeb.contract().at(USDT_CONTRACT_ADDRESS);
            const balance = await usdtContract.balanceOf(address).call();
            const balanceFormatted = balance.toString() / 1000000;
            
            console.log(`USDT 余额: ${balanceFormatted} USDT`);
            return balanceFormatted;
            
        } catch (error) {
            console.log(`第 ${i + 1} 次查询失败:`, error.message);
            if (i < maxRetries - 1) {
                console.log('等待 3 秒后重试...');
                await delay(3000);
            }
        }
    }
    
    console.log('所有重试都失败了');
    return 0;
}

/**
 * 使用多个节点检查余额
 */
async function checkBalanceMultipleNodes() {
    const nodes = [
        'https://api.trongrid.io',
        'https://api.tronstack.io',
        'https://api.shasta.trongrid.io'
    ];
    
    console.log('=== 使用多个节点检查余额 ===');
    console.log('目标地址:', MASTER_WALLET_ADDRESS);
    
    for (let i = 0; i < nodes.length; i++) {
        try {
            console.log(`\n--- 使用节点 ${i + 1}: ${nodes[i]} ---`);
            
            const tronWeb = new TronWeb({
                fullHost: nodes[i]
            });
            
            // 检查 TRX 余额
            const trxBalance = await tronWeb.trx.getBalance(MASTER_WALLET_ADDRESS);
            const trxFormatted = tronWeb.fromSun(trxBalance);
            console.log('TRX 余额:', trxFormatted, 'TRX');
            
            // 检查 USDT 余额
            const usdtBalance = await checkUsdtBalanceWithRetry(tronWeb, MASTER_WALLET_ADDRESS);
            
            if (usdtBalance > 0) {
                console.log('\n🎉 找到余额！');
                console.log('USDT 余额:', usdtBalance, 'USDT');
                console.log('TRX 余额:', trxFormatted, 'TRX');
                
                if (usdtBalance >= 5000) {
                    console.log('✅ USDT 充值成功！');
                } else {
                    console.log('⚠️  USDT 余额不足 5000');
                }
                
                if (trxFormatted >= 10) {
                    console.log('✅ TRX 余额充足');
                } else {
                    console.log('⚠️  建议充值更多 TRX 用于手续费');
                }
                
                return { usdtBalance, trxBalance: trxFormatted, success: true };
            }
            
        } catch (error) {
            console.log(`节点 ${nodes[i]} 查询失败:`, error.message);
        }
    }
    
    console.log('\n❌ 所有节点都显示余额为 0');
    return { usdtBalance: 0, trxBalance: 0, success: false };
}

/**
 * 检查交易历史
 */
async function checkTransactionHistory() {
    try {
        console.log('\n=== 检查交易历史 ===');
        
        const tronWeb = new TronWeb({
            fullHost: TRON_GRID_API
        });
        
        // 获取最近的交易
        const transactions = await tronWeb.trx.getTransactionsFromAddress(MASTER_WALLET_ADDRESS, 10);
        
        if (transactions && transactions.length > 0) {
            console.log(`找到 ${transactions.length} 笔交易:`);
            transactions.forEach((tx, index) => {
                console.log(`${index + 1}. 交易哈希: ${tx.txID}`);
                console.log(`   时间: ${new Date(tx.block_timestamp).toLocaleString()}`);
            });
        } else {
            console.log('没有找到交易记录');
        }
        
    } catch (error) {
        console.log('获取交易历史失败:', error.message);
    }
}

// 执行检查
async function main() {
    console.log('开始检查主钱包余额...\n');
    
    const result = await checkBalanceMultipleNodes();
    
    if (!result.success) {
        await checkTransactionHistory();
        
        console.log('\n=== 可能的原因 ===');
        console.log('1. 充值交易还在确认中（通常需要几分钟）');
        console.log('2. 充值到了错误的地址');
        console.log('3. 网络延迟或节点同步问题');
        console.log('4. 交易失败或被拒绝');
        
        console.log('\n=== 建议操作 ===');
        console.log('1. 在 https://tronscan.org 上搜索地址:', MASTER_WALLET_ADDRESS);
        console.log('2. 检查充值交易的状态');
        console.log('3. 确认充值的目标地址是否正确');
        console.log('4. 等待几分钟后再次检查');
    }
}

main();