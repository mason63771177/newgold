const { TronWeb } = require('tronweb');
const axios = require('axios');

// 多个测试网节点配置
const TESTNET_NODES = [
    'https://api.nileex.io',
    'https://nile.trongrid.io',
    'https://api.nileex.io/wallet'
];

const MASTER_WALLET_ADDRESS = 'TPRyvdMdisT45XgCHmySiUtvUTeaVzP3zb';
const PRIVATE_KEY = '7bc70610b96693ac9672c2ed0d0c23e4bc8dd9884fc469d4df7a4b8b25edeb51';

/**
 * 使用多个节点检查 TRX 余额
 */
async function checkTRXBalanceMultiNode() {
    console.log('🔍 使用多个节点检查 TRX 余额...');
    
    for (const node of TESTNET_NODES) {
        try {
            console.log(`\n📡 尝试节点: ${node}`);
            
            const tronWeb = new TronWeb(node, node, node);
            const balance = await tronWeb.trx.getBalance(MASTER_WALLET_ADDRESS);
            const trxBalance = balance / 1000000;
            
            console.log(`✅ TRX 余额: ${trxBalance} TRX`);
            
            if (trxBalance > 0) {
                console.log('🎉 找到 TRX 余额！');
                return { success: true, balance: trxBalance, node };
            }
            
        } catch (error) {
            console.log(`❌ 节点 ${node} 查询失败:`, error.message);
        }
    }
    
    return { success: false, balance: 0 };
}

/**
 * 使用 HTTP API 直接查询账户信息
 */
async function checkAccountViaHTTP() {
    console.log('\n🌐 使用 HTTP API 查询账户信息...');
    
    const apis = [
        'https://api.nileex.io/wallet/getaccount',
        'https://nile.trongrid.io/wallet/getaccount'
    ];
    
    for (const api of apis) {
        try {
            console.log(`📡 尝试 API: ${api}`);
            
            const response = await axios.post(api, {
                address: MASTER_WALLET_ADDRESS
            });
            
            if (response.data) {
                console.log('✅ 账户信息:', JSON.stringify(response.data, null, 2));
                
                if (response.data.balance) {
                    const balance = response.data.balance / 1000000;
                    console.log(`💰 TRX 余额: ${balance} TRX`);
                    return { success: true, balance, data: response.data };
                }
            }
            
        } catch (error) {
            console.log(`❌ API ${api} 查询失败:`, error.message);
        }
    }
    
    return { success: false, balance: 0 };
}

/**
 * 查询最近的交易记录
 */
async function checkRecentTransactions() {
    console.log('\n📋 查询最近的交易记录...');
    
    const apis = [
        `https://api.nileex.io/v1/accounts/${MASTER_WALLET_ADDRESS}/transactions`,
        `https://nile.trongrid.io/v1/accounts/${MASTER_WALLET_ADDRESS}/transactions`
    ];
    
    for (const api of apis) {
        try {
            console.log(`📡 尝试 API: ${api}`);
            
            const response = await axios.get(api, {
                params: { limit: 5 }
            });
            
            if (response.data && response.data.data && response.data.data.length > 0) {
                console.log(`✅ 找到 ${response.data.data.length} 笔交易:`);
                
                response.data.data.forEach((tx, index) => {
                    const time = new Date(tx.block_timestamp).toLocaleString();
                    const value = tx.raw_data && tx.raw_data.contract && tx.raw_data.contract[0] 
                        ? tx.raw_data.contract[0].parameter.value.amount / 1000000 
                        : 'N/A';
                    
                    console.log(`${index + 1}. 交易哈希: ${tx.txID}`);
                    console.log(`   时间: ${time}`);
                    console.log(`   金额: ${value} TRX`);
                    console.log(`   状态: ${tx.ret && tx.ret[0] ? tx.ret[0].contractRet : 'UNKNOWN'}`);
                    console.log('');
                });
                
                return response.data.data;
            }
            
        } catch (error) {
            console.log(`❌ API ${api} 查询失败:`, error.message);
        }
    }
    
    console.log('❌ 未找到交易记录');
    return [];
}

/**
 * 等待资金到账
 */
async function waitForFunds(maxWaitMinutes = 5) {
    console.log(`⏳ 等待资金到账（最多等待 ${maxWaitMinutes} 分钟）...`);
    
    const maxWaitTime = maxWaitMinutes * 60 * 1000;
    const checkInterval = 30 * 1000; // 每30秒检查一次
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
        const result = await checkTRXBalanceMultiNode();
        
        if (result.success && result.balance > 0) {
            console.log('🎉 资金已到账！');
            return result;
        }
        
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        console.log(`⏳ 等待中... (已等待 ${elapsed} 秒)`);
        
        await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    console.log('⏰ 等待超时');
    return { success: false, balance: 0 };
}

/**
 * 获取测试网 USDT 的建议
 */
function suggestUSDTAcquisition() {
    console.log('\n💰 获取测试网 USDT 的方法：');
    console.log('1. 部署自己的测试 USDT 合约');
    console.log('2. 使用现有的测试网 USDT 水龙头');
    console.log('3. 在开发者社区请求测试 USDT');
    console.log('4. 使用 TronBox 创建测试代币');
    
    console.log('\n📝 推荐的测试 USDT 合约地址：');
    console.log('- TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs (Nile 测试网)');
    console.log('- 或者部署自己的 TRC20 测试合约');
}

/**
 * 主验证函数
 */
async function verifyTestnetFunds() {
    console.log('🎯 开始验证测试网资金...');
    console.log('目标地址:', MASTER_WALLET_ADDRESS);
    console.log('='.repeat(60));
    
    // 1. 验证私钥
    const tronWeb = new TronWeb(TESTNET_NODES[0], TESTNET_NODES[0], TESTNET_NODES[0], PRIVATE_KEY);
    const generatedAddress = tronWeb.address.fromPrivateKey(PRIVATE_KEY);
    
    if (generatedAddress === MASTER_WALLET_ADDRESS) {
        console.log('✅ 私钥验证通过');
    } else {
        console.log('❌ 私钥验证失败');
        return;
    }
    
    // 2. 多节点检查余额
    let balanceResult = await checkTRXBalanceMultiNode();
    
    // 3. 如果没有余额，使用 HTTP API 检查
    if (!balanceResult.success) {
        console.log('\n🔄 尝试 HTTP API 查询...');
        balanceResult = await checkAccountViaHTTP();
    }
    
    // 4. 查询交易记录
    const transactions = await checkRecentTransactions();
    
    // 5. 如果还是没有余额，等待一段时间
    if (!balanceResult.success && transactions.length === 0) {
        console.log('\n⏳ 可能交易还在确认中，等待资金到账...');
        balanceResult = await waitForFunds(3); // 等待3分钟
    }
    
    // 6. 总结结果
    console.log('\n=== 验证结果 ===');
    if (balanceResult.success) {
        console.log('🎉 测试网 TRX 验证成功！');
        console.log('💰 当前余额:', balanceResult.balance, 'TRX');
        console.log('📡 使用节点:', balanceResult.node || '多节点');
        
        // 建议下一步操作
        console.log('\n=== 下一步操作 ===');
        console.log('✅ 1. TRX 已到账，账户已激活');
        console.log('📋 2. 现在可以获取测试网 USDT');
        console.log('⚙️  3. 更新后端配置为测试网模式');
        console.log('🧪 4. 开始测试钱包功能');
        
        suggestUSDTAcquisition();
        
    } else {
        console.log('❌ 未检测到测试网 TRX');
        console.log('可能原因：');
        console.log('1. 交易还在处理中（请等待更长时间）');
        console.log('2. 水龙头申请失败');
        console.log('3. 网络延迟或节点同步问题');
        
        console.log('\n建议操作：');
        console.log('1. 等待 10-15 分钟后重新检查');
        console.log('2. 访问 https://nileex.io 查看交易状态');
        console.log('3. 重新申请水龙头');
        console.log('4. 在 TRON 开发者群组求助');
    }
}

// 执行验证
verifyTestnetFunds().catch(console.error);