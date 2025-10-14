/**
 * Tatum 基础钱包服务
 * 使用Tatum的基础钱包功能实现中心化钱包服务
 * 避免使用虚拟账户功能
 */

require('dotenv').config();
const { TatumSDK, Network } = require('@tatumio/tatum');
const crypto = require('crypto');
const { pool } = require('../config/database');
const KeyManagementSystem = require('../utils/keyManagementSystem');
const fs = require('fs');

class TatumBasicWalletService {
    constructor() {
        this.tatum = null;
        this.kms = new KeyManagementSystem();
        this.isInitialized = false;
        this.masterPassword = null;
    }


    /**
     * 从加密存储加载助记词
     */
    async loadMasterMnemonic() {
        try {
            if (!this.masterMnemonic) {
                const encryptedConfigPath = '/Users/mason1236/0930/secure/master-wallet-encrypted.json';
                const masterPasswordPath = '/Users/mason1236/0930/secure/master-password.txt';
                
                const masterPassword = fs.readFileSync(masterPasswordPath, 'utf8').trim();
                this.masterMnemonic = await this.secureStorage.loadEncryptedMnemonic(
                    encryptedConfigPath, 
                    masterPassword
                );
            }
            return this.masterMnemonic;
        } catch (error) {
            console.error('❌ 加载助记词失败:', error.message);
            throw error;
        }
    }

    /**
     * 初始化服务
     */
    async initialize(masterPassword) {
        try {
            console.log('🔧 初始化 Tatum 基础钱包服务...');
            
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
                network: Network.TRON_SHASTA,
                apiKey: apiKey,
                verbose: true
            });
            
            // 初始化数据库表
            await this.initializeTables();
            
            this.isInitialized = true;
            console.log('✅ Tatum 基础钱包服务初始化完成');
            
            return { success: true };
        } catch (error) {
            console.error('❌ Tatum 基础钱包服务初始化失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 测试API连接
     */
    async testConnection() {
        try {
            // 测试TRON网络信息
            const response = await this.api.get('/v3/tron/info');
            console.log('✅ Tatum API连接成功');
            return response.data;
        } catch (error) {
            console.error('❌ Tatum API连接失败:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * 初始化数据库表
     */
    async initializeTables() {
        const createWalletsTable = `
            CREATE TABLE IF NOT EXISTS tatum_wallets (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                wallet_type VARCHAR(50) NOT NULL DEFAULT 'member',
                mnemonic TEXT,
                xpub TEXT,
                address VARCHAR(255) NOT NULL,
                private_key TEXT,
                currency VARCHAR(20) NOT NULL DEFAULT 'USDT',
                balance DECIMAL(20, 8) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) DEFAULT 'active',
                UNIQUE(user_id, currency)
            )
        `;

        const createTransactionsTable = `
            CREATE TABLE IF NOT EXISTS tatum_transactions (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                tx_hash VARCHAR(255) NOT NULL,
                tx_type VARCHAR(20) NOT NULL,
                amount DECIMAL(20, 8) NOT NULL,
                fee DECIMAL(20, 8) DEFAULT 0,
                currency VARCHAR(20) NOT NULL DEFAULT 'USDT',
                from_address VARCHAR(255),
                to_address VARCHAR(255),
                block_number BIGINT,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(tx_hash)
            )
        `;

        const createDepositAddressesTable = `
            CREATE TABLE IF NOT EXISTS tatum_deposit_addresses (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                address VARCHAR(255) NOT NULL,
                derivation_key INTEGER,
                currency VARCHAR(20) NOT NULL DEFAULT 'USDT',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) DEFAULT 'active',
                UNIQUE(user_id, currency),
                UNIQUE(address)
            )
        `;

        await pool.execute(createWalletsTable);
        await pool.execute(createTransactionsTable);
        await pool.execute(createDepositAddressesTable);
        
        console.log('✅ 数据库表初始化完成');
    }

    /**
     * 生成TRON钱包
     */
    async generateTronWallet() {
        try {
            const response = await this.api.get('/v3/tron/wallet');
            return {
                mnemonic: response.data.mnemonic,
                xpub: response.data.xpub
            };
        } catch (error) {
            console.error('❌ 生成TRON钱包失败:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * 从xpub生成地址
     */
    async generateAddressFromXpub(xpub, index = 0) {
        try {
            const response = await this.api.get(`/v3/tron/address/${xpub}/${index}`);
            return response.data.address;
        } catch (error) {
            console.error('❌ 生成地址失败:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * 获取地址私钥
     */
    async getPrivateKey(mnemonic, index = 0) {
        try {
            const response = await this.api.post('/v3/tron/wallet/priv', {
                mnemonic: mnemonic,
                index: index
            });
            return response.data.key;
        } catch (error) {
            console.error('❌ 获取私钥失败:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * 为用户创建钱包地址
     */
    async createMemberWallet(userId) {
        try {
            console.log(`🏦 为用户 ${userId} 创建钱包地址...`);

            // 检查是否已存在
            const [existing] = await pool.execute(
                'SELECT * FROM tatum_deposit_addresses WHERE user_id = ? AND currency = ?',
                [userId, 'USDT']
            );

            if (existing.length > 0) {
                console.log(`✅ 用户 ${userId} 已有钱包地址: ${existing[0].address}`);
                return {
                    success: true,
                    address: existing[0].address,
                    userId: userId,
                    currency: 'USDT'
                };
            }

            // 获取或创建主钱包
            let masterWallet = await this.getMasterWallet();
            if (!masterWallet) {
                masterWallet = await this.createMasterWallet();
            }

            // 生成新的地址索引
            const [addressCount] = await pool.execute(
                'SELECT COUNT(*) as count FROM tatum_deposit_addresses'
            );
            const derivationIndex = addressCount[0].count + 1;

            // 从主钱包xpub生成新地址
            const address = await this.generateAddressFromXpub(masterWallet.xpub, derivationIndex);

            // 保存到数据库
            await pool.execute(
                `INSERT INTO tatum_deposit_addresses 
                (user_id, address, derivation_key, currency, status) 
                VALUES (?, ?, ?, ?, ?)`,
                [userId, address, derivationIndex, 'USDT', 'active']
            );

            console.log(`✅ 为用户 ${userId} 创建钱包地址成功: ${address}`);

            return {
                success: true,
                address: address,
                userId: userId,
                currency: 'USDT',
                derivationKey: derivationIndex
            };

        } catch (error) {
            console.error(`❌ 为用户 ${userId} 创建钱包地址失败:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取主钱包
     */
    async getMasterWallet() {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM tatum_wallets WHERE wallet_type = ? AND currency = ?',
                ['master', 'USDT']
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('❌ 获取主钱包失败:', error.message);
            return null;
        }
    }

    /**
     * 创建主钱包
     */
    async createMasterWallet() {
        try {
            console.log('🏦 创建主钱包...');

            // 生成TRON钱包
            const wallet = await this.generateTronWallet();
            
            // 生成主地址
            const masterAddress = await this.generateAddressFromXpub(wallet.xpub, 0);
            
            // 获取主地址私钥
            const privateKey = await this.getPrivateKey(wallet.mnemonic, 0);

            // 保存到数据库
            await pool.execute(
                `INSERT INTO tatum_wallets 
                (user_id, wallet_type, mnemonic, xpub, address, private_key, currency, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                ['master', 'master', wallet.mnemonic, wallet.xpub, masterAddress, privateKey, 'USDT', 'active']
            );

            console.log(`✅ 主钱包创建成功: ${masterAddress}`);

            return {
                user_id: 'master',
                wallet_type: 'master',
                mnemonic: wallet.mnemonic,
                xpub: wallet.xpub,
                address: masterAddress,
                private_key: privateKey,
                currency: 'USDT'
            };

        } catch (error) {
            console.error('❌ 创建主钱包失败:', error.message);
            throw error;
        }
    }

    /**
     * 查询地址余额
     */
    async getAddressBalance(address) {
        try {
            // 查询TRX余额
            const trxResponse = await this.api.get(`/v3/tron/account/balance/${address}`);
            
            // 查询USDT余额 (TRC20)
            const usdtContractAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; // USDT TRC20合约地址
            const usdtResponse = await this.api.get(`/v3/tron/account/balance/trc20/${address}/${usdtContractAddress}`);

            return {
                trx: parseFloat(trxResponse.data.balance || 0),
                usdt: parseFloat(usdtResponse.data.balance || 0)
            };
        } catch (error) {
            console.error('❌ 查询地址余额失败:', error.response?.data || error.message);
            return { trx: 0, usdt: 0 };
        }
    }

    /**
     * 监听地址交易
     */
    async monitorAddressTransactions(address, callback) {
        try {
            // 这里可以实现轮询或webhook监听
            // 暂时使用轮询方式
            const checkTransactions = async () => {
                try {
                    const response = await this.api.get(`/v3/tron/transaction/account/${address}`);
                    const transactions = response.data;
                    
                    for (const tx of transactions) {
                        if (tx.contractType === 31 && tx.tokenInfo?.symbol === 'USDT') {
                            // USDT转账交易
                            await callback({
                                txHash: tx.hash,
                                from: tx.ownerAddress,
                                to: tx.toAddress,
                                amount: parseFloat(tx.tokenInfo.amount) / Math.pow(10, tx.tokenInfo.decimals),
                                blockNumber: tx.blockNumber,
                                timestamp: tx.timestamp
                            });
                        }
                    }
                } catch (error) {
                    console.error('❌ 检查交易失败:', error.message);
                }
            };

            // 每30秒检查一次
            setInterval(checkTransactions, 30000);
            
        } catch (error) {
            console.error('❌ 监听地址交易失败:', error.message);
        }
    }

    /**
     * 发送USDT交易
     */
    async sendUSDT(fromPrivateKey, toAddress, amount, feeLimit = 10) {
        try {
            const usdtContractAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
            
            const transactionData = {
                fromPrivateKey: fromPrivateKey,
                to: toAddress,
                tokenAddress: usdtContractAddress,
                amount: amount.toString(),
                feeLimit: feeLimit * 1000000 // 转换为sun
            };

            const response = await this.api.post('/v3/tron/trc20/transaction', transactionData);
            
            return {
                success: true,
                txHash: response.data.txId,
                amount: amount,
                fee: feeLimit
            };
        } catch (error) {
            console.error('❌ 发送USDT失败:', error.response?.data || error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * 处理用户充值
     */
    async processDeposit(userId, txHash, amount, fromAddress) {
        try {
            // 检查交易是否已处理
            const [existing] = await pool.execute(
                'SELECT * FROM tatum_transactions WHERE tx_hash = ?',
                [txHash]
            );

            if (existing.length > 0) {
                console.log(`⚠️ 交易 ${txHash} 已处理`);
                return { success: false, reason: 'Transaction already processed' };
            }

            // 记录充值交易
            await pool.execute(
                `INSERT INTO tatum_transactions 
                (user_id, tx_hash, tx_type, amount, currency, from_address, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [userId, txHash, 'deposit', amount, 'USDT', fromAddress, 'confirmed']
            );

            // 更新用户余额（这里需要根据你的用户系统调整）
            // await this.updateUserBalance(userId, amount, 'add');

            console.log(`✅ 用户 ${userId} 充值 ${amount} USDT 处理成功`);
            
            return { success: true, amount: amount };
        } catch (error) {
            console.error('❌ 处理充值失败:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * 处理用户提现
     */
    async processWithdraw(userId, toAddress, amount, fixedFee = 2, percentageFee = 0.01) {
        try {
            // 计算手续费
            const calculatedFee = Math.max(fixedFee, amount * percentageFee);
            const actualAmount = amount - calculatedFee;

            if (actualAmount <= 0) {
                return { success: false, error: 'Amount too small after fees' };
            }

            // 获取主钱包私钥
            const masterWallet = await this.getMasterWallet();
            if (!masterWallet) {
                return { success: false, error: 'Master wallet not found' };
            }

            // 发送USDT
            const result = await this.sendUSDT(
                masterWallet.private_key,
                toAddress,
                actualAmount
            );

            if (result.success) {
                // 记录提现交易
                await pool.execute(
                    `INSERT INTO tatum_transactions 
                    (user_id, tx_hash, tx_type, amount, fee, currency, to_address, status) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [userId, result.txHash, 'withdraw', amount, calculatedFee, 'USDT', toAddress, 'confirmed']
                );

                console.log(`✅ 用户 ${userId} 提现 ${actualAmount} USDT 成功`);
                
                return {
                    success: true,
                    txHash: result.txHash,
                    amount: actualAmount,
                    fee: calculatedFee,
                    originalAmount: amount
                };
            } else {
                return result;
            }
        } catch (error) {
            console.error('❌ 处理提现失败:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * 资金归集到主钱包
     */
    async consolidateFunds() {
        try {
            console.log('💰 开始资金归集...');

            const masterWallet = await this.getMasterWallet();
            if (!masterWallet) {
                throw new Error('Master wallet not found');
            }

            // 获取所有充值地址
            const [addresses] = await pool.execute(
                'SELECT * FROM tatum_deposit_addresses WHERE status = ?',
                ['active']
            );

            let totalConsolidated = 0;
            const results = [];

            for (const addressInfo of addresses) {
                try {
                    const balance = await this.getAddressBalance(addressInfo.address);
                    
                    if (balance.usdt > 1) { // 只归集大于1 USDT的余额
                        // 获取该地址的私钥
                        const privateKey = await this.getPrivateKey(
                            masterWallet.mnemonic, 
                            addressInfo.derivation_key
                        );

                        // 转账到主钱包
                        const result = await this.sendUSDT(
                            privateKey,
                            masterWallet.address,
                            balance.usdt - 0.1 // 留0.1作为手续费
                        );

                        if (result.success) {
                            totalConsolidated += balance.usdt - 0.1;
                            results.push({
                                address: addressInfo.address,
                                amount: balance.usdt - 0.1,
                                txHash: result.txHash
                            });
                        }
                    }
                } catch (error) {
                    console.error(`❌ 归集地址 ${addressInfo.address} 失败:`, error.message);
                }
            }

            console.log(`✅ 资金归集完成，总计: ${totalConsolidated} USDT`);
            
            return {
                success: true,
                totalConsolidated: totalConsolidated,
                results: results
            };
        } catch (error) {
            console.error('❌ 资金归集失败:', error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = TatumBasicWalletService;