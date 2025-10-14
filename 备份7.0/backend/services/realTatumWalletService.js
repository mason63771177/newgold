const { TatumSDK, Network, Tron } = require('@tatumio/tatum');
const { TronWalletProvider } = require('@tatumio/tron-wallet-provider');
const { TronWeb } = require('tronweb');
const bip39 = require('bip39');
const { BIP32Factory } = require('bip32');
const ecc = require('tiny-secp256k1');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { pool, redisClient } = require('../config/database');

// 初始化 BIP32
const bip32 = BIP32Factory(ecc);

/**
 * 真正的 Tatum API 中心化钱包服务
 * 实现充值识别、提现、手续费计算、资金归集功能
 */
class RealTatumWalletService {
    constructor() {
        this.tatum = null;
        this.isInitialized = false;
        this.masterWallet = null;
        this.usdtContractAddress = process.env.USDT_CONTRACT_ADDRESS;
        
        // 手续费配置
        this.fixedFee = parseFloat(process.env.CUSTOMER_FIXED_FEE) || 2.0;
        this.minPercentageFee = parseFloat(process.env.CUSTOMER_PERCENTAGE_FEE_MIN) || 0.01;
        this.maxPercentageFee = parseFloat(process.env.CUSTOMER_PERCENTAGE_FEE_MAX) || 0.05;
    }

    /**
     * 初始化 Tatum SDK
     */
    async initialize() {
        try {
            if (this.isInitialized) {
                return;
            }

            const apiKey = process.env.TATUM_API_KEY;
            const network = process.env.TATUM_NETWORK === 'tron-testnet' ? Network.TRON_SHASTA : Network.TRON;
            
            if (!apiKey || apiKey === 'your-tatum-api-key-here') {
                throw new Error('请在 .env 文件中配置有效的 TATUM_API_KEY');
            }

            // 初始化 Tatum SDK
            this.tatum = await TatumSDK.init<Tron>({
                network: network,
                apiKey: {
                    v4: apiKey
                },
                configureWalletProviders: [TronWalletProvider]
            });

            // 调试：检查 SDK 对象结构
            logger.info('Tatum SDK 对象结构', {
                hasRpc: !!this.tatum.rpc,
                rpcMethods: this.tatum.rpc ? Object.keys(this.tatum.rpc) : [],
                sdkKeys: Object.keys(this.tatum)
            });

            // 初始化主钱包
            await this.initializeMasterWallet();
            
            this.isInitialized = true;
            logger.info('Tatum SDK 初始化成功', { network: network });
            
        } catch (error) {
            logger.error('Tatum SDK 初始化失败', { error: error.message });
            throw error;
        }
    }

    /**
     * 初始化主钱包
     */
    async initializeMasterWallet() {
        try {
            const mnemonic = process.env.MASTER_WALLET_MNEMONIC;
            
            if (!mnemonic || mnemonic === 'your-master-wallet-mnemonic-here') {
                // 如果没有配置助记词，生成新的主钱包
                const newMnemonic = bip39.generateMnemonic(256);
                
                logger.warn('未找到主钱包助记词，已生成新的助记词', { 
                    mnemonic: newMnemonic 
                });
                
                this.masterMnemonic = newMnemonic;
                
            } else {
                // 从助记词恢复主钱包
                this.masterMnemonic = mnemonic;
            }

            // 生成主钱包地址
            this.masterWallet = this.generateTronAddressFromMnemonic(this.masterMnemonic, 0);
            
            logger.info('主钱包初始化成功', { address: this.masterWallet.address });
            
        } catch (error) {
            logger.error('主钱包初始化失败', { error: error.message });
            throw error;
        }
    }

    /**
     * 从助记词生成 TRON 地址和私钥
     * @param {string} mnemonic - 助记词
     * @param {number} index - 派生索引
     * @returns {Object} 包含地址和私钥的对象
     */
    generateTronAddressFromMnemonic(mnemonic, index) {
        try {
            // 从助记词生成种子
            const seed = bip39.mnemonicToSeedSync(mnemonic);
            
            // 使用 TRON 的派生路径: m/44'/195'/0'/0/index
            const root = bip32.fromSeed(seed);
            const child = root.derivePath(`m/44'/195'/0'/0/${index}`);
            
            // 获取私钥 - 正确转换为十六进制
            const privateKeyBuffer = child.privateKey;
            const privateKey = Buffer.from(privateKeyBuffer).toString('hex');
            
            // 使用 TronWeb 从私钥生成地址
            const tronWeb = new TronWeb({
                fullHost: 'https://api.trongrid.io'
            });
            
            const address = tronWeb.address.fromPrivateKey(privateKey);
            
            logger.info('生成 TRON 地址成功', { 
                address: address,
                index: index,
                privateKeyLength: privateKey.length
            });
            
            return {
                address: address,
                privateKey: privateKey
            };
            
        } catch (error) {
            logger.error('从助记词生成 TRON 地址失败', { 
                error: error.message,
                index: index 
            });
            throw error;
        }
    }

    /**
     * 为用户生成独立的充值地址
     * @param {number} userId - 用户ID
     * @returns {Promise<string>} 充值地址
     */
    async createDepositAddress(userId) {
        try {
            await this.initialize();
            
            // 检查用户是否已有充值地址
            const existingAddress = await this.getUserDepositAddress(userId);
            if (existingAddress) {
                return existingAddress;
            }

            // 为用户生成唯一的派生路径
            const derivationIndex = await this.getNextDerivationIndex(userId);
            
            // 从主钱包派生子地址
            const childWallet = this.generateTronAddressFromMnemonic(
                this.masterMnemonic,
                derivationIndex
            );

            // 保存地址映射到数据库
            await this.saveWalletMapping(userId, childWallet.address, derivationIndex, childWallet.privateKey);
            
            logger.info('为用户创建充值地址', {
                userId,
                address: childWallet.address,
                derivationIndex
            });

            return childWallet.address;
            
        } catch (error) {
            logger.error('创建充值地址失败', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * 获取用户的充值地址
     * @param {number} userId - 用户ID
     * @returns {Promise<string|null>} 充值地址
     */
    async getUserDepositAddress(userId) {
        try {
            const query = 'SELECT deposit_address FROM users WHERE id = ?';
            const [rows] = await pool.execute(query, [userId]);
            
            return rows.length > 0 ? rows[0].deposit_address : null;
            
        } catch (error) {
            logger.error('获取用户充值地址失败', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * 获取下一个派生索引
     * @param {number} userId - 用户ID
     * @returns {Promise<number>} 派生索引
     */
    async getNextDerivationIndex(userId) {
        try {
            // 使用用户ID作为基础，加上随机数确保唯一性
            const baseIndex = userId * 1000;
            const randomOffset = Math.floor(Math.random() * 1000);
            return baseIndex + randomOffset;
            
        } catch (error) {
            logger.error('获取派生索引失败', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * 保存钱包地址映射
     * @param {number} userId - 用户ID
     * @param {string} address - 钱包地址
     * @param {number} derivationIndex - 派生索引
     * @param {string} privateKey - 私钥
     */
    async saveWalletMapping(userId, address, derivationIndex, privateKey) {
        try {
            // 更新用户表中的充值地址
            const updateUserQuery = 'UPDATE users SET deposit_address = ? WHERE id = ?';
            await pool.execute(updateUserQuery, [address, userId]);

            // 保存钱包映射信息（加密私钥）
            const encryptedPrivateKey = this.encryptPrivateKey(privateKey);
            const insertMappingQuery = `
                INSERT INTO wallet_mappings (user_id, address, derivation_index, encrypted_private_key, created_at)
                VALUES (?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE
                address = VALUES(address),
                derivation_index = VALUES(derivation_index),
                encrypted_private_key = VALUES(encrypted_private_key)
            `;
            
            await pool.execute(insertMappingQuery, [userId, address, derivationIndex, encryptedPrivateKey]);
            
            logger.info('钱包映射保存成功', { userId, address });
            
        } catch (error) {
            logger.error('保存钱包映射失败', { userId, address, error: error.message });
            throw error;
        }
    }

    /**
     * 加密私钥
     * @param {string} privateKey - 私钥
     * @returns {string} 加密后的私钥
     */
    encryptPrivateKey(privateKey) {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(process.env.JWT_SECRET, 'salt', 32);
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(privateKey, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return iv.toString('hex') + ':' + encrypted;
    }

    /**
     * 解密私钥
     * @param {string} encryptedPrivateKey - 加密的私钥
     * @returns {string} 解密后的私钥
     */
    decryptPrivateKey(encryptedPrivateKey) {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(process.env.JWT_SECRET, 'salt', 32);
        
        const parts = encryptedPrivateKey.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    /**
     * 获取地址的交易记录
     * @param {string} address - TRON 地址
     * @param {Object} options - 查询选项
     * @param {string} options.next - 分页标识符
     * @param {boolean} options.onlyConfirmed - 只返回已确认交易
     * @param {boolean} options.onlyTo - 只返回转入交易
     * @param {boolean} options.onlyFrom - 只返回转出交易
     * @param {number} options.minTimestamp - 最小时间戳
     * @param {number} options.maxTimestamp - 最大时间戳
     * @returns {Promise<Object>} 交易记录对象
     */
    async getAddressTransactions(address, options = {}) {
        try {
            const apiKey = process.env.TATUM_API_KEY;
            
            logger.info('开始获取地址交易记录', { address, options });

            // 构建查询参数
            const queryParams = new URLSearchParams();
            if (options.next) queryParams.append('next', options.next);
            if (options.onlyConfirmed) queryParams.append('onlyConfirmed', 'true');
            if (options.onlyTo) queryParams.append('onlyTo', 'true');
            if (options.onlyFrom) queryParams.append('onlyFrom', 'true');
            if (options.minTimestamp) queryParams.append('minTimestamp', options.minTimestamp);
            if (options.maxTimestamp) queryParams.append('maxTimestamp', options.maxTimestamp);

            const queryString = queryParams.toString();
            const url = `https://api.tatum.io/v3/tron/transaction/account/${address}${queryString ? '?' + queryString : ''}`;

            // 获取普通交易记录
            const transactionResponse = await fetch(url, {
                method: 'GET',
                headers: {
                    'x-api-key': apiKey,
                    'accept': 'application/json'
                }
            });

            let transactions = [];
            let nextToken = null;

            if (transactionResponse.ok) {
                const transactionData = await transactionResponse.json();
                transactions = transactionData.transactions || [];
                nextToken = transactionData.next || null;

                logger.info('获取普通交易记录成功', { 
                    address, 
                    count: transactions.length,
                    hasNext: !!nextToken
                });
            } else if (transactionResponse.status === 404) {
                logger.info('地址无交易记录', { address });
                transactions = [];
            } else {
                logger.warn('获取普通交易记录失败', { 
                    address, 
                    status: transactionResponse.status 
                });
            }

            // 获取 TRC20 交易记录
            const trc20Url = `https://api.tatum.io/v3/tron/transaction/account/${address}/trc20${queryString ? '?' + queryString : ''}`;
            const trc20Response = await fetch(trc20Url, {
                method: 'GET',
                headers: {
                    'x-api-key': apiKey,
                    'accept': 'application/json'
                }
            });

            let trc20Transactions = [];

            if (trc20Response.ok) {
                const trc20Data = await trc20Response.json();
                trc20Transactions = trc20Data.transactions || [];

                logger.info('获取 TRC20 交易记录成功', { 
                    address, 
                    count: trc20Transactions.length
                });
            } else if (trc20Response.status !== 404) {
                logger.warn('获取 TRC20 交易记录失败', { 
                    address, 
                    status: trc20Response.status 
                });
            }

            // 合并并处理交易记录
            const allTransactions = [...transactions, ...trc20Transactions];
            
            // 按时间戳排序（最新的在前）
            allTransactions.sort((a, b) => (b.block_timestamp || 0) - (a.block_timestamp || 0));

            // 格式化交易记录
            const formattedTransactions = allTransactions.map(tx => this.formatTransaction(tx, address));

            logger.info('获取地址交易记录完成', { 
                address, 
                totalCount: formattedTransactions.length,
                nextToken
            });

            return {
                transactions: formattedTransactions,
                next: nextToken,
                hasMore: !!nextToken
            };

        } catch (error) {
            logger.error('获取地址交易记录失败', { address, error: error.message });
            return {
                transactions: [],
                next: null,
                hasMore: false
            };
        }
    }

    /**
     * 格式化交易记录
     * @param {Object} tx - 原始交易数据
     * @param {string} address - 查询的地址
     * @returns {Object} 格式化后的交易记录
     */
    formatTransaction(tx, address) {
        const isIncoming = tx.to === address;
        const isOutgoing = tx.from === address;
        
        // 确定交易类型
        let type = 'unknown';
        if (isIncoming && !isOutgoing) {
            type = 'deposit'; // 充值
        } else if (isOutgoing && !isIncoming) {
            type = 'withdraw'; // 提现
        } else if (isIncoming && isOutgoing) {
            type = 'self'; // 自转
        }

        // 解析金额和代币信息
        let amount = '0';
        let token = 'TRX';
        let decimals = 6;

        if (tx.value) {
            // TRX 交易
            amount = (parseFloat(tx.value) / 1000000).toString();
            token = 'TRX';
        } else if (tx.token_info) {
            // TRC20 交易
            token = tx.token_info.symbol || 'Unknown';
            decimals = parseInt(tx.token_info.decimals) || 6;
            amount = tx.value ? (parseFloat(tx.value) / Math.pow(10, decimals)).toString() : '0';
        }

        return {
            txHash: tx.txID || tx.transaction_id,
            blockNumber: tx.blockNumber || tx.block_number,
            timestamp: tx.block_timestamp || tx.timestamp || Date.now(),
            from: tx.from || tx.owner_address,
            to: tx.to || tx.to_address,
            amount,
            token,
            type,
            status: tx.ret?.[0]?.contractRet || 'SUCCESS',
            fee: tx.fee ? (parseFloat(tx.fee) / 1000000).toString() : '0',
            confirmed: tx.confirmed !== false, // 默认为已确认
            contractAddress: tx.token_info?.address || null
        };
    }

    /**
     * 处理充值交易
     * @param {string} address - 充值地址
     * @param {string} txHash - 交易哈希
     * @param {number} amount - 充值金额
     * @param {number} blockNumber - 区块号
     */
    async processDeposit(address, txHash, amount, blockNumber) {
        try {
            // 获取地址对应的用户ID
            const userId = await this.getUserIdByAddress(address);
            if (!userId) {
                logger.warn('未找到地址对应的用户', { address });
                return;
            }

            // 检查交易是否已处理
            const existingTx = await this.getTransactionByHash(txHash);
            if (existingTx) {
                logger.info('交易已处理，跳过', { txHash });
                return;
            }

            // 更新用户余额
            await this.updateUserBalance(userId, amount, 'deposit');

            // 记录交易
            await this.recordTransaction(userId, 'deposit', amount, txHash, blockNumber);

            logger.info('充值处理成功', {
                userId,
                address,
                amount,
                txHash
            });

        } catch (error) {
            logger.error('处理充值失败', { address, txHash, amount, error: error.message });
            throw error;
        }
    }

    /**
     * 根据地址获取用户ID
     * @param {string} address - 钱包地址
     * @returns {Promise<number|null>} 用户ID
     */
    async getUserIdByAddress(address) {
        try {
            const query = 'SELECT id FROM users WHERE deposit_address = ?';
            const [rows] = await pool.execute(query, [address]);
            
            return rows.length > 0 ? rows[0].id : null;
            
        } catch (error) {
            logger.error('根据地址获取用户ID失败', { address, error: error.message });
            throw error;
        }
    }

    /**
     * 根据交易哈希获取交易记录
     * @param {string} txHash - 交易哈希
     * @returns {Promise<Object|null>} 交易记录
     */
    async getTransactionByHash(txHash) {
        try {
            const query = 'SELECT * FROM wallet_transactions WHERE transaction_hash = ?';
            const [rows] = await pool.execute(query, [txHash]);
            
            return rows.length > 0 ? rows[0] : null;
            
        } catch (error) {
            logger.error('根据哈希获取交易失败', { txHash, error: error.message });
            throw error;
        }
    }

    /**
     * 更新用户余额
     * @param {number} userId - 用户ID
     * @param {number} amount - 金额变化
     * @param {string} type - 交易类型
     */
    async updateUserBalance(userId, amount, type) {
        try {
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                // 获取当前余额
                const [userRows] = await connection.execute(
                    'SELECT balance FROM users WHERE id = ? FOR UPDATE',
                    [userId]
                );

                if (userRows.length === 0) {
                    throw new Error('用户不存在');
                }

                const currentBalance = parseFloat(userRows[0].balance);
                const newBalance = type === 'deposit' 
                    ? currentBalance + amount 
                    : currentBalance - amount;

                if (newBalance < 0) {
                    throw new Error('余额不足');
                }

                // 更新余额
                await connection.execute(
                    'UPDATE users SET balance = ? WHERE id = ?',
                    [newBalance, userId]
                );

                // 记录余额变化
                await this.logBalanceChange(connection, userId, amount, currentBalance, newBalance, type);

                await connection.commit();
                
                logger.info('用户余额更新成功', {
                    userId,
                    type,
                    amount,
                    oldBalance: currentBalance,
                    newBalance
                });

            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }

        } catch (error) {
            logger.error('更新用户余额失败', { userId, amount, type, error: error.message });
            throw error;
        }
    }

    /**
     * 记录余额变化
     * @param {Object} connection - 数据库连接
     * @param {number} userId - 用户ID
     * @param {number} amount - 变化金额
     * @param {number} balanceBefore - 变化前余额
     * @param {number} balanceAfter - 变化后余额
     * @param {string} type - 变化类型
     */
    async logBalanceChange(connection, userId, amount, balanceBefore, balanceAfter, type) {
        try {
            const query = `
                INSERT INTO balance_logs (user_id, amount, balance_before, balance_after, type, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `;
            
            await connection.execute(query, [userId, amount, balanceBefore, balanceAfter, type]);
            
        } catch (error) {
            logger.error('记录余额变化失败', { userId, amount, type, error: error.message });
            throw error;
        }
    }

    /**
     * 记录交易
     * @param {number} userId - 用户ID
     * @param {string} type - 交易类型
     * @param {number} amount - 交易金额
     * @param {string} txHash - 交易哈希
     * @param {number} blockNumber - 区块号
     */
    async recordTransaction(userId, type, amount, txHash, blockNumber) {
        try {
            const query = `
                INSERT INTO wallet_transactions (
                    user_id, type, amount, transaction_hash, block_number, 
                    status, created_at
                ) VALUES (?, ?, ?, ?, ?, 'completed', NOW())
            `;
            
            await pool.execute(query, [userId, type, amount, txHash, blockNumber]);
            
        } catch (error) {
            logger.error('记录交易失败', { userId, type, amount, txHash, error: error.message });
            throw error;
        }
    }

    /**
     * 计算提现手续费
     * @param {number} amount - 提现金额
     * @returns {Object} 手续费信息
     */
    calculateWithdrawalFee(amount) {
        const fixedFee = this.fixedFee;
        const percentageFee = Math.max(
            this.minPercentageFee,
            Math.min(this.maxPercentageFee, amount * 0.02) // 2% 作为中间值
        );
        
        const totalFee = fixedFee + (amount * percentageFee);
        const actualAmount = amount - totalFee;
        
        return {
            fixedFee,
            percentageFee: percentageFee * 100, // 转换为百分比显示
            totalFee,
            actualAmount: Math.max(0, actualAmount)
        };
    }

    /**
     * 处理提现请求
     * @param {number} userId - 用户ID
     * @param {string} toAddress - 提现地址
     * @param {number} amount - 提现金额
     * @returns {Promise<string>} 交易哈希
     */
    async processWithdrawal(userId, toAddress, amount) {
        try {
            await this.initialize();

            // 计算手续费
            const feeInfo = this.calculateWithdrawalFee(amount);
            
            if (feeInfo.actualAmount <= 0) {
                throw new Error('提现金额不足以支付手续费');
            }

            // 检查用户余额
            const userBalance = await this.getUserBalance(userId);
            if (userBalance < amount) {
                throw new Error('余额不足');
            }

            // 获取主钱包私钥进行转账
            const masterPrivateKey = process.env.MASTER_WALLET_MNEMONIC 
                ? await this.getMasterWalletPrivateKey()
                : this.masterWallet.privateKey;

            // 发送 USDT 转账
            const txHash = await this.sendUSDT(
                masterPrivateKey,
                toAddress,
                feeInfo.actualAmount
            );

            // 更新用户余额
            await this.updateUserBalance(userId, amount, 'withdrawal');

            // 记录提现交易
            await this.recordWithdrawal(userId, amount, feeInfo, txHash, toAddress);

            logger.info('提现处理成功', {
                userId,
                amount,
                actualAmount: feeInfo.actualAmount,
                totalFee: feeInfo.totalFee,
                txHash
            });

            return txHash;

        } catch (error) {
            logger.error('处理提现失败', { userId, toAddress, amount, error: error.message });
            throw error;
        }
    }

    /**
     * 获取主钱包私钥
     * @returns {Promise<string>} 私钥
     */
    async getMasterWalletPrivateKey() {
        try {
            const masterWallet = this.generateTronAddressFromMnemonic(this.masterMnemonic, 0);
            return masterWallet.privateKey;
            
        } catch (error) {
            logger.error('获取主钱包私钥失败', { error: error.message });
            throw error;
        }
    }

    /**
     * 发送 USDT 转账
     * @param {string} privateKey - 发送方私钥
     * @param {string} toAddress - 接收地址
     * @param {number} amount - 转账金额
     * @returns {Promise<string>} 交易哈希
     */
    async sendUSDT(privateKey, toAddress, amount) {
        try {
            // 使用 Tatum SDK 发送 TRC20 USDT
            const transaction = await this.tatum.transaction.send({
                fromPrivateKey: privateKey,
                to: toAddress,
                amount: amount.toString(),
                currency: 'USDT_TRON'
            });

            return transaction.txId;

        } catch (error) {
            logger.error('发送 USDT 失败', { toAddress, amount, error: error.message });
            throw error;
        }
    }

    /**
     * 记录提现交易
     * @param {number} userId - 用户ID
     * @param {number} amount - 提现金额
     * @param {Object} feeInfo - 手续费信息
     * @param {string} txHash - 交易哈希
     * @param {string} toAddress - 提现地址
     */
    async recordWithdrawal(userId, amount, feeInfo, txHash, toAddress) {
        try {
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                // 记录提现交易
                const [result] = await connection.execute(`
                    INSERT INTO wallet_transactions (
                        user_id, type, amount, transaction_hash, status, 
                        to_address, fee_amount, actual_amount, created_at
                    ) VALUES (?, 'withdrawal', ?, ?, 'completed', ?, ?, ?, NOW())
                `, [userId, amount, txHash, toAddress, feeInfo.totalFee, feeInfo.actualAmount]);

                // 记录手续费收益
                await connection.execute(`
                    INSERT INTO fee_profit_records (
                        user_id, transaction_id, fee_amount, fixed_fee, percentage_fee,
                        original_amount, actual_amount, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', NOW())
                `, [
                    userId, 
                    result.insertId, 
                    feeInfo.totalFee, 
                    feeInfo.fixedFee, 
                    feeInfo.percentageFee,
                    amount,
                    feeInfo.actualAmount
                ]);

                await connection.commit();

            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }

        } catch (error) {
            logger.error('记录提现交易失败', { userId, amount, txHash, error: error.message });
            throw error;
        }
    }

    /**
     * 获取用户余额
     * @param {number} userId - 用户ID
     * @returns {Promise<number>} 用户余额
     */
    async getUserBalance(userId) {
        try {
            const query = 'SELECT balance FROM users WHERE id = ?';
            const [rows] = await pool.execute(query, [userId]);
            
            return rows.length > 0 ? parseFloat(rows[0].balance) : 0;
            
        } catch (error) {
            logger.error('获取用户余额失败', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * 资金归集 - 将子钱包余额转移到主钱包
     * @param {number} userId - 用户ID（可选，不指定则归集所有用户）
     * @returns {Promise<Array>} 归集结果
     */
    async consolidateFunds(userId = null) {
        try {
            await this.initialize();

            const results = [];
            
            // 获取需要归集的钱包地址
            const wallets = await this.getWalletsForConsolidation(userId);
            
            for (const wallet of wallets) {
                try {
                    // 获取钱包余额
                    const balance = await this.getWalletBalance(wallet.address);
                    
                    if (balance > 0.1) { // 只归集余额大于 0.1 USDT 的钱包
                        // 解密私钥
                        const privateKey = this.decryptPrivateKey(wallet.encrypted_private_key);
                        
                        // 转账到主钱包
                        const txHash = await this.sendUSDT(
                            privateKey,
                            this.masterWallet.address,
                            balance - 0.05 // 保留少量 TRX 作为手续费
                        );

                        results.push({
                            userId: wallet.user_id,
                            address: wallet.address,
                            amount: balance - 0.05,
                            txHash,
                            status: 'success'
                        });

                        // 记录归集交易
                        await this.recordConsolidation(wallet.user_id, wallet.address, balance - 0.05, txHash);

                    } else {
                        results.push({
                            userId: wallet.user_id,
                            address: wallet.address,
                            amount: balance,
                            status: 'skipped',
                            reason: 'balance_too_low'
                        });
                    }

                } catch (error) {
                    results.push({
                        userId: wallet.user_id,
                        address: wallet.address,
                        status: 'failed',
                        error: error.message
                    });
                }
            }

            logger.info('资金归集完成', { 
                totalWallets: wallets.length,
                successCount: results.filter(r => r.status === 'success').length,
                results 
            });

            return results;

        } catch (error) {
            logger.error('资金归集失败', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * 获取需要归集的钱包
     * @param {number|null} userId - 用户ID
     * @returns {Promise<Array>} 钱包列表
     */
    async getWalletsForConsolidation(userId) {
        try {
            let query = 'SELECT user_id, address, encrypted_private_key FROM wallet_mappings';
            let params = [];
            
            if (userId) {
                query += ' WHERE user_id = ?';
                params.push(userId);
            }
            
            const [rows] = await pool.execute(query, params);
            return rows;
            
        } catch (error) {
            logger.error('获取归集钱包列表失败', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * 获取钱包 USDT 余额
     * @param {string} address - 钱包地址
     * @returns {Promise<number>} USDT 余额
     */
    /**
     * 获取钱包地址余额
     * @param {string} address - 钱包地址
     * @returns {Object} 余额信息 { trx, usdt }
     */
    async getWalletBalance(address) {
        try {
            const apiKey = process.env.TATUM_API_KEY;
            let trxAmount = 0;
            let usdtAmount = 0;
            
            // 获取 TRX 余额
            try {
                const accountResponse = await fetch(`https://api.tatum.io/v3/tron/account/${address}`, {
                    method: 'GET',
                    headers: {
                        'x-api-key': apiKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (accountResponse.ok) {
                    const accountData = await accountResponse.json();
                    trxAmount = parseFloat(accountData.balance || 0) / 1000000; // 转换为 TRX
                    
                    // 检查 TRC20 代币余额
                    if (accountData.trc20 && Array.isArray(accountData.trc20)) {
                        const usdtToken = accountData.trc20.find(token => 
                            token.token_address === 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
                        );
                        if (usdtToken) {
                            usdtAmount = parseFloat(usdtToken.balance || 0) / 1000000; // USDT 6位小数
                        }
                    }
                } else if (accountResponse.status === 404) {
                    // 地址在链上没有记录，余额为 0
                    trxAmount = 0;
                } else {
                    throw new Error(`获取账户信息失败: ${accountResponse.status}`);
                }
            } catch (fetchError) {
                logger.warn('获取 TRX 余额失败，设为 0', { error: fetchError.message });
                trxAmount = 0;
            }
            
            // 获取 USDT TRC20 余额（如果上面没有获取到）
            if (usdtAmount === 0) {
                const usdtContractAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
                
                try {
                    const usdtResponse = await fetch(`https://api.tatum.io/v3/tatum/wallet/${usdtContractAddress}/balance/${address}`, {
                        method: 'GET',
                        headers: {
                            'x-api-key': apiKey,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (usdtResponse.ok) {
                        const usdtData = await usdtResponse.json();
                        usdtAmount = parseFloat(usdtData.balance || 0);
                    } else if (usdtResponse.status === 404) {
                        // 地址没有 USDT 余额
                        usdtAmount = 0;
                    }
                } catch (usdtError) {
                    logger.warn('获取 USDT 余额失败，设为 0', { error: usdtError.message });
                    usdtAmount = 0;
                }
            }
            
            return {
                trx: trxAmount.toString(),
                usdt: usdtAmount.toString()
            };

        } catch (error) {
            logger.error('获取钱包余额失败', { address, error: error.message });
            return {
                trx: '0',
                usdt: '0'
            };
        }
    }

    /**
     * 记录归集交易
     * @param {number} userId - 用户ID
     * @param {string} fromAddress - 源地址
     * @param {number} amount - 归集金额
     * @param {string} txHash - 交易哈希
     */
    async recordConsolidation(userId, fromAddress, amount, txHash) {
        try {
            const query = `
                INSERT INTO wallet_transactions (
                    user_id, type, amount, transaction_hash, from_address, 
                    to_address, status, created_at
                ) VALUES (?, 'consolidation', ?, ?, ?, ?, 'completed', NOW())
            `;
            
            await pool.execute(query, [
                userId, 
                amount, 
                txHash, 
                fromAddress, 
                this.masterWallet.address
            ]);
            
        } catch (error) {
            logger.error('记录归集交易失败', { userId, fromAddress, amount, txHash, error: error.message });
            throw error;
        }
    }

    /**
     * 获取主钱包余额
     * @returns {Promise<Object>} 主钱包余额信息
     */
    async getMasterWalletBalance() {
        try {
            await this.initialize();
            
            if (!this.masterWallet || !this.masterWallet.address) {
                throw new Error('主钱包未初始化');
            }
            
            const address = this.masterWallet.address;
            const apiKey = process.env.TATUM_API_KEY;
            
            let trxAmount = 0;
            let usdtAmount = 0;
            
            // 使用 Tatum REST API 获取账户信息
            try {
                const accountResponse = await fetch(`https://api.tatum.io/v3/tron/account/${address}`, {
                    method: 'GET',
                    headers: {
                        'x-api-key': apiKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (accountResponse.ok) {
                    const accountData = await accountResponse.json();
                    // 解析 TRX 余额 (单位: sun, 1 TRX = 1,000,000 sun)
                    trxAmount = accountData.balance ? parseFloat(accountData.balance) / 1000000 : 0;
                    
                    // 检查是否有 TRC20 USDT
                    if (accountData.trc20 && Array.isArray(accountData.trc20)) {
                        const usdtToken = accountData.trc20.find(token => 
                            token[usdtContractAddress] !== undefined
                        );
                        if (usdtToken) {
                            // USDT 有 6 位小数
                            usdtAmount = parseFloat(usdtToken[usdtContractAddress]) / 1000000;
                        }
                    }
                } else if (accountResponse.status === 404) {
                    // 404 表示地址在链上没有记录，余额为 0
                    logger.info('地址在链上没有记录，余额为 0', { address });
                    trxAmount = 0;
                } else {
                    throw new Error(`获取账户信息失败: ${accountResponse.status}`);
                }
            } catch (fetchError) {
                logger.warn('获取 TRX 余额失败，设为 0', { error: fetchError.message });
                trxAmount = 0;
            }
            
            // 获取 USDT TRC20 余额
            const usdtContractAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
            
            try {
                const usdtResponse = await fetch(`https://api.tatum.io/v3/tatum/wallet/${usdtContractAddress}/balance/${address}`, {
                    method: 'GET',
                    headers: {
                        'x-api-key': apiKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (usdtResponse.ok) {
                    const usdtData = await usdtResponse.json();
                    usdtAmount = usdtData.balance ? parseFloat(usdtData.balance) / 1000000 : 0;
                } else if (usdtResponse.status === 404) {
                    // 404 表示地址没有该代币余额
                    usdtAmount = 0;
                }
            } catch (usdtError) {
                logger.warn('获取 USDT 余额失败，设为 0', { error: usdtError.message });
                usdtAmount = 0;
            }
            
            const balanceInfo = {
                address: address,
                trx: trxAmount.toFixed(6),
                usdt: usdtAmount.toFixed(6),
                timestamp: Date.now()
            };
            
            logger.info('获取主钱包余额成功', balanceInfo);
            return balanceInfo;
            
        } catch (error) {
            logger.error('获取主钱包余额失败', { error: error.message });
            throw error;
        }
    }

    /**
     * 获取网络信息
     * @returns {Promise<Object>} 网络信息
     */
    async getNetworkInfo() {
        try {
            await this.initialize();
            
            // 使用 Tatum SDK 的 notification API 获取网络状态
            // 由于 Tatum SDK 没有直接的网络信息 API，我们返回基本信息
            const networkInfo = {
                network: 'tron-mainnet',
                status: 'connected',
                provider: 'Tatum SDK',
                timestamp: Date.now()
            };
            
            logger.info('获取网络信息成功', networkInfo);
            return networkInfo;
            
        } catch (error) {
            logger.error('获取网络信息失败', { error: error.message });
            throw error;
        }
    }

    /**
     * 销毁 SDK 连接
     */
    async destroy() {
        try {
            if (this.tatum) {
                await this.tatum.destroy();
                this.isInitialized = false;
                logger.info('Tatum SDK 连接已关闭');
            }
        } catch (error) {
            logger.error('关闭 Tatum SDK 失败', { error: error.message });
        }
    }
}

module.exports = new RealTatumWalletService();