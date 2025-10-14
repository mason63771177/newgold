/**
 * 测试交易监听功能
 */

const walletService = require('../services/realTatumWalletService');
const { pool } = require('../config/database');

/**
 * 创建测试用户
 */
async function createTestUser() {
    try {
        const email = `test_${Date.now()}@example.com`;
        const inviteCode = `TEST${Date.now()}`;
        const [result] = await pool.execute(
            'INSERT INTO users (email, password, invite_code, balance) VALUES (?, ?, ?, ?)',
            [email, 'test_password', inviteCode, 0]
        );
        console.log(`✅ 创建测试用户成功: ID=${result.insertId}, 邮箱=${email}`);
        return result.insertId;
    } catch (error) {
        console.error('❌ 创建测试用户失败:', error.message);
        throw error;
    }
}

async function testTransactionMonitoring() {
    console.log('开始测试交易监听功能...\n');

    try {
        // 初始化钱包服务
        await walletService.initialize();

        // 测试地址（有交易记录的地址）
        const testAddress = 'TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH';
        
        console.log('='.repeat(50));
        console.log('1. 测试获取交易记录...');
        console.log(`测试地址: ${testAddress}`);
        
        const result = await walletService.getAddressTransactions(testAddress, {
            onlyConfirmed: true
        });
        
        console.log('✅ 交易记录获取成功:');
        console.log(`   交易数量: ${result.transactions.length}`);
        console.log(`   是否有更多: ${result.hasMore}`);
        console.log(`   下一页标识: ${result.next || '无'}`);
        
        if (result.transactions.length > 0) {
            console.log('\n最近的交易记录:');
            result.transactions.slice(0, 3).forEach((tx, index) => {
                console.log(`\n交易 ${index + 1}:`);
                console.log(`   哈希: ${tx.txHash}`);
                console.log(`   类型: ${tx.type}`);
                console.log(`   代币: ${tx.token}`);
                console.log(`   金额: ${tx.amount}`);
                console.log(`   从: ${tx.from}`);
                console.log(`   到: ${tx.to}`);
                console.log(`   状态: ${tx.status}`);
                console.log(`   时间: ${tx.timestamp ? new Date(tx.timestamp).toISOString() : '未知'}`);
            });
        }

        console.log('\n' + '='.repeat(50));
        console.log('2. 测试新地址（无交易记录）...');
        
        // 先创建一个测试用户
        const testUserId = await createTestUser();
        const newAddress = await walletService.createDepositAddress(testUserId);
        console.log(`新地址: ${newAddress}`);
        
        const newResult = await walletService.getAddressTransactions(newAddress);
        console.log('✅ 新地址交易记录获取成功:');
        console.log(`   交易数量: ${newResult.transactions.length}`);
        console.log(`   是否有更多: ${newResult.hasMore}`);

        console.log('\n' + '='.repeat(50));
        console.log('3. 测试分页查询...');
        
        const paginatedResult = await walletService.getAddressTransactions(testAddress, {
            onlyConfirmed: true,
            onlyTo: true // 只查询转入交易
        });
        
        console.log('✅ 分页查询成功:');
        console.log(`   转入交易数量: ${paginatedResult.transactions.length}`);
        
        const depositTransactions = paginatedResult.transactions.filter(tx => tx.type === 'deposit');
        console.log(`   充值交易数量: ${depositTransactions.length}`);

        console.log('\n' + '='.repeat(50));
        console.log('4. 测试 TRC20 交易过滤...');
        
        const usdtTransactions = paginatedResult.transactions.filter(tx => 
            tx.token === 'USDT' || tx.contractAddress === 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
        );
        
        console.log('✅ USDT 交易过滤成功:');
        console.log(`   USDT 交易数量: ${usdtTransactions.length}`);
        
        if (usdtTransactions.length > 0) {
            console.log('\nUSDT 交易示例:');
            usdtTransactions.slice(0, 2).forEach((tx, index) => {
                console.log(`\nUSDT 交易 ${index + 1}:`);
                console.log(`   哈希: ${tx.txHash}`);
                console.log(`   类型: ${tx.type}`);
                console.log(`   金额: ${tx.amount} ${tx.token}`);
                console.log(`   合约地址: ${tx.contractAddress}`);
            });
        }

        console.log('\n交易监听功能测试完成！');

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error('错误详情:', error);
    }
}

// 运行测试
testTransactionMonitoring().catch(console.error);