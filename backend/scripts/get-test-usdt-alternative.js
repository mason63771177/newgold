const { TronWeb } = require('tronweb');
const axios = require('axios');

// 测试网配置
const TESTNET_CONFIG = {
    fullHost: 'https://api.nileex.io',
    privateKey: '7bc70610b96693ac9672c2ed0d0c23e4bc8dd9884fc469d4df7a4b8b25edeb51'
};

const MASTER_WALLET_ADDRESS = 'TPRyvdMdisT45XgCHmySiUtvUTeaVzP3zb';

// 已知的测试网 USDT 合约地址
const TEST_USDT_CONTRACTS = [
    'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs', // Nile 测试网 USDT
    'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj', // 另一个测试网 USDT
    'TXYZopYRdj2D9XRtbG4uDiNpDGCdxjeBsQ'  // 备用测试网 USDT
];

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
 * 检查合约是否有效
 */
async function checkContract(tronWeb, contractAddress) {
    try {
        console.log(`🔍 检查合约: ${contractAddress}`);
        
        // 检查合约是否存在
        const contractInfo = await tronWeb.trx.getContract(contractAddress);
        if (!contractInfo || !contractInfo.contract_address) {
            console.log('❌ 合约不存在');
            return null;
        }
        
        // 尝试获取合约实例
        const contract = await tronWeb.contract().at(contractAddress);
        
        // 尝试调用基本方法
        const name = await contract.name().call();
        const symbol = await contract.symbol().call();
        const decimals = await contract.decimals().call();
        
        console.log('✅ 合约有效:');
        console.log(`  名称: ${name}`);
        console.log(`  符号: ${symbol}`);
        console.log(`  小数位: ${decimals}`);
        
        // 检查余额
        const balance = await contract.balanceOf(MASTER_WALLET_ADDRESS).call();
        const formattedBalance = parseFloat(balance.toString()) / Math.pow(10, parseInt(decimals));
        console.log(`  当前余额: ${formattedBalance} ${symbol}`);
        
        return {
            address: contractAddress,
            contract: contract,
            name: name,
            symbol: symbol,
            decimals: parseInt(decimals),
            balance: formattedBalance
        };
        
    } catch (error) {
        console.log(`❌ 合约检查失败: ${error.message}`);
        return null;
    }
}

/**
 * 尝试从水龙头获取测试代币
 */
async function requestFromFaucet(contractAddress) {
    console.log('🚰 尝试从水龙头获取测试代币...');
    
    const faucetUrls = [
        'https://nileex.io/join/getJoinPage',
        'https://www.trongrid.io/faucet',
        'https://developers.tron.network/docs/networks#nile-testnet'
    ];
    
    for (const url of faucetUrls) {
        try {
            console.log(`尝试访问: ${url}`);
            
            // 这里只是示例，实际的水龙头 API 可能不同
            const response = await axios.post(url, {
                address: MASTER_WALLET_ADDRESS,
                token: contractAddress
            }, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }
            });
            
            if (response.status === 200) {
                console.log('✅ 水龙头请求成功');
                return true;
            }
            
        } catch (error) {
            console.log(`❌ 水龙头请求失败: ${error.message}`);
        }
    }
    
    console.log('💡 自动水龙头请求失败，请手动访问以下网站：');
    console.log('1. https://nileex.io/join/getJoinPage');
    console.log('2. https://www.trongrid.io/faucet');
    console.log('3. 在 TRON 开发者社区请求测试代币');
    
    return false;
}

/**
 * 创建简单的测试代币转账
 */
async function createTestTransaction(validContract) {
    console.log('💸 创建测试交易以验证功能...');
    
    try {
        const tronWeb = initTronWeb();
        
        // 创建一个小额的自转账交易（从自己转给自己）
        const amount = 1 * Math.pow(10, validContract.decimals); // 1 个代币
        
        console.log(`准备转账 1 ${validContract.symbol} 到自己的地址...`);
        
        // 检查是否有足够余额
        if (validContract.balance < 1) {
            console.log('❌ 余额不足，无法创建测试交易');
            return false;
        }
        
        // 执行转账
        const result = await validContract.contract.transfer(
            MASTER_WALLET_ADDRESS,
            amount
        ).send({
            feeLimit: 100000000, // 100 TRX
            callValue: 0,
            shouldPollResponse: true
        });
        
        console.log('✅ 测试交易成功:');
        console.log(`  交易哈希: ${result}`);
        
        return true;
        
    } catch (error) {
        console.log(`❌ 测试交易失败: ${error.message}`);
        return false;
    }
}

/**
 * 部署简单的测试代币合约
 */
async function deploySimpleTestToken() {
    console.log('🔨 部署简单的测试代币合约...');
    
    // 简单的 TRC20 合约字节码（预编译）
    const simpleTokenBytecode = `
608060405234801561001057600080fd5b506040518060400160405280600881526020017f546573745553445400000000000000000000000000000000000000000000000081525060009080519060200190610060929190610164565b506040518060400160405280600581526020017f5455534454000000000000000000000000000000000000000000000000000000815250600190805190602001906100ac929190610164565b506006600260006101000a81548160ff021916908360ff16021790555069152d02c7e14af6800000600381905550600354600460003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055503373ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef6003546040518082815260200191505060405180910390a3610209565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106101a557805160ff19168380011785556101d3565b828001600101855582156101d3579182015b828111156101d25782518255916020019190600101906101b7565b5b5090506101e091906101e4565b5090565b61020691905b808211156102025760008160009055506001016101ea565b5090565b90565b610c3f806102186000396000f3fe`;
    
    try {
        const tronWeb = initTronWeb();
        
        console.log('📝 准备部署合约...');
        
        // 注意：这里需要完整的合约部署流程
        // 由于 TronWeb 的限制，我们提供一个简化的示例
        
        console.log('💡 合约部署需要以下步骤：');
        console.log('1. 准备完整的合约源码');
        console.log('2. 使用 TronBox 或 TronIDE 编译');
        console.log('3. 获取编译后的字节码和 ABI');
        console.log('4. 使用 TronWeb 部署合约');
        
        console.log('\n🔧 临时解决方案：');
        console.log('使用现有的测试网代币进行功能测试');
        
        return null;
        
    } catch (error) {
        console.log(`❌ 合约部署失败: ${error.message}`);
        return null;
    }
}

/**
 * 主函数
 */
async function getTestUSDTAlternative() {
    console.log('🎯 获取测试网 USDT - 替代方案');
    console.log('目标地址:', MASTER_WALLET_ADDRESS);
    console.log('='.repeat(50));
    
    const tronWeb = initTronWeb();
    let validContract = null;
    
    // 1. 检查已知的测试网 USDT 合约
    console.log('📋 检查已知的测试网 USDT 合约...');
    
    for (const contractAddress of TEST_USDT_CONTRACTS) {
        const contractInfo = await checkContract(tronWeb, contractAddress);
        if (contractInfo) {
            validContract = contractInfo;
            break;
        }
        
        // 等待一下避免请求过快
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (validContract) {
        console.log('\n✅ 找到有效的测试网代币合约');
        console.log('合约地址:', validContract.address);
        console.log('当前余额:', validContract.balance, validContract.symbol);
        
        if (validContract.balance > 0) {
            console.log('\n🎉 已有测试代币余额！');
            
            // 创建测试交易验证功能
            await createTestTransaction(validContract);
            
            console.log('\n=== 配置更新建议 ===');
            console.log('请在 .env 文件中更新：');
            console.log('TRON_NETWORK=testnet');
            console.log('TRON_GRID_API=https://api.nileex.io');
            console.log(`USDT_CONTRACT_ADDRESS=${validContract.address}`);
            
            return validContract;
            
        } else {
            console.log('\n💰 余额为 0，尝试获取测试代币...');
            
            // 尝试从水龙头获取
            const faucetSuccess = await requestFromFaucet(validContract.address);
            
            if (!faucetSuccess) {
                console.log('\n💡 获取测试代币的方法：');
                console.log('1. 访问 https://nileex.io 获取测试代币');
                console.log('2. 在 TRON 开发者 Telegram 群组请求');
                console.log('3. 使用 TRON 官方测试网水龙头');
                console.log('4. 与其他开发者交换测试代币');
                
                console.log('\n🔧 临时解决方案：');
                console.log('可以先配置系统使用模拟数据进行测试');
            }
            
            return validContract;
        }
        
    } else {
        console.log('\n❌ 未找到有效的测试网 USDT 合约');
        
        // 尝试部署简单的测试代币
        console.log('\n🔨 尝试部署自定义测试代币...');
        const deployedContract = await deploySimpleTestToken();
        
        if (deployedContract) {
            return deployedContract;
        } else {
            console.log('\n💡 建议的解决方案：');
            console.log('1. 联系 TRON 开发者社区获取帮助');
            console.log('2. 使用 TronBox 部署自定义测试合约');
            console.log('3. 先使用模拟数据测试系统功能');
            console.log('4. 等待官方测试网代币可用');
            
            return null;
        }
    }
}

// 执行获取测试 USDT
getTestUSDTAlternative()
    .then(result => {
        if (result) {
            console.log('\n🎉 测试网 USDT 设置完成！');
            console.log('现在可以继续测试钱包功能了。');
        } else {
            console.log('\n⚠️  测试网 USDT 设置未完成');
            console.log('建议使用模拟数据继续开发和测试。');
        }
    })
    .catch(console.error);