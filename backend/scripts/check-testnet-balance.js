const { TronWeb } = require('tronweb');
const axios = require('axios');

// 测试网配置
const TESTNET_CONFIG = {
    fullHost: 'https://api.nileex.io',  // Nile 测试网
    headers: { "TRON-PRO-API-KEY": 'your-api-key' },
    privateKey: '7bc70610b96693ac9672c2ed0d0c23e4bc8dd9884fc469d4df7a4b8b25edeb51'
};

// 测试网 USDT 合约地址 (Nile 测试网)
const TESTNET_USDT_CONTRACT = 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs'; // 这是 Nile 测试网的 USDT 合约
const MASTER_WALLET_ADDRESS = 'TPRyvdMdisT45XgCHmySiUtvUTeaVzP3zb';

/**
 * 初始化测试网 TronWeb
 */
function initTestnetTronWeb() {
    return new TronWeb(
        TESTNET_CONFIG.fullHost,
        TESTNET_CONFIG.fullHost,
        TESTNET_CONFIG.fullHost,
        TESTNET_CONFIG.privateKey
    );
}

/**
 * 检查测试网 TRX 余额
 */
async function checkTestnetTRXBalance(tronWeb, address) {
    try {
        const balance = await tronWeb.trx.getBalance(address);
        const trxBalance = balance / 1000000; // TRX 有6位小数
        console.log('测试网 TRX 余额:', trxBalance, 'TRX');
        return trxBalance;
    } catch (error) {
        console.log('查询测试网 TRX 余额失败:', error.message);
        return 0;
    }
}

/**
 * 检查测试网 USDT 余额
 */
async function checkTestnetUSDTBalance(tronWeb, address) {
    try {
        // 获取合约实例
        const contract = await tronWeb.contract().at(TESTNET_USDT_CONTRACT);
        
        // 调用 balanceOf 方法
        const balance = await contract.balanceOf(address).call();
        const usdtBalance = parseFloat(balance.toString()) / 1000000; // USDT 有6位小数
        
        console.log('测试网 USDT 余额:', usdtBalance, 'USDT');
        return usdtBalance;
        
    } catch (error) {
        console.log('查询测试网 USDT 余额失败:', error.message);
        
        // 尝试使用 HTTP API 查询
        try {
            const response = await axios.post(`${TESTNET_CONFIG.fullHost}/wallet/triggerconstantcontract`, {
                owner_address: tronWeb.address.toHex(address),
                contract_address: tronWeb.address.toHex(TESTNET_USDT_CONTRACT),
                function_selector: 'balanceOf(address)',
                parameter: tronWeb.address.toHex(address).substring(2).padStart(64, '0')
            });
            
            if (response.data && response.data.constant_result && response.data.constant_result[0]) {
                const balance = parseInt(response.data.constant_result[0], 16);
                const usdtBalance = balance / 1000000;
                console.log('测试网 USDT 余额 (HTTP API):', usdtBalance, 'USDT');
                return usdtBalance;
            }
        } catch (httpError) {
            console.log('HTTP API 查询也失败:', httpError.message);
        }
        
        return 0;
    }
}

/**
 * 查询测试网交易历史
 */
async function checkTestnetTransactions(address) {
    try {
        console.log('\n=== 查询测试网交易历史 ===');
        
        // 使用 Nile 测试网的 API
        const response = await axios.get(`${TESTNET_CONFIG.fullHost}/v1/accounts/${address}/transactions`, {
            params: {
                limit: 10
            }
        });
        
        if (response.data && response.data.data && response.data.data.length > 0) {
            console.log(`找到 ${response.data.data.length} 笔交易:`);
            
            response.data.data.forEach((tx, index) => {
                const time = new Date(tx.block_timestamp).toLocaleString();
                console.log(`${index + 1}. 交易哈希: ${tx.txID}`);
                console.log(`   时间: ${time}`);
                console.log(`   状态: ${tx.ret[0].contractRet}`);
                console.log('');
            });
            
            return response.data.data;
        } else {
            console.log('❌ 未找到交易记录');
            return [];
        }
        
    } catch (error) {
        console.log('查询测试网交易历史失败:', error.message);
        return [];
    }
}

/**
 * 检查账户是否存在
 */
async function checkTestnetAccount(tronWeb, address) {
    try {
        const account = await tronWeb.trx.getAccount(address);
        if (account && Object.keys(account).length > 0) {
            console.log('✅ 测试网账户存在');
            console.log('账户信息:', {
                address: account.address ? tronWeb.address.fromHex(account.address) : 'N/A',
                balance: account.balance ? account.balance / 1000000 : 0,
                createTime: account.create_time ? new Date(account.create_time).toLocaleString() : 'N/A'
            });
            return true;
        } else {
            console.log('❌ 测试网账户不存在或未激活');
            return false;
        }
    } catch (error) {
        console.log('查询测试网账户失败:', error.message);
        return false;
    }
}

/**
 * 主检查函数
 */
async function checkTestnetBalance() {
    console.log('🔍 开始检查测试网余额...');
    console.log('目标地址:', MASTER_WALLET_ADDRESS);
    console.log('测试网节点:', TESTNET_CONFIG.fullHost);
    console.log('测试网 USDT 合约:', TESTNET_USDT_CONTRACT);
    console.log('='.repeat(60));
    
    // 初始化测试网 TronWeb
    const tronWeb = initTestnetTronWeb();
    
    // 验证私钥生成的地址
    const generatedAddress = tronWeb.address.fromPrivateKey(TESTNET_CONFIG.privateKey);
    console.log('私钥生成的地址:', generatedAddress);
    
    if (generatedAddress !== MASTER_WALLET_ADDRESS) {
        console.log('⚠️  警告：私钥生成的地址与目标地址不匹配！');
    } else {
        console.log('✅ 私钥验证通过');
    }
    
    // 检查账户是否存在
    const accountExists = await checkTestnetAccount(tronWeb, MASTER_WALLET_ADDRESS);
    
    // 检查 TRX 余额
    const trxBalance = await checkTestnetTRXBalance(tronWeb, MASTER_WALLET_ADDRESS);
    
    // 检查 USDT 余额
    const usdtBalance = await checkTestnetUSDTBalance(tronWeb, MASTER_WALLET_ADDRESS);
    
    // 查询交易历史
    const transactions = await checkTestnetTransactions(MASTER_WALLET_ADDRESS);
    
    console.log('\n=== 测试网余额总结 ===');
    console.log('账户状态:', accountExists ? '已激活' : '未激活');
    console.log('TRX 余额:', trxBalance, 'TRX');
    console.log('USDT 余额:', usdtBalance, 'USDT');
    console.log('交易记录数:', transactions.length);
    
    if (usdtBalance > 0) {
        console.log('\n🎉 检测到测试网 USDT 余额！');
        console.log('现在可以开始测试钱包功能了。');
        
        // 更新配置建议
        console.log('\n=== 配置更新建议 ===');
        console.log('请确保后端配置使用测试网：');
        console.log('1. TRON_NETWORK=testnet');
        console.log('2. TRON_GRID_API=https://api.nileex.io');
        console.log('3. USDT_CONTRACT_ADDRESS=' + TESTNET_USDT_CONTRACT);
        
    } else if (trxBalance === 0 && !accountExists) {
        console.log('\n❌ 账户未激活');
        console.log('建议：');
        console.log('1. 先从测试网水龙头获取一些测试 TRX');
        console.log('2. 然后获取测试网 USDT');
        console.log('3. 测试网水龙头: https://nileex.io/join/getJoinPage');
        
    } else {
        console.log('\n⚠️  账户已激活但没有 USDT');
        console.log('请确认：');
        console.log('1. 是否向正确的测试网地址转账');
        console.log('2. 是否使用了正确的测试网 USDT 合约');
        console.log('3. 交易是否已确认');
    }
}

// 执行检查
checkTestnetBalance().catch(console.error);