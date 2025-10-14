/**
 * 高级测试USDT获取脚本
 * 尝试多种方法获取测试代币，包括水龙头、API和部署测试合约
 */

const { TronWeb } = require('tronweb');
const axios = require('axios');
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
 * 检查USDT余额
 */
async function checkUsdtBalance(tronWeb, address, contractAddress) {
    try {
        const contract = await tronWeb.contract().at(contractAddress);
        const balance = await contract.balanceOf(address).call();
        return tronWeb.toDecimal(balance) / Math.pow(10, 6);
    } catch (error) {
        console.error('检查USDT余额失败:', error.message);
        return 0;
    }
}

/**
 * 尝试从Nile测试网水龙头获取USDT
 */
async function tryNileFaucet(address) {
    console.log('尝试从Nile测试网水龙头获取USDT...');
    
    const faucetUrls = [
        'https://nileex.io/join/getJoinPage',
        'https://nile.tronscan.org/#/tools/trc20-faucet',
        'https://testfaucet.shasta.tronex.io'
    ];
    
    for (const url of faucetUrls) {
        try {
            console.log(`尝试访问水龙头: ${url}`);
            const response = await axios.get(url, { timeout: 10000 });
            console.log(`水龙头响应状态: ${response.status}`);
            
            // 如果是nileex.io，尝试提交表单
            if (url.includes('nileex.io')) {
                try {
                    const formData = {
                        address: address,
                        token: 'USDT'
                    };
                    
                    const postResponse = await axios.post('https://nileex.io/join/getJoinPage', formData, {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        timeout: 15000
                    });
                    
                    console.log('水龙头请求提交成功，状态:', postResponse.status);
                    return true;
                } catch (postError) {
                    console.log('水龙头表单提交失败:', postError.message);
                }
            }
        } catch (error) {
            console.log(`水龙头 ${url} 访问失败:`, error.message);
        }
    }
    
    return false;
}

/**
 * 尝试通过TronGrid API获取测试代币
 */
async function tryTronGridAPI(address) {
    console.log('尝试通过TronGrid API获取测试代币...');
    
    const apiEndpoints = [
        'https://api.nileex.io/wallet/gettestcoin',
        'https://api.nileex.io/v1/testnet/faucet',
        'https://nile.trongrid.io/wallet/gettestcoin'
    ];
    
    for (const endpoint of apiEndpoints) {
        try {
            console.log(`尝试API端点: ${endpoint}`);
            
            const response = await axios.post(endpoint, {
                address: address,
                amount: 100000000 // 100 USDT (6位小数)
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });
            
            console.log(`API响应:`, response.data);
            
            if (response.status === 200) {
                return true;
            }
        } catch (error) {
            console.log(`API ${endpoint} 请求失败:`, error.message);
        }
    }
    
    return false;
}

/**
 * 部署简单的测试USDT合约
 */
async function deployTestUSDTContract(tronWeb) {
    console.log('尝试部署测试USDT合约...');
    
    // 简单的ERC20测试合约
    const contractCode = `
        pragma solidity ^0.8.0;
        
        contract TestUSDT {
            string public name = "Test USDT";
            string public symbol = "TUSDT";
            uint8 public decimals = 6;
            uint256 public totalSupply = 1000000 * 10**6; // 1M USDT
            
            mapping(address => uint256) public balanceOf;
            
            constructor() {
                balanceOf[msg.sender] = totalSupply;
            }
            
            function transfer(address to, uint256 amount) public returns (bool) {
                require(balanceOf[msg.sender] >= amount, "Insufficient balance");
                balanceOf[msg.sender] -= amount;
                balanceOf[to] += amount;
                return true;
            }
            
            function mint(address to, uint256 amount) public {
                balanceOf[to] += amount;
                totalSupply += amount;
            }
        }
    `;
    
    try {
        // 注意：实际部署需要私钥，这里只是示例
        console.log('测试合约代码准备完成');
        console.log('实际部署需要配置私钥和编译合约');
        return null;
    } catch (error) {
        console.error('部署测试合约失败:', error.message);
        return null;
    }
}

/**
 * 创建模拟USDT转账（用于测试）
 */
async function createMockUSDTTransfer(tronWeb, toAddress, amount) {
    console.log('创建模拟USDT转账记录...');
    
    // 这里可以创建一个模拟的转账记录用于测试
    const mockTransaction = {
        txID: 'mock_' + Date.now(),
        from: process.env.MASTER_WALLET_ADDRESS,
        to: toAddress,
        amount: amount,
        timestamp: Date.now(),
        type: 'mock_transfer'
    };
    
    console.log('模拟转账记录:', mockTransaction);
    return mockTransaction;
}

/**
 * 主函数
 */
async function main() {
    console.log('=== 高级测试USDT获取 ===');
    console.log('时间:', new Date().toLocaleString());
    
    const tronWeb = initTronWeb();
    const masterWallet = process.env.MASTER_WALLET_ADDRESS;
    const usdtContract = process.env.USDT_CONTRACT_ADDRESS;
    
    console.log('主钱包地址:', masterWallet);
    console.log('USDT合约地址:', usdtContract);
    console.log('');
    
    // 检查初始余额
    console.log('检查初始USDT余额...');
    const initialBalance = await checkUsdtBalance(tronWeb, masterWallet, usdtContract);
    console.log(`初始USDT余额: ${initialBalance} USDT`);
    console.log('');
    
    // 方法1: 尝试水龙头
    const faucetSuccess = await tryNileFaucet(masterWallet);
    if (faucetSuccess) {
        console.log('水龙头请求可能成功，等待30秒后检查余额...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        const newBalance = await checkUsdtBalance(tronWeb, masterWallet, usdtContract);
        if (newBalance > initialBalance) {
            console.log(`✅ 成功获取 ${newBalance - initialBalance} USDT`);
            return { success: true, method: 'faucet', amount: newBalance - initialBalance };
        }
    }
    
    // 方法2: 尝试API
    const apiSuccess = await tryTronGridAPI(masterWallet);
    if (apiSuccess) {
        console.log('API请求可能成功，等待30秒后检查余额...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        const newBalance = await checkUsdtBalance(tronWeb, masterWallet, usdtContract);
        if (newBalance > initialBalance) {
            console.log(`✅ 成功获取 ${newBalance - initialBalance} USDT`);
            return { success: true, method: 'api', amount: newBalance - initialBalance };
        }
    }
    
    // 方法3: 部署测试合约
    console.log('尝试部署测试合约方案...');
    const testContract = await deployTestUSDTContract(tronWeb);
    
    // 方法4: 创建模拟转账用于测试
    console.log('创建模拟转账用于测试...');
    const mockTransfer = await createMockUSDTTransfer(tronWeb, masterWallet, 100);
    
    console.log('');
    console.log('=== 获取结果 ===');
    console.log('自动获取失败，建议手动操作：');
    console.log('1. 访问 https://nileex.io/join/getJoinPage');
    console.log('2. 输入钱包地址:', masterWallet);
    console.log('3. 选择USDT代币');
    console.log('4. 完成验证码');
    console.log('5. 等待代币到账');
    console.log('');
    console.log('或者使用模拟转账进行测试:', mockTransfer);
    
    return { 
        success: false, 
        method: 'manual', 
        mockTransfer: mockTransfer,
        instructions: '需要手动获取测试USDT'
    };
}

// 执行获取
main().then(result => {
    console.log('获取结果:', JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
}).catch(error => {
    console.error('获取失败:', error);
    process.exit(1);
});