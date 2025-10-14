const { TronWeb } = require('tronweb');
const axios = require('axios');

// 配置
const TRON_GRID_API = 'https://api.trongrid.io';
const USDT_CONTRACT_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const MASTER_WALLET_ADDRESS = 'TPRyvdMdisT45XgCHmySiUtvUTeaVzP3zb';

/**
 * 使用 TronScan API 查询余额
 */
async function checkBalanceViaTronScan() {
    try {
        console.log('=== 使用 TronScan API 查询 ===');
        
        // 查询账户信息
        const accountUrl = `https://apilist.tronscanapi.com/api/account?address=${MASTER_WALLET_ADDRESS}`;
        const accountResponse = await axios.get(accountUrl);
        
        if (accountResponse.data && accountResponse.data.balance !== undefined) {
            const trxBalance = accountResponse.data.balance / 1000000; // TRX 有6位小数
            console.log('TRX 余额:', trxBalance, 'TRX');
            
            // 查询 TRC20 代币余额
            if (accountResponse.data.trc20token_balances) {
                const usdtToken = accountResponse.data.trc20token_balances.find(
                    token => token.contract_address === USDT_CONTRACT_ADDRESS
                );
                
                if (usdtToken) {
                    const usdtBalance = parseFloat(usdtToken.balance) / Math.pow(10, usdtToken.decimals);
                    console.log('USDT 余额:', usdtBalance, 'USDT');
                    
                    if (usdtBalance >= 5000) {
                        console.log('✅ 通过 TronScan API 确认：充值成功！');
                        return { success: true, usdtBalance, trxBalance };
                    } else if (usdtBalance > 0) {
                        console.log('⚠️  检测到部分余额:', usdtBalance, 'USDT');
                        return { success: false, usdtBalance, trxBalance };
                    }
                } else {
                    console.log('❌ TronScan API 未检测到 USDT 余额');
                }
            }
        } else {
            console.log('❌ TronScan API 未找到账户信息');
        }
        
        return { success: false, usdtBalance: 0, trxBalance: 0 };
        
    } catch (error) {
        console.log('TronScan API 查询失败:', error.message);
        return { success: false, usdtBalance: 0, trxBalance: 0 };
    }
}

/**
 * 使用 TronGrid API 查询交易历史
 */
async function checkTransactionHistory() {
    try {
        console.log('\n=== 查询交易历史 ===');
        
        const url = `${TRON_GRID_API}/v1/accounts/${MASTER_WALLET_ADDRESS}/transactions/trc20`;
        const response = await axios.get(url, {
            params: {
                limit: 20,
                contract_address: USDT_CONTRACT_ADDRESS
            }
        });
        
        if (response.data && response.data.data && response.data.data.length > 0) {
            console.log(`找到 ${response.data.data.length} 笔 USDT 交易:`);
            
            response.data.data.forEach((tx, index) => {
                const amount = parseFloat(tx.value) / 1000000;
                const type = tx.to === MASTER_WALLET_ADDRESS ? '入账' : '出账';
                const time = new Date(tx.block_timestamp).toLocaleString();
                
                console.log(`${index + 1}. ${type} ${amount} USDT`);
                console.log(`   时间: ${time}`);
                console.log(`   交易哈希: ${tx.transaction_id}`);
                console.log(`   状态: ${tx.confirmed ? '已确认' : '未确认'}`);
                console.log('');
            });
            
            return response.data.data;
        } else {
            console.log('❌ 未找到 USDT 交易记录');
            return [];
        }
        
    } catch (error) {
        console.log('交易历史查询失败:', error.message);
        return [];
    }
}

/**
 * 检查网络连接和节点状态
 */
async function checkNetworkStatus() {
    try {
        console.log('\n=== 检查网络状态 ===');
        
        const response = await axios.get(`${TRON_GRID_API}/wallet/getnowblock`);
        if (response.data && response.data.block_header) {
            const blockNumber = response.data.block_header.raw_data.number;
            const timestamp = response.data.block_header.raw_data.timestamp;
            const blockTime = new Date(timestamp).toLocaleString();
            
            console.log('✅ 网络连接正常');
            console.log('当前区块高度:', blockNumber);
            console.log('最新区块时间:', blockTime);
            
            return true;
        } else {
            console.log('❌ 网络连接异常');
            return false;
        }
        
    } catch (error) {
        console.log('❌ 网络检查失败:', error.message);
        return false;
    }
}

/**
 * 模拟充值测试（创建一个小额转账来激活账户）
 */
async function suggestActivationSolution() {
    console.log('\n=== 账户激活建议 ===');
    console.log('如果账户从未有过交易，可能需要先激活账户：');
    console.log('1. 先向该地址转入少量 TRX（如 1 TRX）来激活账户');
    console.log('2. 然后再转入 USDT');
    console.log('3. 或者确认 USDT 转账是否真的已经发送并确认');
    
    console.log('\n=== 验证步骤 ===');
    console.log('请在以下网站验证您的转账：');
    console.log('1. TronScan: https://tronscan.org/#/address/' + MASTER_WALLET_ADDRESS);
    console.log('2. 搜索您的交易哈希确认状态');
    console.log('3. 确认转账的是 TRC20 USDT 而不是其他网络的 USDT');
}

/**
 * 主检查函数
 */
async function comprehensiveCheck() {
    console.log('🔍 开始全面检查主钱包余额...');
    console.log('目标地址:', MASTER_WALLET_ADDRESS);
    console.log('预期余额: 5000 USDT');
    console.log('='.repeat(60));
    
    // 1. 检查网络状态
    const networkOk = await checkNetworkStatus();
    if (!networkOk) {
        console.log('❌ 网络连接有问题，请稍后重试');
        return;
    }
    
    // 2. 使用 TronScan API 查询
    const tronScanResult = await checkBalanceViaTronScan();
    if (tronScanResult.success) {
        console.log('\n🎉 充值确认成功！可以开始使用钱包功能。');
        return;
    }
    
    // 3. 查询交易历史
    const transactions = await checkTransactionHistory();
    
    // 4. 如果没有找到余额，提供解决建议
    if (tronScanResult.usdtBalance === 0 && transactions.length === 0) {
        console.log('\n❌ 未检测到任何 USDT 余额或交易记录');
        suggestActivationSolution();
        
        console.log('\n=== 可能的问题 ===');
        console.log('1. 充值还在处理中（请等待几分钟）');
        console.log('2. 充值到了错误的地址');
        console.log('3. 充值了错误类型的 USDT（如 ERC20 而不是 TRC20）');
        console.log('4. 交易失败或被拒绝');
        console.log('5. 账户需要先用 TRX 激活');
        
    } else if (tronScanResult.usdtBalance > 0 && tronScanResult.usdtBalance < 5000) {
        console.log(`\n⚠️  检测到 ${tronScanResult.usdtBalance} USDT，但少于预期的 5000 USDT`);
        console.log('请确认是否还有其他转账正在处理中');
    }
    
    console.log('\n=== 下一步操作 ===');
    console.log('1. 如果确认已经转账，请提供交易哈希让我查询状态');
    console.log('2. 如果需要重新转账，请确认使用 TRC20 USDT');
    console.log('3. 建议先转入少量 TRX 激活账户，再转入 USDT');
}

// 执行检查
comprehensiveCheck().catch(console.error);