const { TronWeb } = require('tronweb');
const axios = require('axios');

// 测试网配置
const TESTNET_CONFIG = {
    fullHost: 'https://api.nileex.io',
    privateKey: '7bc70610b96693ac9672c2ed0d0c23e4bc8dd9884fc469d4df7a4b8b25edeb51'
};

const MASTER_WALLET_ADDRESS = 'TPRyvdMdisT45XgCHmySiUtvUTeaVzP3zb';

/**
 * 尝试从水龙头获取测试网 TRX
 */
async function requestTestnetTRX() {
    try {
        console.log('🚰 尝试从水龙头获取测试网 TRX...');
        
        // 方法1: 使用 Nile 测试网 API
        const response = await axios.post('https://api.nileex.io/api/request-trx', {
            address: MASTER_WALLET_ADDRESS
        });
        
        if (response.data && response.data.success) {
            console.log('✅ 成功申请测试网 TRX');
            console.log('交易哈希:', response.data.txid);
            return response.data.txid;
        } else {
            console.log('❌ 水龙头申请失败:', response.data.message || '未知错误');
        }
        
    } catch (error) {
        console.log('❌ 水龙头申请失败:', error.message);
        
        // 方法2: 尝试其他测试网水龙头
        try {
            console.log('🚰 尝试备用水龙头...');
            const backupResponse = await axios.post('https://nileex.io/api/faucet', {
                address: MASTER_WALLET_ADDRESS,
                amount: 10000 // 10000 TRX
            });
            
            if (backupResponse.data && backupResponse.data.success) {
                console.log('✅ 备用水龙头申请成功');
                return backupResponse.data.txid;
            }
        } catch (backupError) {
            console.log('❌ 备用水龙头也失败:', backupError.message);
        }
    }
    
    return null;
}

/**
 * 等待交易确认
 */
async function waitForTransaction(txid, maxWaitTime = 60000) {
    console.log(`⏳ 等待交易确认: ${txid}`);
    
    const tronWeb = new TronWeb(
        TESTNET_CONFIG.fullHost,
        TESTNET_CONFIG.fullHost,
        TESTNET_CONFIG.fullHost
    );
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
        try {
            const tx = await tronWeb.trx.getTransaction(txid);
            if (tx && tx.ret && tx.ret[0] && tx.ret[0].contractRet === 'SUCCESS') {
                console.log('✅ 交易确认成功');
                return true;
            }
        } catch (error) {
            // 交易可能还未上链，继续等待
        }
        
        console.log('⏳ 等待中...');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log('⏰ 等待超时，请手动检查交易状态');
    return false;
}

/**
 * 检查余额
 */
async function checkBalance() {
    const tronWeb = new TronWeb(
        TESTNET_CONFIG.fullHost,
        TESTNET_CONFIG.fullHost,
        TESTNET_CONFIG.fullHost
    );
    
    try {
        const balance = await tronWeb.trx.getBalance(MASTER_WALLET_ADDRESS);
        const trxBalance = balance / 1000000;
        console.log('当前 TRX 余额:', trxBalance, 'TRX');
        return trxBalance;
    } catch (error) {
        console.log('查询余额失败:', error.message);
        return 0;
    }
}

/**
 * 创建测试 USDT（如果有权限）
 */
async function createTestUSDT() {
    console.log('\n💰 尝试获取测试 USDT...');
    
    // 这里可以实现测试 USDT 的获取逻辑
    // 例如调用测试网的 USDT 合约铸造功能
    
    console.log('📝 测试 USDT 获取方法：');
    console.log('1. 访问 TRON 开发者社区获取测试代币');
    console.log('2. 使用 TronBox 部署自己的测试 USDT 合约');
    console.log('3. 联系 TRON 官方获取测试网代币');
    console.log('4. 使用现有的测试网 USDT 水龙头（如果有）');
}

/**
 * 主函数
 */
async function getTestnetFunds() {
    console.log('🎯 开始获取测试网资金...');
    console.log('目标地址:', MASTER_WALLET_ADDRESS);
    console.log('='.repeat(50));
    
    // 1. 检查当前余额
    console.log('\n📊 检查当前余额...');
    let currentBalance = await checkBalance();
    
    if (currentBalance > 0) {
        console.log('✅ 账户已有 TRX 余额，跳过水龙头申请');
    } else {
        // 2. 申请测试网 TRX
        const txid = await requestTestnetTRX();
        
        if (txid) {
            // 3. 等待交易确认
            const confirmed = await waitForTransaction(txid);
            
            if (confirmed) {
                // 4. 再次检查余额
                currentBalance = await checkBalance();
            }
        }
    }
    
    // 5. 如果有 TRX，尝试获取测试 USDT
    if (currentBalance > 0) {
        console.log('\n✅ TRX 获取成功，账户已激活');
        await createTestUSDT();
    } else {
        console.log('\n❌ 未能获取测试网 TRX');
        console.log('请手动访问以下网站申请：');
        console.log('1. https://nileex.io/join/getJoinPage');
        console.log('2. https://developers.tron.network/docs/networks');
        console.log('3. 在 Telegram 或 Discord 的 TRON 开发者群组求助');
    }
    
    console.log('\n=== 下一步操作 ===');
    console.log('1. 确认 TRX 余额 > 0');
    console.log('2. 获取测试网 USDT');
    console.log('3. 运行钱包功能测试');
    console.log('4. 如需帮助，请提供获取到的交易哈希');
}

// 执行获取资金流程
getTestnetFunds().catch(console.error);