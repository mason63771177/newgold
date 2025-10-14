/**
 * 模拟USDT入金脚本
 * 用于测试完整的入金流程，包括创建用户、生成充值地址、模拟转账
 */

const { TronWeb } = require('tronweb');
const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * 初始化数据库连接
 */
async function initDatabase() {
    return await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gold7_game'
    });
}

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
 * 创建测试用户
 */
async function createTestUser(db, email) {
    try {
        const inviteCode = 'TEST' + Math.random().toString(36).substr(2, 6).toUpperCase();
        const [result] = await db.execute(
            'INSERT INTO users (email, password, invite_code, created_at) VALUES (?, ?, ?, NOW())',
            [email, 'test_password_hash', inviteCode]
        );
        
        console.log(`✅ 创建测试用户成功: ${email} (ID: ${result.insertId})`);
        return result.insertId;
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            // 用户已存在，获取用户ID
            const [rows] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
            console.log(`ℹ️ 用户已存在: ${email} (ID: ${rows[0].id})`);
            return rows[0].id;
        }
        throw error;
    }
}

/**
 * 生成用户充值地址
 */
async function generateDepositAddress(db, tronWeb, userId) {
    try {
        // 检查用户表中是否已有充值地址
        const [existing] = await db.execute(
            'SELECT deposit_address FROM users WHERE id = ? AND deposit_address IS NOT NULL',
            [userId]
        );
        
        if (existing.length > 0) {
            console.log(`ℹ️ 用户已有充值地址: ${existing[0].deposit_address}`);
            return existing[0].deposit_address;
        }
        
        // 生成新的充值地址
        const account = await tronWeb.createAccount();
        const depositAddress = account.address.base58;
        
        // 更新用户表中的充值地址
        await db.execute(
            'UPDATE users SET deposit_address = ?, deposit_address_created_at = NOW() WHERE id = ?',
            [depositAddress, userId]
        );
        
        console.log(`✅ 生成充值地址成功: ${depositAddress}`);
        return depositAddress;
    } catch (error) {
        console.error('生成充值地址失败:', error.message);
        throw error;
    }
}

/**
 * 模拟USDT转账到充值地址
 */
async function simulateUSDTDeposit(db, fromAddress, toAddress, amount, userId) {
    try {
        // 生成模拟交易哈希
        const txHash = 'sim_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // 创建模拟交易记录
        const mockTransaction = {
            txID: txHash,
            from: fromAddress,
            to: toAddress,
            amount: amount,
            timestamp: Date.now(),
            blockNumber: Math.floor(Math.random() * 1000000) + 50000000,
            contractAddress: process.env.USDT_CONTRACT_ADDRESS,
            type: 'TRC20',
            confirmed: true
        };
        
        console.log('📝 模拟交易详情:', mockTransaction);
        
        // 保存交易记录到数据库
        await db.execute(`
            INSERT INTO transactions (
                user_id, tx_hash, from_address, to_address, 
                amount, fee, type, status, wallet_address, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            userId, txHash, fromAddress, toAddress,
            amount, 0, 'deposit', 'completed', toAddress
        ]);
        
        // 更新用户余额
        await db.execute(`
            UPDATE users SET balance = balance + ? WHERE id = ?
        `, [amount, userId]);
        
        console.log(`✅ 模拟入金成功: ${amount} USDT`);
        console.log(`📊 交易哈希: ${txHash}`);
        
        return mockTransaction;
    } catch (error) {
        console.error('模拟入金失败:', error.message);
        throw error;
    }
}

/**
 * 检查用户余额
 */
async function checkUserBalance(db, userId) {
    try {
        const [rows] = await db.execute(
            'SELECT balance FROM users WHERE id = ?',
            [userId]
        );
        
        const balance = rows.length > 0 ? parseFloat(rows[0].balance) : 0;
        console.log(`💰 用户余额: ${balance} USDT`);
        return balance;
    } catch (error) {
        console.error('检查余额失败:', error.message);
        return 0;
    }
}

/**
 * 主函数
 */
async function main() {
    console.log('=== 模拟USDT入金测试 ===');
    console.log('时间:', new Date().toLocaleString());
    console.log('');
    
    const db = await initDatabase();
    const tronWeb = initTronWeb();
    
    try {
        // 1. 创建测试用户
        const testEmail = 'test_user_' + Date.now() + '@test.com';
        console.log('1️⃣ 创建测试用户...');
        const userId = await createTestUser(db, testEmail);
        
        // 2. 生成充值地址
        console.log('2️⃣ 生成充值地址...');
        const depositAddress = await generateDepositAddress(db, tronWeb, userId);
        
        // 3. 检查初始余额
        console.log('3️⃣ 检查初始余额...');
        const initialBalance = await checkUserBalance(db, userId);
        
        // 4. 模拟100 USDT入金
        console.log('4️⃣ 模拟100 USDT入金...');
        const masterWallet = process.env.MASTER_WALLET_ADDRESS;
        const transaction = await simulateUSDTDeposit(db, masterWallet, depositAddress, 100, userId);
        
        // 5. 检查入金后余额
        console.log('5️⃣ 检查入金后余额...');
        const finalBalance = await checkUserBalance(db, userId);
        
        // 6. 验证结果
        console.log('6️⃣ 验证结果...');
        const expectedBalance = initialBalance + 100;
        const success = Math.abs(finalBalance - expectedBalance) < 0.01;
        
        console.log('');
        console.log('=== 测试结果 ===');
        console.log(`用户邮箱: ${testEmail}`);
        console.log(`用户ID: ${userId}`);
        console.log(`充值地址: ${depositAddress}`);
        console.log(`初始余额: ${initialBalance} USDT`);
        console.log(`入金金额: 100 USDT`);
        console.log(`最终余额: ${finalBalance} USDT`);
        console.log(`交易哈希: ${transaction.txID}`);
        console.log(`测试状态: ${success ? '✅ 成功' : '❌ 失败'}`);
        
        return {
            success: success,
            userId: userId,
            userEmail: testEmail,
            depositAddress: depositAddress,
            transaction: transaction,
            initialBalance: initialBalance,
            finalBalance: finalBalance
        };
        
    } finally {
        await db.end();
    }
}

// 执行测试
main().then(result => {
    console.log('');
    console.log('测试完成:', JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
}).catch(error => {
    console.error('测试失败:', error);
    process.exit(1);
});