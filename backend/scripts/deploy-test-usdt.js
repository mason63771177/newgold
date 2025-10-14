const { TronWeb } = require('tronweb');

// 测试网配置
const TESTNET_CONFIG = {
    fullHost: 'https://api.nileex.io',
    privateKey: '7bc70610b96693ac9672c2ed0d0c23e4bc8dd9884fc469d4df7a4b8b25edeb51'
};

const MASTER_WALLET_ADDRESS = 'TPRyvdMdisT45XgCHmySiUtvUTeaVzP3zb';

// 简化的 TRC20 USDT 合约代码
const TRC20_CONTRACT_CODE = `
pragma solidity ^0.8.0;

contract TestUSDT {
    string public name = "Test USDT";
    string public symbol = "TUSDT";
    uint8 public decimals = 6;
    uint256 public totalSupply = 1000000 * 10**6; // 1,000,000 TUSDT
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor() {
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    
    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
    
    // 铸造函数（仅用于测试）
    function mint(address to, uint256 amount) public {
        require(msg.sender == address(0x${MASTER_WALLET_ADDRESS.substring(2)}), "Only owner can mint");
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }
}
`;

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
 * 检查账户余额
 */
async function checkBalance(tronWeb) {
    try {
        const balance = await tronWeb.trx.getBalance(MASTER_WALLET_ADDRESS);
        const trxBalance = balance / 1000000;
        console.log('当前 TRX 余额:', trxBalance, 'TRX');
        
        if (trxBalance < 100) {
            console.log('⚠️  警告：TRX 余额较低，部署合约可能需要更多 TRX');
            return false;
        }
        
        return true;
    } catch (error) {
        console.log('查询余额失败:', error.message);
        return false;
    }
}

/**
 * 部署测试 USDT 合约
 */
async function deployTestUSDT() {
    console.log('🚀 开始部署测试 USDT 合约...');
    
    const tronWeb = initTronWeb();
    
    // 检查余额
    const hasEnoughBalance = await checkBalance(tronWeb);
    if (!hasEnoughBalance) {
        console.log('❌ TRX 余额不足，无法部署合约');
        return null;
    }
    
    try {
        // 编译合约（这里使用预编译的字节码）
        console.log('📝 准备合约字节码...');
        
        // 简化版：直接使用现有的测试网 USDT 合约
        // 在实际部署中，您需要使用 Solidity 编译器
        const contractAddress = 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs'; // Nile 测试网现有的 USDT 合约
        
        console.log('✅ 使用现有的测试网 USDT 合约:', contractAddress);
        
        // 验证合约是否可用
        const contract = await tronWeb.contract().at(contractAddress);
        
        // 尝试查询合约信息
        try {
            const name = await contract.name().call();
            const symbol = await contract.symbol().call();
            const decimals = await contract.decimals().call();
            
            console.log('📋 合约信息:');
            console.log('  名称:', name);
            console.log('  符号:', symbol);
            console.log('  小数位:', decimals.toString());
            
            return {
                address: contractAddress,
                contract: contract,
                name: name,
                symbol: symbol,
                decimals: decimals.toString()
            };
            
        } catch (contractError) {
            console.log('❌ 合约验证失败:', contractError.message);
            console.log('尝试部署新的测试合约...');
            
            // 这里可以添加实际的合约部署逻辑
            return await deployNewTestContract(tronWeb);
        }
        
    } catch (error) {
        console.log('❌ 部署失败:', error.message);
        return null;
    }
}

/**
 * 部署新的测试合约（简化版）
 */
async function deployNewTestContract(tronWeb) {
    console.log('🔨 部署新的测试 USDT 合约...');
    
    // 注意：实际部署需要 Solidity 编译器和完整的部署流程
    // 这里提供一个简化的示例
    
    console.log('📝 合约部署需要以下步骤：');
    console.log('1. 安装 TronBox: npm install -g tronbox');
    console.log('2. 创建 TronBox 项目: tronbox init');
    console.log('3. 编写 Solidity 合约');
    console.log('4. 配置网络参数');
    console.log('5. 编译和部署: tronbox migrate --network nile');
    
    console.log('\n💡 临时解决方案：');
    console.log('使用现有的测试网代币或创建简单的转账功能进行测试');
    
    return null;
}

/**
 * 铸造测试 USDT
 */
async function mintTestUSDT(contractInfo, amount = 5000) {
    if (!contractInfo) {
        console.log('❌ 没有可用的合约信息');
        return false;
    }
    
    console.log(`💰 尝试铸造 ${amount} 测试 USDT...`);
    
    try {
        const tronWeb = initTronWeb();
        const contract = contractInfo.contract;
        
        // 检查当前余额
        const balance = await contract.balanceOf(MASTER_WALLET_ADDRESS).call();
        const currentBalance = parseFloat(balance.toString()) / Math.pow(10, parseInt(contractInfo.decimals));
        
        console.log('当前 USDT 余额:', currentBalance);
        
        if (currentBalance >= amount) {
            console.log('✅ 余额充足，无需铸造');
            return true;
        }
        
        // 尝试铸造（如果合约支持）
        console.log('🔄 尝试铸造代币...');
        
        // 注意：大多数现有的测试网合约不支持任意铸造
        // 这里提供替代方案
        console.log('💡 获取测试 USDT 的替代方案：');
        console.log('1. 在测试网社区请求空投');
        console.log('2. 使用测试网水龙头（如果有）');
        console.log('3. 与其他开发者交换');
        console.log('4. 部署自己的测试合约');
        
        return false;
        
    } catch (error) {
        console.log('❌ 铸造失败:', error.message);
        return false;
    }
}

/**
 * 主函数
 */
async function deployAndSetupTestUSDT() {
    console.log('🎯 开始设置测试网 USDT...');
    console.log('目标地址:', MASTER_WALLET_ADDRESS);
    console.log('='.repeat(50));
    
    // 1. 部署或获取测试 USDT 合约
    const contractInfo = await deployTestUSDT();
    
    if (contractInfo) {
        console.log('\n✅ 测试 USDT 合约准备就绪');
        console.log('合约地址:', contractInfo.address);
        
        // 2. 尝试获取测试 USDT
        const mintSuccess = await mintTestUSDT(contractInfo, 5000);
        
        if (mintSuccess) {
            console.log('\n🎉 测试 USDT 设置完成！');
            console.log('现在可以开始测试钱包功能了。');
            
            // 3. 更新配置建议
            console.log('\n=== 配置更新 ===');
            console.log('请在 .env 文件中更新以下配置：');
            console.log('TRON_NETWORK=testnet');
            console.log('TRON_GRID_API=https://api.nileex.io');
            console.log(`USDT_CONTRACT_ADDRESS=${contractInfo.address}`);
            
        } else {
            console.log('\n⚠️  测试 USDT 获取失败');
            console.log('建议手动获取测试代币或使用模拟数据进行测试');
        }
        
    } else {
        console.log('\n❌ 测试 USDT 合约设置失败');
        console.log('建议：');
        console.log('1. 检查网络连接');
        console.log('2. 确认 TRX 余额充足');
        console.log('3. 使用现有的测试网代币');
        console.log('4. 联系 TRON 开发者社区获取帮助');
    }
}

// 执行部署
deployAndSetupTestUSDT().catch(console.error);