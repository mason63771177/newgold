/**
 * 充值监听服务
 * 监控玩家充值地址的交易活动，支持实时和轮询两种模式
 */

const tatumRpcClient = require('../utils/tatumRpcClient');
const balanceQueryService = require('./balanceQueryService');
const redis = require('../config/redis');
const logger = require('../utils/logger');
const EventEmitter = require('events');
const UserWalletAddress = require('../models/UserWalletAddress');
const pool = require('../config/database');

class DepositMonitoringService extends EventEmitter {
    constructor() {
        super();
        this.logger = logger;
        this.redis = redis;

        // 监控配置
        this.config = {
            blockScanInterval: 15000, // 区块扫描间隔（毫秒）
            confirmationBlocks: 1, // 确认区块数
            maxBlocksPerScan: 10, // 每次扫描的最大区块数
            retryAttempts: 3, // 重试次数
            batchSize: 50 // 批量处理大小
        };

        // 监控状态
        this.isMonitoring = false;
        this.monitoringInterval = null;
        this.lastProcessedBlock = 0;
        this.monitoredAddresses = new Set();

        this.logger.info('充值监听服务初始化完成');
    }

    /**
     * 开始监控充值
     * @param {Array<string>} addresses - 要监控的地址列表
     */
    async startMonitoring(addresses = []) {
        try {
            if (this.isMonitoring) {
                this.logger.warn('监控服务已在运行中');
                return;
            }

            // 如果没有提供地址，则从数据库加载所有活跃地址
            if (addresses.length === 0) {
                const activeAddresses = await UserWalletAddress.findActiveAddresses();
                addresses = activeAddresses.map(addr => addr.address);
                this.logger.info('从数据库加载活跃地址', { count: addresses.length });
            }

            // 添加监控地址
            addresses.forEach(addr => this.monitoredAddresses.add(addr.toLowerCase()));

            // 获取最新区块号作为起始点
            this.lastProcessedBlock = await this.getLastProcessedBlock();
            
            this.isMonitoring = true;
            this.monitoringInterval = setInterval(
                () => this.scanBlocks(), 
                this.config.blockScanInterval
            );

            this.logger.info('开始监控充值', {
                addressCount: this.monitoredAddresses.size,
                startBlock: this.lastProcessedBlock,
                interval: this.config.blockScanInterval
            });

            // 触发监控开始事件
            this.emit('monitoringStarted', {
                addressCount: this.monitoredAddresses.size,
                startBlock: this.lastProcessedBlock
            });

        } catch (error) {
            this.logger.error('启动监控失败', { error: error.message });
            throw error;
        }
    }

    /**
     * 停止监控充值
     */
    async stopMonitoring() {
        try {
            if (!this.isMonitoring) {
                this.logger.warn('监控服务未在运行');
                return;
            }

            this.isMonitoring = false;
            
            if (this.monitoringInterval) {
                clearInterval(this.monitoringInterval);
                this.monitoringInterval = null;
            }

            this.logger.info('停止监控充值');

            // 触发监控停止事件
            this.emit('monitoringStopped');

        } catch (error) {
            this.logger.error('停止监控失败', { error: error.message });
        }
    }

    /**
     * 添加监控地址
     * @param {string|Array<string>} addresses - 地址或地址数组
     */
    addMonitoredAddresses(addresses) {
        const addressList = Array.isArray(addresses) ? addresses : [addresses];
        
        addressList.forEach(addr => {
            this.monitoredAddresses.add(addr.toLowerCase());
        });

        this.logger.info('添加监控地址', { 
            newAddresses: addressList.length,
            totalAddresses: this.monitoredAddresses.size 
        });
    }

    /**
     * 移除监控地址
     * @param {string|Array<string>} addresses - 地址或地址数组
     */
    removeMonitoredAddresses(addresses) {
        const addressList = Array.isArray(addresses) ? addresses : [addresses];
        
        addressList.forEach(addr => {
            this.monitoredAddresses.delete(addr.toLowerCase());
        });

        this.logger.info('移除监控地址', { 
            removedAddresses: addressList.length,
            totalAddresses: this.monitoredAddresses.size 
        });
    }

    /**
     * 刷新监控地址列表
     * 从数据库重新加载所有活跃地址
     */
    async refreshMonitoredAddresses() {
        try {
            const activeAddresses = await UserWalletAddress.findActiveAddresses();
            const addresses = activeAddresses.map(addr => addr.address);
            
            // 清空现有地址并重新添加
            this.monitoredAddresses.clear();
            addresses.forEach(addr => this.monitoredAddresses.add(addr.toLowerCase()));
            
            this.logger.info('刷新监控地址列表', { count: addresses.length });
            
            return addresses.length;
        } catch (error) {
            this.logger.error('刷新监控地址列表失败', { error: error.message });
            throw error;
        }
    }

    /**
     * 扫描区块寻找充值交易
     */
    async scanBlocks() {
        try {
            if (this.monitoredAddresses.size === 0) {
                return;
            }

            const latestBlock = await tatumRpcClient.getLatestBlockNumber();
            const startBlock = this.lastProcessedBlock + 1;
            const endBlock = Math.min(
                startBlock + this.config.maxBlocksPerScan - 1, 
                latestBlock - this.config.confirmationBlocks
            );

            if (startBlock > endBlock) {
                return; // 没有新区块需要处理
            }

            this.logger.debug('扫描区块范围', { startBlock, endBlock, latestBlock });

            // 扫描区块范围
            for (let blockNumber = startBlock; blockNumber <= endBlock; blockNumber++) {
                await this.scanSingleBlock(blockNumber);
            }

            // 更新最后处理的区块
            this.lastProcessedBlock = endBlock;
            await this.saveLastProcessedBlock(endBlock);

        } catch (error) {
            this.logger.error('扫描区块失败', { error: error.message });
            
            // 触发错误事件
            this.emit('scanError', error);
        }
    }

    /**
     * 扫描单个区块
     * @param {number} blockNumber - 区块号
     */
    async scanSingleBlock(blockNumber) {
        try {
            const block = await tatumRpcClient.getBlock(blockNumber, true);
            
            if (!block || !block.transactions) {
                return;
            }

            this.logger.debug('扫描区块', { 
                blockNumber, 
                transactionCount: block.transactions.length 
            });

            // 处理区块中的交易
            for (const tx of block.transactions) {
                await this.processTransaction(tx, blockNumber);
            }

        } catch (error) {
            this.logger.error('扫描单个区块失败', { blockNumber, error: error.message });
        }
    }

    /**
     * 处理交易
     * @param {Object} transaction - 交易对象
     * @param {number} blockNumber - 区块号
     */
    async processTransaction(transaction, blockNumber) {
        try {
            const { hash, to, from, value, input } = transaction;

            // 检查是否是发送到监控地址的交易
            if (!to || !this.monitoredAddresses.has(to.toLowerCase())) {
                return;
            }

            // 检查是否已处理过此交易
            const processedKey = `processed_tx:${hash}`;
            const isProcessed = await this.redis.get(processedKey);
            
            if (isProcessed) {
                return;
            }

            // 判断交易类型
            const depositInfo = await this.analyzeTransaction(transaction, blockNumber);
            
            if (depositInfo) {
                // 标记交易为已处理
                await this.redis.setEx(processedKey, 86400, '1'); // 24小时过期

                // 处理充值到数据库
                await this.processDepositToDatabase(depositInfo);

                // 触发充值事件
                this.emit('depositDetected', depositInfo);

                this.logger.info('检测到充值交易', depositInfo);
            }

        } catch (error) {
            this.logger.error('处理交易失败', { 
                txHash: transaction.hash, 
                error: error.message 
            });
        }
    }

    /**
     * 处理充值到数据库
     * @param {Object} depositInfo - 充值信息
     */
    async processDepositToDatabase(depositInfo) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // 查找对应的用户钱包地址
            const walletAddress = await UserWalletAddress.findByAddress(depositInfo.toAddress);
            
            if (!walletAddress) {
                this.logger.warn('未找到对应的用户钱包地址', { address: depositInfo.toAddress });
                return;
            }

            // 只处理USDT充值
            if (depositInfo.currency !== 'USDT') {
                this.logger.info('跳过非USDT充值', { 
                    currency: depositInfo.currency, 
                    txHash: depositInfo.txHash 
                });
                return;
            }

            // 更新用户余额
            await connection.execute(
                'UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?',
                [depositInfo.amount, walletAddress.userId]
            );

            // 更新钱包地址的接收总额
            await UserWalletAddress.updateReceivedAmount(
                walletAddress.id, 
                depositInfo.amount
            );

            // 记录钱包交易
            await connection.execute(
                `INSERT INTO wallet_transactions (
                    user_id, transaction_id, type, amount, fee, 
                    balance_before, balance_after, status, 
                    blockchain_tx_hash, wallet_address, deposit_address,
                    confirmation_count, network, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    walletAddress.userId,
                    depositInfo.txHash,
                    'deposit',
                    depositInfo.amount,
                    0, // 充值无手续费
                    0, // TODO: 获取充值前余额
                    depositInfo.amount, // TODO: 获取充值后余额
                    'completed',
                    depositInfo.txHash,
                    depositInfo.toAddress,
                    depositInfo.toAddress,
                    depositInfo.confirmations || 1,
                    'TRON',
                ]
            );

            await connection.commit();

            this.logger.info('充值处理完成', {
                userId: walletAddress.userId,
                amount: depositInfo.amount,
                txHash: depositInfo.txHash
            });

        } catch (error) {
            await connection.rollback();
            this.logger.error('处理充值到数据库失败', { 
                error: error.message,
                depositInfo 
            });
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * 分析交易类型和金额
     * @param {Object} transaction - 交易对象
     * @param {number} blockNumber - 区块号
     * @returns {Promise<Object|null>} 充值信息
     */
    async analyzeTransaction(transaction, blockNumber) {
        try {
            const { hash, to, from, value, input } = transaction;

            // 获取交易收据以获取更多信息
            const receipt = await tatumRpcClient.getTransactionReceipt(hash);
            
            if (!receipt || receipt.status !== '0x1') {
                return null; // 交易失败
            }

            let depositInfo = {
                txHash: hash,
                toAddress: to,
                fromAddress: from,
                blockNumber: blockNumber,
                timestamp: Date.now(),
                confirmations: 0,
                type: 'unknown',
                amount: 0,
                currency: 'TRX'
            };

            // 分析TRX转账
            if (value && value !== '0x0') {
                const trxAmount = this.weiToTrx(value);
                if (trxAmount > 0) {
                    depositInfo.type = 'trx_transfer';
                    depositInfo.amount = trxAmount;
                    depositInfo.currency = 'TRX';
                }
            }

            // 分析USDT转账（通过日志）
            if (receipt.logs && receipt.logs.length > 0) {
                const usdtTransfer = this.parseUsdtTransfer(receipt.logs, to);
                if (usdtTransfer) {
                    depositInfo.type = 'usdt_transfer';
                    depositInfo.amount = usdtTransfer.amount;
                    depositInfo.currency = 'USDT';
                    depositInfo.contractAddress = usdtTransfer.contractAddress;
                }
            }

            // 只返回有效的充值信息
            return depositInfo.amount > 0 ? depositInfo : null;

        } catch (error) {
            this.logger.error('分析交易失败', { 
                txHash: transaction.hash, 
                error: error.message 
            });
            return null;
        }
    }

    /**
     * 解析USDT转账日志
     * @param {Array} logs - 交易日志
     * @param {string} toAddress - 接收地址
     * @returns {Object|null} USDT转账信息
     */
    parseUsdtTransfer(logs, toAddress) {
        try {
            // USDT Transfer事件签名: Transfer(address,address,uint256)
            const transferEventSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
            
            for (const log of logs) {
                if (log.topics && log.topics[0] === transferEventSignature) {
                    // 解析Transfer事件
                    const fromAddr = '0x' + log.topics[1].slice(26); // 去掉前面的0
                    const toAddr = '0x' + log.topics[2].slice(26);
                    const amount = parseInt(log.data, 16) / 1000000; // USDT 6位小数

                    // 检查是否是发送到目标地址
                    if (toAddr.toLowerCase() === toAddress.toLowerCase() && amount > 0) {
                        return {
                            contractAddress: log.address,
                            amount: amount,
                            from: fromAddr,
                            to: toAddr
                        };
                    }
                }
            }

            return null;

        } catch (error) {
            this.logger.error('解析USDT转账日志失败', { error: error.message });
            return null;
        }
    }

    /**
     * 手动检查地址充值
     * @param {string} address - 要检查的地址
     * @param {number} fromBlock - 起始区块
     * @param {number} toBlock - 结束区块
     * @returns {Promise<Array>} 充值记录
     */
    async manualCheckDeposits(address, fromBlock, toBlock) {
        try {
            const deposits = [];
            
            this.logger.info('手动检查充值', { address, fromBlock, toBlock });

            for (let blockNumber = fromBlock; blockNumber <= toBlock; blockNumber++) {
                const block = await tatumRpcClient.getBlock(blockNumber, true);
                
                if (block && block.transactions) {
                    for (const tx of block.transactions) {
                        if (tx.to && tx.to.toLowerCase() === address.toLowerCase()) {
                            const depositInfo = await this.analyzeTransaction(tx, blockNumber);
                            if (depositInfo) {
                                deposits.push(depositInfo);
                            }
                        }
                    }
                }
            }

            this.logger.info('手动检查完成', { 
                address, 
                blockRange: `${fromBlock}-${toBlock}`,
                depositsFound: deposits.length 
            });

            return deposits;

        } catch (error) {
            this.logger.error('手动检查充值失败', { 
                address, 
                fromBlock, 
                toBlock, 
                error: error.message 
            });
            throw error;
        }
    }

    /**
     * 获取监控状态
     * @returns {Object} 监控状态信息
     */
    getMonitoringStatus() {
        return {
            isMonitoring: this.isMonitoring,
            monitoredAddressCount: this.monitoredAddresses.size,
            lastProcessedBlock: this.lastProcessedBlock,
            config: this.config,
            uptime: this.isMonitoring ? Date.now() - this.startTime : 0
        };
    }

    /**
     * 获取最后处理的区块号
     * @returns {Promise<number>} 区块号
     */
    async getLastProcessedBlock() {
        try {
            const blockNumber = await this.redis.get('deposit_monitor:last_block');
            if (blockNumber) {
                return parseInt(blockNumber);
            }

            // 如果没有记录，使用当前最新区块号
            const latestBlock = await tatumRpcClient.getLatestBlockNumber();
            return latestBlock;

        } catch (error) {
            this.logger.error('获取最后处理区块失败', { error: error.message });
            return 0;
        }
    }

    /**
     * 保存最后处理的区块号
     * @param {number} blockNumber - 区块号
     */
    async saveLastProcessedBlock(blockNumber) {
        try {
            await this.redis.set('deposit_monitor:last_block', blockNumber.toString());
        } catch (error) {
            this.logger.error('保存最后处理区块失败', { blockNumber, error: error.message });
        }
    }

    /**
     * Wei转TRX
     * @param {string} weiAmount - Wei数量
     * @returns {number} TRX数量
     */
    weiToTrx(weiAmount) {
        const wei = BigInt(weiAmount);
        const trx = Number(wei) / Math.pow(10, 6); // TRX使用6位小数
        return Math.round(trx * 1000000) / 1000000; // 保留6位小数
    }

    /**
     * 健康检查
     * @returns {Promise<Object>} 健康状态
     */
    async healthCheck() {
        try {
            const rpcHealthy = await tatumRpcClient.healthCheck();
            const redisHealthy = await this.redis.ping() === 'PONG';

            return {
                healthy: rpcHealthy && redisHealthy,
                services: {
                    rpc: rpcHealthy,
                    redis: redisHealthy
                },
                monitoring: this.getMonitoringStatus(),
                timestamp: Date.now()
            };

        } catch (error) {
            this.logger.error('健康检查失败', { error: error.message });
            return {
                healthy: false,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
}

// 创建单例实例
const depositMonitoringService = new DepositMonitoringService();

module.exports = depositMonitoringService;