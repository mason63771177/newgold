const { TronWeb } = require('tronweb');

// 配置
const TRON_GRID_API = 'https://api.trongrid.io';
const USDT_CONTRACT_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const MASTER_WALLET_ADDRESS = 'TPRyvdMdisT45XgCHmySiUtvUTeaVzP3zb';

/**
 * 简单的余额检查
 */
async function simpleBalanceCheck() {
    try {
        console.log('=== 简单余额检查 ===');
        console.log('检查地址:', MASTER_WALLET_ADDRESS);
        
        // 初始化 TronWeb
        const tronWeb = new TronWeb({
            fullHost: TRON_GRID_API
        });

        console.log('\n1. 检查 TRX 余额...');
        try {
            const trxBalance = await tronWeb.trx.getBalance(MASTER_WALLET_ADDRESS);
            const trxFormatted = tronWeb.fromSun(trxBalance);
            console.log('TRX 余额:', trxFormatted, 'TRX');
        } catch (error) {
            console.log('TRX 余额查询失败:', error.message);
        }

        console.log('\n2. 检查账户信息...');
        try {
            const accountInfo = await tronWeb.trx.getAccount(MASTER_WALLET_ADDRESS);
            console.log('账户存在:', !!accountInfo.address);
            if (accountInfo.address) {
                console.log('账户类型:', accountInfo.type || 'Normal');
                console.log('创建时间:', accountInfo.create_time ? new Date(accountInfo.create_time).toLocaleString() : '未知');
            }
        } catch (error) {
            console.log('账户信息查询失败:', error.message);
        }

        console.log('\n3. 使用 HTTP API 直接查询 USDT 余额...');
        try {
            const axios = require('axios');
            
            // 构造 TRC20 余额查询请求
            const response = await axios.post(`${TRON_GRID_API}/wallet/triggerconstantcontract`, {
                owner_address: tronWeb.address.toHex(MASTER_WALLET_ADDRESS),
                contract_address: tronWeb.address.toHex(USDT_CONTRACT_ADDRESS),
                function_selector: 'balanceOf(address)',
                parameter: tronWeb.address.toHex(MASTER_WALLET_ADDRESS).substring(2).padStart(64, '0')
            });

            if (response.data && response.data.constant_result && response.data.constant_result[0]) {
                const balanceHex = response.data.constant_result[0];
                const balanceDecimal = parseInt(balanceHex, 16);
                const usdtBalance = balanceDecimal / 1000000; // USDT 有6位小数
                
                console.log('USDT 余额:', usdtBalance, 'USDT');
                
                if (usdtBalance >= 5000) {
                    console.log('\n🎉 充值成功！主钱包已有', usdtBalance, 'USDT');
                    return true;
                } else if (usdtBalance > 0) {
                    console.log('\n⚠️  检测到', usdtBalance, 'USDT，但少于预期的 5000 USDT');
                    return false;
                } else {
                    console.log('\n❌ 未检测到 USDT 余额');
                    return false;
                }
            } else {
                console.log('API 响应格式异常');
                return false;
            }
            
        } catch (error) {
            console.log('HTTP API 查询失败:', error.message);
            return false;
        }

    } catch (error) {
        console.error('检查失败:', error.message);
        return false;
    }
}

/**
 * 检查地址格式
 */
function checkAddressFormat() {
    console.log('\n=== 地址格式检查 ===');
    console.log('地址:', MASTER_WALLET_ADDRESS);
    console.log('长度:', MASTER_WALLET_ADDRESS.length);
    console.log('是否以T开头:', MASTER_WALLET_ADDRESS.startsWith('T'));
    console.log('是否为有效的 Base58 格式:', /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(MASTER_WALLET_ADDRESS));
    
    try {
        const tronWeb = new TronWeb({ fullHost: TRON_GRID_API });
        const hexAddress = tronWeb.address.toHex(MASTER_WALLET_ADDRESS);
        console.log('十六进制地址:', hexAddress);
        console.log('地址格式有效:', true);
    } catch (error) {
        console.log('地址格式无效:', error.message);
    }
}

// 执行检查
async function main() {
    checkAddressFormat();
    
    console.log('\n' + '='.repeat(50));
    const success = await simpleBalanceCheck();
    
    if (!success) {
        console.log('\n=== 故障排除建议 ===');
        console.log('1. 请在 https://tronscan.org 上搜索地址:', MASTER_WALLET_ADDRESS);
        console.log('2. 确认充值交易是否成功');
        console.log('3. 检查是否充值到了正确的地址');
        console.log('4. 如果交易显示成功但余额为0，可能是网络同步延迟');
    }
}

main();