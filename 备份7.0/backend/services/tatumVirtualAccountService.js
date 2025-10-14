/**
 * Tatum虚拟账户服务
 * 实现基于Tatum Virtual Accounts的会员钱包管理
 * 支持TRC20 USDT的充值监听、自动归集和回调通知
 */

const axios = require('axios');
const { pool, redisClient } = require('../config/database');
const crypto = require('crypto');

class TatumVirtualAccountService {
    constructor() {
        this.isInitialized = false;
        this.apiKey = process.env.TATUM_API_KEY;
        this.baseUrl = process.env.TATUM_NETWORK === 'mainnet' 
            ? 'https://api.tatum.io' 
            : 'https://api.tatum.io';
        this.webhookUrl = process.env.WEBHOOK_CALLBACK_URL || 'https://your-domain.com/api/tatum/webhook';
        this.masterAccountId = null;
        
        // 配置 axios 实例
        this.api = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'x-api-key': this.apiKey,
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * 初始化虚拟账户系统
     */
    async initialize() {
        try {
            if (this.isInitialized) return;

            console.log('🚀 初始化 Tatum 虚拟账户服务...');
            
            // 初始化主账户
            await this.initializeMasterAccount();
            
            this.isInitialized = true;
            console.log('✅ Tatum 虚拟账户服务初始化完成');
        } catch (error) {
            console.error('❌ Tatum虚拟账户服务初始化失败:', error);
            throw error;
        }
    }

    /**
     * 初始化或获取主账户
     */
    async initializeMasterAccount() {
        try {
            // 查找现有主账户
            const existingAccount = await this.findMasterAccount();
            if (existingAccount) {
                this.masterAccountId = existingAccount.id;
                console.log(`✅ 找到现有主账户: ${this.masterAccountId}`);
                return;
            }

            // 创建新的主账户
            const response = await this.api.post('/v3/ledger/account', {
                currency: 'USDT',
                customerId: 'master_wallet',
                accountingCurrency: 'USD',
                accountCode: 'MASTER_ACCOUNT'
            });

            this.masterAccountId = response.data.id;
            console.log(`✅ 创建新主账户: ${this.masterAccountId}`);

        } catch (error) {
            console.error('❌ 初始化主账户失败:', error);
            throw error;
        }
    }

    /**
     * 查找主账户
     */
    async findMasterAccount() {
        try {
            // 从数据库查找主账户记录
            const [rows] = await pool.execute(
                'SELECT account_id FROM member_virtual_accounts WHERE user_id = ? AND account_code = ?',
                ['master', 'MASTER_ACCOUNT']
            );
            
            if (rows.length > 0) {
                return { id: rows[0].account_id };
            }
            
            return null;
        } catch (error) {
            console.error('❌ 查找主账户失败:', error);
            return null;
        }
    }

    /**
     * 为会员创建虚拟账户和充值地址
     * @param {string} userId - 会员ID
     * @returns {Object} 虚拟账户信息
     */
    async createMemberVirtualAccount(userId) {
        try {
            await this.initialize();

            // 检查是否已存在虚拟账户
            const existingAccount = await this.getMemberVirtualAccount(userId);
            if (existingAccount) {
                console.log(`会员 ${userId} 已有虚拟账户: ${existingAccount.account_id}`);
                return {
                    accountId: existingAccount.account_id,
                    depositAddress: existingAccount.deposit_address,
                    currency: 'USDT',
                    created: existingAccount.created_at
                };
            }

            // 创建虚拟账户
            const response = await this.api.post('/v3/ledger/account', {
                currency: 'USDT',
                customerId: `user_${userId}`,
                accountingCurrency: 'USD',
                accountCode: `USER_${userId}`
            });

            const accountId = response.data.id;
            console.log(`✅ 为会员 ${userId} 创建虚拟账户: ${accountId}`);

            // 生成充值地址
            const addressResponse = await this.api.post('/v3/offchain/account/address', {
                accountId: accountId,
                index: 0
            });

            const depositAddress = addressResponse.data.address;

            console.log(`✅ 为会员 ${userId} 生成充值地址: ${depositAddress}`);

            // 设置入金监听
            await this.setupDepositWebhook(accountId);

            // 保存到数据库
            await this.saveMemberVirtualAccount(userId, accountId, depositAddress);

            return {
                accountId: accountId,
                depositAddress: depositAddress,
                currency: 'USDT',
                created: new Date().toISOString()
            };

        } catch (error) {
            console.error(`❌ 为会员 ${userId} 创建虚拟账户失败:`, error);
            throw error;
        }
    }

    /**
     * 获取会员虚拟账户信息
     * @param {number} userId - 用户ID
     * @returns {Object|null} 虚拟账户信息
     */
    async getMemberVirtualAccount(userId) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM member_virtual_accounts WHERE user_id = ? AND status = ?',
                [userId, 'active']
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error(`❌ 获取用户 ${userId} 虚拟账户失败:`, error);
            throw error;
        }
    }

    /**
     * 保存会员虚拟账户信息
     * @param {number} userId - 用户ID
     * @param {string} accountId - 账户ID
     * @param {string} depositAddress - 充值地址
     */
    async saveMemberVirtualAccount(userId, accountId, depositAddress) {
        try {
            await pool.execute(
                `INSERT INTO member_virtual_accounts 
                (user_id, account_id, deposit_address, currency, status, created_at) 
                VALUES (?, ?, ?, ?, ?, NOW())`,
                [userId, accountId, depositAddress, 'USDT', 'active']
            );
            console.log(`✅ 保存用户 ${userId} 虚拟账户信息成功`);
        } catch (error) {
            console.error(`❌ 保存用户 ${userId} 虚拟账户信息失败:`, error);
            throw error;
        }
    }

    /**
     * 设置入金监听Webhook
     * @param {string} accountId - 虚拟账户ID
     */
    async setupDepositWebhook(accountId) {
        try {
            const response = await this.api.post('/v3/subscription', {
                type: 'ACCOUNT_INCOMING_BLOCKCHAIN_TRANSACTION',
                attr: {
                    id: accountId,
                    url: this.webhookUrl
                }
            });

            const subscription = response.data;

            console.log(`✅ 为账户 ${accountId} 设置入金监听: ${subscription.id}`);

            // 保存订阅信息到数据库
            await pool.execute(
                `INSERT INTO webhook_subscriptions 
                (account_id, subscription_id, webhook_url, type, status, created_at) 
                VALUES (?, ?, ?, ?, ?, NOW())`,
                [accountId, subscription.id, this.webhookUrl, 'DEPOSIT', 'active']
            );

            return subscription;

        } catch (error) {
            console.error(`❌ 设置账户 ${accountId} 入金监听失败:`, error);
            throw error;
        }
    }

    /**
     * 处理入金回调
     * @param {Object} webhookData - Webhook数据
     * @returns {Object} 处理结果
     */
    async processDepositCallback(webhookData) {
        try {
            console.log('📥 收到入金回调:', JSON.stringify(webhookData, null, 2));

            const {
                accountId,
                currency,
                amount,
                txId,
                blockNumber,
                subscriptionType,
                address
            } = webhookData;

            // 验证是否为USDT入金
            if (currency !== 'USDT' || subscriptionType !== 'ACCOUNT_INCOMING_BLOCKCHAIN_TRANSACTION') {
                console.log('⚠️ 非USDT入金交易，忽略处理');
                return { success: false, reason: 'Not USDT transaction' };
            }

            // 获取会员信息
            const memberInfo = await this.getMemberByAccountId(accountId);
            if (!memberInfo) {
                console.error(`❌ 未找到账户 ${accountId} 对应的会员信息`);
                return { success: false, reason: 'Member not found' };
            }

            // 检查是否已处理过此交易
            const existingDeposit = await this.getDepositByTxHash(txId);
            if (existingDeposit) {
                console.log(`⚠️ 交易 ${txId} 已处理过，跳过`);
                return { success: false, reason: 'Transaction already processed' };
            }

            // 记录入金信息
            const depositData = {
                userId: memberInfo.user_id,
                accountId,
                txHash: txId,
                amount: parseFloat(amount),
                currency: 'USDT',
                fromAddress: address,
                blockNumber: parseInt(blockNumber),
                status: 'confirmed'
            };

            await this.recordDeposit(depositData);

            // 更新会员余额
            await this.updateMemberBalance(memberInfo.user_id, parseFloat(amount), 'deposit');

            console.log(`✅ 入金处理成功: 用户 ${memberInfo.user_id} 充值 ${amount} USDT`);

            return {
                success: true,
                userId: memberInfo.user_id,
                amount: parseFloat(amount),
                txHash: txId
            };

        } catch (error) {
            console.error('❌ 处理入金回调失败:', error);
            throw error;
        }
    }

    /**
     * 根据账户ID获取会员信息
     * @param {string} accountId - 虚拟账户ID
     * @returns {Object|null} 会员信息
     */
    async getMemberByAccountId(accountId) {
        try {
            const query = `
                SELECT user_id, deposit_address 
                FROM member_virtual_accounts 
                WHERE account_id = ?
            `;
            const [rows] = await pool.execute(query, [accountId]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('根据账户ID获取会员信息失败:', error);
            throw error;
        }
    }

    /**
     * 检查交易是否已处理
     * @param {string} txHash - 交易哈希
     * @returns {Object|null} 充值记录
     */
    async getDepositByTxHash(txHash) {
        try {
            const query = `
                SELECT id, user_id, amount, status 
                FROM member_deposits 
                WHERE tx_hash = ?
            `;
            const [rows] = await pool.execute(query, [txHash]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('检查交易是否已处理失败:', error);
            throw error;
        }
    }

    /**
     * 记录充值交易
     * @param {Object} depositData - 充值数据
     * @returns {number} 充值记录ID
     */
    async recordDeposit(depositData) {
        try {
            const { userId, accountId, amount, txHash, blockNumber, fromAddress } = depositData;
            
            const query = `
                INSERT INTO member_deposits 
                (user_id, account_id, amount, tx_hash, block_number, from_address, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 'confirmed', NOW())
            `;
            
            const [result] = await pool.execute(query, [
                userId, accountId, amount, txHash, blockNumber, fromAddress
            ]);

            return result.insertId;
        } catch (error) {
            console.error('记录充值交易失败:', error);
            throw error;
        }
    }

    /**
     * 更新会员余额
     * @param {string} userId - 会员ID
     * @param {number} amount - 金额
     * @param {string} type - 类型 (deposit/withdraw)
     */
    async updateMemberBalance(userId, amount, type) {
        try {
            const operation = type === 'deposit' ? '+' : '-';
            const query = `
                UPDATE users 
                SET balance = balance ${operation} ?, updated_at = NOW()
                WHERE id = ?
            `;
            await pool.execute(query, [amount, userId]);

            // 记录余额变动日志
            await this.logBalanceChange(userId, amount, type);
        } catch (error) {
            console.error('更新会员余额失败:', error);
            throw error;
        }
    }

    /**
     * 记录余额变动日志
     * @param {string} userId - 会员ID
     * @param {number} amount - 金额
     * @param {string} type - 类型
     */
    async logBalanceChange(userId, amount, type) {
        try {
            const query = `
                INSERT INTO balance_logs 
                (user_id, amount, type, description, created_at)
                VALUES (?, ?, ?, ?, NOW())
            `;
            await pool.execute(query, [
                userId, 
                amount, 
                type, 
                `Virtual account ${type}: ${amount} USDT`
            ]);
        } catch (error) {
            console.error('记录余额变动日志失败:', error);
        }
    }

    /**
     * 执行资金归集到主账户
     * @param {string} accountId - 虚拟账户ID
     * @returns {Object} 归集结果
     */
    async consolidateFunds(accountId) {
        try {
            await this.initialize();

            // 获取账户余额
            const balanceResponse = await this.api.get(`/v3/ledger/account/${accountId}/balance`);
            const availableBalance = parseFloat(balanceResponse.data.availableBalance || '0');

            if (availableBalance <= 0) {
                console.log(`账户 ${accountId} 余额为0，跳过归集`);
                return { success: false, reason: 'Insufficient balance' };
            }

            // 执行虚拟账户间转账
            const transferResponse = await this.api.post('/v3/ledger/transaction', {
                senderAccountId: accountId,
                recipientAccountId: this.masterAccountId,
                amount: availableBalance.toString(),
                anonymous: false,
                compliant: false,
                transactionCode: `CONSOLIDATE_${Date.now()}`,
                paymentId: crypto.randomUUID(),
                recipientNote: 'Fund consolidation to master account',
                senderNote: 'Automatic fund consolidation'
            });

            const transfer = transferResponse.data;

            console.log(`✅ 资金归集成功: ${availableBalance} USDT from ${accountId} to ${this.masterAccountId}`);

            // 记录归集日志
            await this.recordConsolidation(accountId, availableBalance, transfer.reference);

            return {
                success: true,
                transactionId: transfer.reference,
                amount: availableBalance,
                fromAccount: accountId,
                toAccount: this.masterAccountId,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`❌ 资金归集失败 (${accountId}):`, error);
            throw error;
        }
    }

    /**
     * 记录归集操作
     * @param {string} fromAccountId - 源账户ID
     * @param {number} amount - 归集金额
     * @param {string} transactionId - 交易ID
     */
    async recordConsolidation(fromAccountId, amount, transactionId) {
        try {
            const query = `
                INSERT INTO fund_consolidations 
                (from_account_id, to_account_id, amount, transaction_id, created_at)
                VALUES (?, ?, ?, ?, NOW())
            `;
            await pool.execute(query, [fromAccountId, this.masterAccountId, amount, transactionId]);
        } catch (error) {
            console.error('记录归集操作失败:', error);
        }
    }

    /**
     * 批量归集所有会员资金
     * @returns {Array} 归集结果列表
     */
    async batchConsolidateAllFunds() {
        try {
            // 获取所有有余额的虚拟账户
            const accountsWithBalance = await this.getAccountsWithBalance();
            const results = [];

            console.log(`🔄 开始批量归集 ${accountsWithBalance.length} 个账户的资金`);

            for (const account of accountsWithBalance) {
                try {
                    const result = await this.consolidateFunds(account.account_id);
                    results.push({
                        accountId: account.account_id,
                        userId: account.user_id,
                        ...result
                    });

                    // 避免API频率限制
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    results.push({
                        accountId: account.account_id,
                        userId: account.user_id,
                        success: false,
                        error: error.message
                    });
                }
            }

            console.log(`✅ 批量归集完成，成功: ${results.filter(r => r.success).length}，失败: ${results.filter(r => !r.success).length}`);
            return results;

        } catch (error) {
            console.error('❌ 批量归集失败:', error);
            throw error;
        }
    }

    /**
     * 获取有余额的虚拟账户
     * @returns {Array} 账户列表
     */
    async getAccountsWithBalance() {
        try {
            const query = `
                SELECT mva.user_id, mva.account_id, mva.deposit_address
                FROM member_virtual_accounts mva
                WHERE mva.account_id IS NOT NULL
            `;
            const [rows] = await pool.execute(query);
            
            // 过滤出有余额的账户
            const accountsWithBalance = [];
            for (const account of rows) {
                try {
                    const balanceResponse = await this.api.get(`/v3/ledger/account/${account.account_id}/balance`);
                    if (parseFloat(balanceResponse.data.availableBalance || '0') > 0) {
                        accountsWithBalance.push(account);
                    }
                } catch (error) {
                    console.error(`检查账户 ${account.account_id} 余额失败:`, error);
                }
            }

            return accountsWithBalance;
        } catch (error) {
            console.error('获取有余额的虚拟账户失败:', error);
            throw error;
        }
    }

    /**
     * 获取虚拟账户余额
     * @param {string} accountId - 虚拟账户ID
     * @returns {Object} 余额信息
     */
    async getAccountBalance(accountId) {
        try {
            await this.initialize();
            const balanceResponse = await this.api.get(`/v3/ledger/account/${accountId}/balance`);
            const balance = balanceResponse.data;
            
            return {
                accountId,
                availableBalance: parseFloat(balance.availableBalance || '0'),
                accountBalance: parseFloat(balance.accountBalance || '0'),
                currency: balance.currency
            };
        } catch (error) {
            console.error('获取虚拟账户余额失败:', error);
            throw error;
        }
    }

    /**
     * 销毁服务连接
     */
    async destroy() {
        if (this.isInitialized) {
            this.isInitialized = false;
            console.log('🔌 Tatum虚拟账户服务已销毁');
        }
    }
}

// 创建单例实例
const tatumVirtualAccountService = new TatumVirtualAccountService();

// 自动初始化
(async () => {
    try {
        await tatumVirtualAccountService.initialize();
    } catch (error) {
        console.error('Tatum虚拟账户服务自动初始化失败:', error);
    }
})();

module.exports = tatumVirtualAccountService;