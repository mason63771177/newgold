const { TatumSDK, Network, Tron } = require('@tatumio/tatum');
const fs = require('fs');
const crypto = require('crypto');
const { TronWalletProvider } = require('@tatumio/tron-wallet-provider');
const { pool, redisClient } = require('../config/database');
const feeProfitService = require('./feeProfitService');
const KeyManagementSystem = require('../utils/keyManagementSystem');


/**
 * Tatum钱包服务类
 * 实现中心化钱包功能：充值识别、提现、手续费计算、资金归集
 */
class TatumWalletService {
    constructor() {
        this.tatum = null;
        this.isInitialized = false;
        this.network = process.env.TATUM_NETWORK === 'mainnet' ? Network.TRON : Network.TRON_SHASTA;
        this.apiKey = process.env.TATUM_API_KEY;
        this.kms = new KeyManagementSystem();
        this.masterWallet = null;
        this.masterWalletMnemonic = null; // 将从加密存储加载
        this.masterPassword = null;
        this.usdtContractAddress = process.env.USDT_CONTRACT_ADDRESS || 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs'; // Testnet USDT
        
        // 手续费配置
        this.withdrawalFees = {
            fixed: 2, // 固定手续费 2 USDT
            percentage: {
                min: 0.01, // 最低1%
                max: 0.05  // 最高5%
            }
        };
    }


    /**
     * 从加密存储加载助记词
     */
    async loadMasterWalletMnemonic() {
        try {
            if (!this.masterWalletMnemonic) {
                const encryptedConfigPath = '/Users/mason1236/0930/secure/master-wallet-encrypted.json';
                const masterPasswordPath = '/Users/mason1236/0930/secure/master-password.txt';
                
                if (!fs.existsSync(encryptedConfigPath) || !fs.existsSync(masterPasswordPath)) {
                    throw new Error('加密配置文件或主密码文件不存在');
                }
                
                const masterPassword = fs.readFileSync(masterPasswordPath, 'utf8').trim();
                this.masterWalletMnemonic = await this.secureStorage.loadEncryptedMnemonic(
                    encryptedConfigPath, 
                    masterPassword
                );
                console.log('✅ 成功从加密存储加载助记词');
            }
            return this.masterWalletMnemonic;
        } catch (error) {
            console.error('❌ 加载助记词失败:', error.message);
            throw error;
        }
    }

    /**
     * 初始化 Tatum SDK 和主钱包
     */
    async initialize(masterPassword) {
        try {
            console.log('🔧 初始化 Tatum 钱包服务...');
            
            this.masterPassword = masterPassword;
            
            // 初始化密钥管理系统
            await this.kms.initialize();
            
            // 获取 API 密钥
            const apiKey = await this.kms.getKey('tatum_api_key', masterPassword);
            if (!apiKey) {
                throw new Error('无法获取 Tatum API 密钥');
            }

            // 初始化 Tatum SDK
            this.tatum = await TatumSDK.init({
                network: Network.TRON_SHASTA, // 测试网络
                apiKey: apiKey,
                verbose: true
            });

            // 检查 Tatum SDK 是否正确初始化
            if (!this.tatum || !this.tatum.wallets) {
                throw new Error('Tatum SDK 初始化失败或 wallets 模块不可用');
            }

            // 加载主钱包助记词
            const mnemonic = await this.kms.getMasterMnemonic(masterPassword);
            
            if (!mnemonic) {
                throw new Error('无法加载主钱包助记词');
            }

            // 生成主钱包
            this.masterWallet = this.tatum.wallets.generateWallet(mnemonic);
            
            this.isInitialized = true;
            console.log('✅ Tatum 钱包服务初始化完成');
            console.log(`📍 主钱包地址: ${this.masterWallet.address}`);
            
        } catch (error) {
            console.error('❌ Tatum 钱包服务初始化失败:', error);
            throw error;
        }
    }

    /**
     * 获取用户现有的充值地址
     * @param {string} userId - 用户ID
     * @returns {Promise<string|null>} 用户的钱包地址，如果不存在则返回null
     */
    async getUserDepositAddress(userId) {
        try {
            const query = 'SELECT wallet_address FROM user_wallets WHERE user_id = ?';
            const [rows] = await pool.execute(query, [userId]);
            
            return rows.length > 0 ? rows[0].wallet_address : null;
            
        } catch (error) {
            console.error('获取用户充值地址失败:', error);
            throw error;
        }
    }

    /**
     * 为玩家生成唯一的充值地址
     * @param {number} userId - 用户ID
     * @param {number} derivationIndex - 派生索引
     * @returns {Promise<Object>} 包含地址和私钥的对象
     */
    async createDepositAddress(userId, derivationIndex) {
        try {
            if (!this.tatum || !this.isInitialized) {
                throw new Error('Tatum SDK 未初始化');
            }

            // 首先检查用户是否已有钱包地址
            const existingAddress = await this.getUserDepositAddress(userId);
            if (existingAddress) {
                console.log(`用户 ${userId} 已有钱包地址: ${existingAddress}`);
                return {
                    address: existingAddress,
                    privateKey: null, // 出于安全考虑，不返回私钥
                    derivationIndex: null
                };
            }

            // 使用 TronWalletProvider 生成地址和私钥（修复容器注册问题）
            const addressResult = await this.tatum.walletProvider
                .use(TronWalletProvider)
                .generateAddressFromMnemonic(this.masterWalletMnemonic, derivationIndex);
                
            const privateKeyResult = await this.tatum.walletProvider
                .use(TronWalletProvider)
                .generatePrivateKeyFromMnemonic(this.masterWalletMnemonic, derivationIndex);

            console.log(`为用户 ${userId} 生成地址: ${addressResult}`);
            console.log(`地址结果类型: ${typeof addressResult}, 内容:`, addressResult);
            console.log(`私钥结果类型: ${typeof privateKeyResult}, 内容:`, privateKeyResult);
            
            // 修复返回格式问题 - 直接返回字符串值
            const walletInfo = {
                address: typeof addressResult === 'string' ? addressResult : addressResult.address,
                privateKey: typeof privateKeyResult === 'string' ? privateKeyResult : privateKeyResult.privateKey,
                derivationIndex
            };

            // 保存钱包映射关系
            await this.saveWalletMapping(userId, walletInfo.address, walletInfo.privateKey, derivationIndex);

            return walletInfo;
        } catch (error) {
            console.error('创建充值地址失败:', error);
            throw error;
        }
    }

    /**
     * 保存钱包地址映射关系
     * @param {string} userId - 用户ID
     * @param {string} address - 钱包地址
     * @param {string} privateKey - 私钥（加密存储）
     * @param {number} derivationIndex - 派生索引
     */
    /**
     * 保存钱包地址映射到数据库
     * @param {string} userId - 用户ID
     * @param {string} address - 钱包地址
     * @param {string} privateKey - 私钥
     * @param {number} derivationIndex - 派生索引
     */
    async saveWalletMapping(userId, address, privateKey, derivationIndex) {
        try {
            // 简化存储，暂时不加密私钥以避免字符集问题
            const query = `
                INSERT INTO user_wallets (user_id, wallet_address, private_key_encrypted, derivation_index, created_at)
                VALUES (?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE
                wallet_address = VALUES(wallet_address),
                private_key_encrypted = VALUES(private_key_encrypted),
                updated_at = NOW()
            `;
            
            await pool.execute(query, [
                userId,
                address,
                'encrypted_' + Buffer.from(privateKey).toString('hex'), // 简单的十六进制编码
                derivationIndex
            ]);

            console.log('✅ 钱包映射保存成功', { userId, address });
        } catch (error) {
            console.error('❌ 保存钱包映射失败:', error);
            throw error;
        }
    }

    /**
     * 监听地址的入账交易
     * @param {string} address - 要监听的地址
     * @returns {Promise<Array>} 交易列表
     */
    async getTransactionsByAddress(address) {
        try {
            if (!this.tatum) {
                await this.initialize();
            }

            // 使用HTTP API方式获取交易记录（v4兼容）
            const axios = require('axios');
            const apiKey = process.env.TATUM_API_KEY;
            const network = process.env.TATUM_NETWORK === 'mainnet' ? 'tron-mainnet' : 'tron-testnet';
            
            // 使用正确的网络端点查询交易
            const response = await axios.get(`https://${network}.gateway.tatum.io/v3/tron/transaction/account/${address}`, {
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json'
                },
                params: {
                    limit: 50
                }
            });

            if (response.data && response.data.result) {
                // 过滤TRC20 USDT交易
                return response.data.result.filter(tx => {
                    // 检查是否为TRC20交易
                    if (tx.raw_data && tx.raw_data.contract) {
                        const contract = tx.raw_data.contract[0];
                        return contract.type === 'TriggerSmartContract' &&
                               contract.parameter.value.contract_address === this.usdtContractAddress;
                    }
                    return false;
                });
            }

            return [];

        } catch (error) {
            console.error('❌ 获取地址交易失败:', error.message);
            // 降级到模拟数据
            return [];
        }
    }

    /**
     * 处理充值确认
     * @param {string} userId - 用户ID
     * @param {string} txHash - 交易哈希
     * @param {number} amount - 充值金额
     * @param {string} fromAddress - 发送地址
     */
    async processDeposit(userId, txHash, amount, fromAddress) {
        try {
            // 检查交易是否已处理
            const existingDeposit = await this.getDepositByTxHash(txHash);
            if (existingDeposit) {
                console.warn('⚠️ 交易已处理，跳过重复处理', { txHash });
                return existingDeposit;
            }

            // 记录充值交易
            const query = `
                INSERT INTO user_deposits (user_id, tx_hash, amount, from_address, status, created_at)
                VALUES (?, ?, ?, ?, 'confirmed', NOW())
            `;
            
            await pool.execute(query, [userId, txHash, amount, fromAddress]);

            // 更新用户余额
            await this.updateUserBalance(userId, amount, 'deposit');

            console.log('✅ 充值处理成功', {
                userId,
                txHash,
                amount,
                fromAddress
            });

            return { userId, txHash, amount, status: 'confirmed' };

        } catch (error) {
            console.error('❌ 处理充值失败:', error);
            throw error;
        }
    }

    /**
     * 计算提现手续费
     * @param {number} amount - 提现金额
     * @returns {Object} 手续费详情
     */
    calculateWithdrawalFee(amount) {
        // 使用feeProfitService的客户手续费计算
        return feeProfitService.calculateCustomerFee(amount);
    }

    /**
     * 执行提现操作
     * @param {string} userId - 用户ID
     * @param {string} toAddress - 目标地址
     * @param {number} amount - 提现金额
     * @returns {Promise<Object>} 提现结果
     */
    async processWithdrawal(userId, toAddress, amount) {
        try {
            if (!this.tatum) {
                await this.initialize();
            }

            // 计算手续费
            const feeDetails = this.calculateWithdrawalFee(amount);
            
            if (feeDetails.netAmount <= 0) {
                throw new Error('提现金额不足以支付手续费');
            }

            // 检查用户余额
            const userBalance = await this.getUserBalance(userId);
            if (userBalance < amount) {
                throw new Error('余额不足');
            }

            // 获取主钱包私钥进行转账
            const masterWallet = await this.getMasterWalletInfo();
            
            // 执行TRC20 USDT转账
            const txResult = await this.tatum.rpc.sendTransaction({
                from: masterWallet.address,
                to: toAddress,
                amount: feeDetails.netAmount.toString(),
                contractAddress: this.usdtContractAddress,
                privateKey: masterWallet.privateKey
            });

            // 记录提现交易
            const withdrawalId = await this.recordWithdrawal(userId, toAddress, amount, feeDetails, txResult.txId);

            // 更新用户余额
            await this.updateUserBalance(userId, -amount, 'withdrawal');

            // 异步处理手续费利润转账（不阻塞主流程）
            this.processFeeProfit(withdrawalId, amount, txResult.txId).catch(error => {
                console.error('❌ 手续费利润处理失败:', error);
            });

            console.log('✅ 提现处理成功', {
                userId,
                toAddress,
                amount,
                netAmount: feeDetails.netAmount,
                txHash: txResult.txId
            });

            return {
                txHash: txResult.txId,
                originalAmount: amount,
                netAmount: feeDetails.netAmount,
                totalFee: feeDetails.totalFee,
                status: 'completed',
                withdrawalId
            };

        } catch (error) {
            console.error('❌ 提现处理失败:', error);
            throw error;
        }
    }

    /**
     * 处理手续费利润转账（异步）
     * @param {string} withdrawalId - 提币记录ID
     * @param {number} amount - 提币金额
     * @param {string} txHash - 提币交易哈希
     */
    async processFeeProfit(withdrawalId, amount, txHash) {
        try {
            console.log(`🔄 开始处理提币 ${withdrawalId} 的手续费利润...`);
            
            const result = await feeProfitService.transferFeeProfit(withdrawalId, amount, txHash);
            
            if (result.success) {
                console.log(`✅ 提币 ${withdrawalId} 手续费利润处理成功`, {
                    profit: result.profit,
                    profitTxHash: result.txHash
                });
            } else {
                console.log(`⚠️ 提币 ${withdrawalId} 无需处理手续费利润:`, result.reason);
            }
            
        } catch (error) {
            console.error(`❌ 提币 ${withdrawalId} 手续费利润处理失败:`, error);
            // 错误已在feeProfitService中记录，这里不再抛出
        }
    }

    /**
     * 资金归集功能 - 将子钱包余额转移到主钱包
     * @param {Array} walletAddresses - 要归集的钱包地址列表
     * @returns {Promise<Array>} 归集结果
     */
    async consolidateFunds(walletAddresses = null) {
        try {
            if (!this.tatum) {
                await this.initialize();
            }

            // 如果没有指定地址，获取所有有余额的子钱包
            if (!walletAddresses) {
                walletAddresses = await this.getWalletsWithBalance();
            }

            const masterWallet = await this.getMasterWalletInfo();
            const consolidationResults = [];

            for (const walletInfo of walletAddresses) {
                try {
                    // 获取钱包余额
                    const balance = await this.getWalletBalance(walletInfo.address);
                    
                    if (balance > 0.1) { // 只归集余额大于0.1 USDT的钱包
                        // 预留少量TRX作为手续费
                        const transferAmount = balance - 0.01;
                        
                        const txResult = await this.tatum.rpc.sendTransaction({
                            from: walletInfo.address,
                            to: masterWallet.address,
                            amount: transferAmount.toString(),
                            contractAddress: this.usdtContractAddress,
                            privateKey: walletInfo.privateKey
                        });

                        consolidationResults.push({
                            fromAddress: walletInfo.address,
                            amount: transferAmount,
                            txHash: txResult.txId,
                            status: 'success'
                        });

                        console.log('✅ 资金归集成功', {
                            from: walletInfo.address,
                            amount: transferAmount,
                            txHash: txResult.txId
                        });
                    }
                } catch (error) {
                    console.error('❌ 单个钱包归集失败:', error);
                    consolidationResults.push({
                        fromAddress: walletInfo.address,
                        error: error.message,
                        status: 'failed'
                    });
                }
            }

            return consolidationResults;

        } catch (error) {
            console.error('❌ 资金归集失败:', error);
            throw error;
        }
    }

    /**
     * 获取主钱包信息
     * @returns {Promise<Object>} 主钱包信息
     */
    async getMasterWalletInfo() {
        // 这里应该从安全存储中获取主钱包信息
        // 为了演示，暂时使用环境变量
        return {
            address: process.env.PAYMENT_WALLET_ADDRESS,
            privateKey: process.env.PAYMENT_PRIVATE_KEY
        };
    }

    /**
     * 获取钱包余额
     * @param {string} address - 钱包地址
     * @returns {Promise<number>} 余额
     */
    async getWalletBalance(address) {
        try {
            if (!this.tatum) {
                await this.initialize();
            }

            // 使用 Tatum v3 API 查询 TRON 账户余额
            const network = process.env.TATUM_NETWORK === 'mainnet' ? 'tron-mainnet' : 'tron-testnet';
            const response = await fetch(`https://${network}.gateway.tatum.io/v3/tron/account/${address}`, {
                method: 'GET',
                headers: {
                    'x-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`API 请求失败: ${response.status}`);
            }
            
            const data = await response.json();
            // 从TRON账户信息中获取TRX余额
            const balance = parseFloat(data.balance || '0') / 1000000; // TRX使用6位小数
            return balance;
        } catch (error) {
            console.error('❌ 获取钱包余额失败:', error);
            return 0;
        }
    }

    /**
     * 获取用户余额
     * @param {string} userId - 用户ID
     * @returns {Promise<number>} 用户余额
     */
    async getUserBalance(userId) {
        try {
            const query = 'SELECT balance FROM users WHERE id = ?';
            const [rows] = await pool.execute(query, [userId]);
            return rows.length > 0 ? parseFloat(rows[0].balance || '0') : 0;
        } catch (error) {
            console.error('❌ 获取用户余额失败:', error);
            return 0;
        }
    }

    /**
     * 更新用户余额
     * @param {string} userId - 用户ID
     * @param {number} amount - 变动金额（正数为增加，负数为减少）
     * @param {string} type - 操作类型
     */
    async updateUserBalance(userId, amount, type) {
        try {
            const query = `
                UPDATE users 
                SET balance = balance + ?, 
                    updated_at = NOW() 
                WHERE id = ?
            `;
            
            await pool.execute(query, [amount, userId]);
            
            // 记录余额变动日志
            await this.logBalanceChange(userId, amount, type);
            
        } catch (error) {
            console.error('❌ 更新用户余额失败:', error);
            throw error;
        }
    }

    /**
     * 记录余额变动日志
     * @param {string} userId - 用户ID
     * @param {number} amount - 变动金额
     * @param {string} type - 操作类型
     */
    async logBalanceChange(userId, amount, type) {
        try {
            const query = `
                INSERT INTO balance_logs (user_id, amount, type, created_at)
                VALUES (?, ?, ?, NOW())
            `;
            
            await pool.execute(query, [userId, amount, type]);
        } catch (error) {
            console.error('❌ 记录余额变动失败:', error);
        }
    }

    /**
     * 获取有余额的钱包列表
     * @returns {Promise<Array>} 钱包列表
     */
    async getWalletsWithBalance() {
        try {
            const query = `
                SELECT user_id, wallet_address, 
                       AES_DECRYPT(private_key_encrypted, ?) as private_key
                FROM user_wallets 
                WHERE wallet_address IS NOT NULL
            `;
            
            const [rows] = await pool.execute(query, [process.env.JWT_SECRET]);
            return rows.map(row => ({
                userId: row.user_id,
                address: row.wallet_address,
                privateKey: row.private_key.toString()
            }));
        } catch (error) {
            console.error('❌ 获取钱包列表失败:', error);
            return [];
        }
    }

    /**
     * 根据交易哈希获取充值记录
     * @param {string} txHash - 交易哈希
     * @returns {Promise<Object|null>} 充值记录
     */
    async getDepositByTxHash(txHash) {
        try {
            const query = 'SELECT * FROM user_deposits WHERE tx_hash = ?';
            const [rows] = await pool.execute(query, [txHash]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('❌ 查询充值记录失败:', error);
            return null;
        }
    }

    /**
     * 记录提现交易
     * @param {string} userId - 用户ID
     * @param {string} toAddress - 目标地址
     * @param {number} amount - 原始金额
     * @param {Object} feeDetails - 手续费详情
     * @param {string} txHash - 交易哈希
     */
    /**
     * 记录提现交易
     * @param {string} userId - 用户ID
     * @param {string} toAddress - 目标地址
     * @param {number} amount - 原始金额
     * @param {Object} feeDetails - 手续费详情
     * @param {string} txHash - 交易哈希
     * @returns {Promise<string>} 提现记录ID
     */
    async recordWithdrawal(userId, toAddress, amount, feeDetails, txHash) {
        try {
            const query = `
                INSERT INTO user_withdrawals 
                (user_id, to_address, original_amount, net_amount, total_fee, tx_hash, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 'completed', NOW())
            `;
            
            const [result] = await pool.execute(query, [
                userId,
                toAddress,
                amount,
                feeDetails.netAmount,
                feeDetails.totalFee,
                txHash
            ]);
            
            return result.insertId.toString();
        } catch (error) {
            console.error('❌ 记录提现交易失败:', error);
            throw error;
        }
    }

    /**
     * 销毁Tatum SDK实例
     */
    async destroy() {
        if (this.tatum) {
            await this.tatum.destroy();
            this.tatum = null;
            console.log('✅ Tatum SDK已销毁');
        }
    }
}

// 创建单例实例并初始化
const tatumWalletService = new TatumWalletService();

// 自动初始化服务
(async () => {
    try {
        await tatumWalletService.initialize();
    } catch (error) {
        console.error('❌ Tatum钱包服务自动初始化失败:', error);
    }
})();

module.exports = tatumWalletService;