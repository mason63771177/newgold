const axios = require('axios');
const { TronWeb } = require('tronweb');
require('dotenv').config();

// 测试网配置
const TESTNET_CONFIG = {
    fullHost: 'https://api.nileex.io',
    privateKey: '7bc70610b96693ac9672c2ed0d0c23e4bc8dd9884fc469d4df7a4b8b25edeb51'
};

const MASTER_WALLET_ADDRESS = process.env.MASTER_WALLET_ADDRESS;
const USDT_CONTRACT_ADDRESS = process.env.USDT_CONTRACT_ADDRESS;

/**
 * 初始化 TronWeb
 */
function initTronWeb() {
    return new TronWeb(
        TESTNET_CONFIG.fullHost,
        TESTNET_CONFIG.fullHost,
        TESTNET_CONFIG.fullHost,
        TESTNET_CONFIG.privateKey
    );
}

/**
 * 检查当前 USDT 余额
 */
async function checkUSDTBalance() {
    try {
        const tronWeb = initTronWeb();
        const contract = await tronWeb.contract().at(USDT_CONTRACT_ADDRESS);
        
        const balance = await contract.balanceOf(MASTER_WALLET_ADDRESS).call();
        const decimals = await contract.decimals().call();
        const amount = parseFloat(balance.toString()) / Math.pow(10, parseInt(decimals));
        
        console.log(`当前 USDT 余额: ${amount} USDT`);
        return amount;
        
    } catch (error) {
        console.log('查询 USDT 余额失败:', error.message);
        return 0;
    }
}

/**
 * 尝试从 Nile 测试网水龙头获取 USDT
 */
async function requestUSDTFromNileFaucet() {
    console.log('🚰 尝试从 Nile 测试网水龙头获取 USDT...');
    
    const faucetEndpoints = [
        {
            name: 'Nile 官方水龙头',
            url: 'https://nileex.io/join/getJoinPage',
            method: 'POST',
            data: {
                address: MASTER_WALLET_ADDRESS,
                token: 'USDT'
            }
        },
        {
            name: 'TronGrid 水龙头',
            url: 'https://api.nileex.io/wallet/getfaucet',
            method: 'POST',
            data: {
                address: MASTER_WALLET_ADDRESS,
                token: USDT_CONTRACT_ADDRESS
            }
        }
    ];
    
    for (const endpoint of faucetEndpoints) {
        try {
            console.log(`尝试 ${endpoint.name}...`);
            
            const response = await axios({
                method: endpoint.method,
                url: endpoint.url,
                data: endpoint.data,
                timeout: 15000,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Origin': 'https://nileex.io',
                    'Referer': 'https://nileex.io/'
                }
            });
            
            console.log(`✅ ${endpoint.name} 响应:`, response.status);
            
            if (response.data) {
                console.log('响应数据:', JSON.stringify(response.data, null, 2));
                
                if (response.data.success || response.status === 200) {
                    console.log('🎉 水龙头请求可能成功！');
                    return true;
                }
            }
            
        } catch (error) {
            console.log(`❌ ${endpoint.name} 失败:`, error.response?.status || error.message);
            
            if (error.response?.data) {
                console.log('错误详情:', JSON.stringify(error.response.data, null, 2));
            }
        }
        
        // 等待一下避免请求过快
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return false;
}

/**
 * 尝试通过 API 直接请求测试代币
 */
async function requestTestTokensViaAPI() {
    console.log('🔗 尝试通过 API 请求测试代币...');
    
    const apiEndpoints = [
        {
            name: 'Nile API',
            url: `https://api.nileex.io/wallet/gettestusdt?address=${MASTER_WALLET_ADDRESS}`,
            method: 'GET'
        },
        {
            name: 'TronGrid API',
            url: 'https://api.nileex.io/v1/accounts/test-tokens',
            method: 'POST',
            data: {
                address: MASTER_WALLET_ADDRESS,
                amount: 1000,
                token: 'USDT'
            }
        }
    ];
    
    for (const endpoint of apiEndpoints) {
        try {
            console.log(`尝试 ${endpoint.name}...`);
            
            const config = {
                method: endpoint.method,
                url: endpoint.url,
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };
            
            if (endpoint.data) {
                config.data = endpoint.data;
            }
            
            const response = await axios(config);
            
            console.log(`✅ ${endpoint.name} 响应:`, response.status);
            console.log('响应数据:', JSON.stringify(response.data, null, 2));
            
            return true;
            
        } catch (error) {
            console.log(`❌ ${endpoint.name} 失败:`, error.response?.status || error.message);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return false;
}

/**
 * 检查是否有其他可用的测试网 USDT 合约
 */
async function findAlternativeUSDTContracts() {
    console.log('🔍 查找其他可用的测试网 USDT 合约...');
    
    const alternativeContracts = [
        'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs', // 原始合约
        'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj', // 当前使用的合约
        'TXYZopYRdj2D9XRtbG4uDiNpDGCdxjeBsQ', // 备用合约
        'TLBaRhANQoJFTqre9Nf1mjuwNWjCJeYqUL', // 另一个测试合约
        'TUpMhErZL2fhh4sVNULAbNKLokS4GjC1F4'  // 社区测试合约
    ];
    
    const tronWeb = initTronWeb();
    
    for (const contractAddress of alternativeContracts) {
        try {
            console.log(`检查合约: ${contractAddress}`);
            
            const contract = await tronWeb.contract().at(contractAddress);
            const name = await contract.name().call();
            const symbol = await contract.symbol().call();
            const decimals = await contract.decimals().call();
            
            console.log(`  ✅ 合约有效: ${name} (${symbol})`);
            
            // 检查余额
            const balance = await contract.balanceOf(MASTER_WALLET_ADDRESS).call();
            const amount = parseFloat(balance.toString()) / Math.pow(10, parseInt(decimals));
            
            console.log(`  💰 余额: ${amount} ${symbol}`);
            
            if (amount > 0) {
                console.log(`  🎉 找到有余额的合约: ${contractAddress}`);
                return {
                    address: contractAddress,
                    name: name,
                    symbol: symbol,
                    balance: amount
                };
            }
            
        } catch (error) {
            console.log(`  ❌ 合约无效: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return null;
}

/**
 * 生成获取测试 USDT 的指南
 */
function generateUSDTGuide() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 获取测试网 USDT 指南');
    console.log('='.repeat(60));
    
    console.log('🌐 官方渠道:');
    console.log('1. Nile 测试网官网: https://nileex.io');
    console.log('   - 点击 "Join Testnet" 按钮');
    console.log('   - 输入钱包地址获取测试代币');
    console.log('');
    
    console.log('2. TRON 开发者文档: https://developers.tron.network');
    console.log('   - 查看测试网络部分');
    console.log('   - 使用官方推荐的水龙头');
    console.log('');
    
    console.log('👥 社区渠道:');
    console.log('1. TRON 开发者 Telegram 群组');
    console.log('2. TRON Discord 社区');
    console.log('3. GitHub TRON 项目 Issues');
    console.log('');
    
    console.log('🔧 技术方案:');
    console.log('1. 部署自己的测试 TRC20 合约');
    console.log('2. 使用 TronBox 创建测试环境');
    console.log('3. 与其他开发者交换测试代币');
    console.log('');
    
    console.log('💡 临时解决方案:');
    console.log('1. 使用模拟数据测试系统功能');
    console.log('2. 先完善其他非代币相关功能');
    console.log('3. 等待官方测试网代币可用');
    
    console.log('='.repeat(60));
}

/**
 * 主函数
 */
async function getTestnetUSDTFromFaucet() {
    console.log('🎯 从测试网水龙头获取 USDT');
    console.log('目标地址:', MASTER_WALLET_ADDRESS);
    console.log('USDT 合约:', USDT_CONTRACT_ADDRESS);
    console.log('='.repeat(50));
    
    // 1. 检查当前余额
    const initialBalance = await checkUSDTBalance();
    
    if (initialBalance > 0) {
        console.log('✅ 已有 USDT 余额，无需获取更多');
        return true;
    }
    
    // 2. 尝试从水龙头获取
    console.log('\n🚰 尝试从水龙头获取 USDT...');
    const faucetSuccess = await requestUSDTFromNileFaucet();
    
    if (faucetSuccess) {
        console.log('⏳ 等待 30 秒后检查余额...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        const newBalance = await checkUSDTBalance();
        if (newBalance > initialBalance) {
            console.log('🎉 成功获取测试 USDT！');
            return true;
        }
    }
    
    // 3. 尝试通过 API 获取
    console.log('\n🔗 尝试通过 API 获取...');
    const apiSuccess = await requestTestTokensViaAPI();
    
    if (apiSuccess) {
        console.log('⏳ 等待 30 秒后检查余额...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        const newBalance = await checkUSDTBalance();
        if (newBalance > initialBalance) {
            console.log('🎉 成功通过 API 获取测试 USDT！');
            return true;
        }
    }
    
    // 4. 查找其他合约
    console.log('\n🔍 查找其他可用的测试合约...');
    const alternativeContract = await findAlternativeUSDTContracts();
    
    if (alternativeContract) {
        console.log('💡 建议更新配置使用有余额的合约:');
        console.log(`USDT_CONTRACT_ADDRESS=${alternativeContract.address}`);
        return true;
    }
    
    // 5. 生成获取指南
    console.log('\n❌ 自动获取失败，请参考以下指南:');
    generateUSDTGuide();
    
    return false;
}

// 执行获取测试 USDT
getTestnetUSDTFromFaucet()
    .then(success => {
        if (success) {
            console.log('\n🎉 测试 USDT 获取完成！');
        } else {
            console.log('\n⚠️  需要手动获取测试 USDT');
        }
    })
    .catch(console.error);