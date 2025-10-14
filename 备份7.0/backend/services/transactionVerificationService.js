/**
 * 交易验证服务
 * 处理交易状态和确认数验证
 */

const tatumRpcClient = require('../utils/tatumRpcClient');
const redis = require('../config/redis');
const logger = require('../utils/logger');

class TransactionVerificationService {
    constructor() {
        this.logger = logger;
        this.redis = redis;

        // 验证配置
        this.config = {
            requiredConfirmations: {
                trx: 1,      // TRX转账需要的确认数
                usdt: 1,     // USDT转账需要的确认数
                default: 1   // 默认确认数
            },
            cacheExpiry: 300, // 缓存过期时间（秒）
            maxRetries: 3,    // 最大重试次数
            retryDelay: 2000  // 重试延迟（毫秒）
        };

        this.logger.info('交易验证服务初始化完成');
    }

    /**
     * 验证交易状态
     * @param {string} txHash - 交易哈希
     * @returns {Promise<Object>} 交易验证结果
     */
    async verifyTransaction(txHash) {
        try {
            if (!txHash) {
                throw new Error('交易哈希不能为空');
            }

            this.logger.debug('开始验证交易', { txHash });

            // 检查缓存
            const cacheKey = `tx_verify:${txHash}`;
            const cached = await this.redis.get(cacheKey);
            
            if (cached) {
                const result = JSON.parse(cached);
                this.logger.debug('从缓存获取交易验证结果', { txHash });
                return result;
            }

            // 获取交易详情
            const transaction = await this.getTransactionDetails(txHash);
            
            if (!transaction) {
                return {
                    txHash,
                    exists: false,
                    verified: false,
                    message: '交易不存在'
                };
            }

            // 验证交易
            const verificationResult = await this.performVerification(transaction);

            // 缓存结果
            await this.redis.setEx(
                cacheKey, 
                this.config.cacheExpiry, 
                JSON.stringify(verificationResult)
            );

            this.logger.info('交易验证完成', { 
                txHash, 
                verified: verificationResult.verified 
            });

            return verificationResult;

        } catch (error) {
            this.logger.error('验证交易失败', { txHash, error: error.message });
            throw error;
        }
    }

    /**
     * 批量验证交易
     * @param {Array<string>} txHashes - 交易哈希数组
     * @returns {Promise<Array>} 验证结果数组
     */
    async verifyTransactionsBatch(txHashes) {
        try {
            if (!Array.isArray(txHashes) || txHashes.length === 0) {
                throw new Error('交易哈希数组不能为空');
            }

            this.logger.info('开始批量验证交易', { count: txHashes.length });

            const results = [];
            
            // 并发验证，但限制并发数量
            const batchSize = 10;
            for (let i = 0; i < txHashes.length; i += batchSize) {
                const batch = txHashes.slice(i, i + batchSize);
                const batchPromises = batch.map(txHash => 
                    this.verifyTransaction(txHash).catch(error => ({
                        txHash,
                        exists: false,
                        verified: false,
                        error: error.message
                    }))
                );

                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);
            }

            this.logger.info('批量验证完成', { 
                total: txHashes.length,
                verified: results.filter(r => r.verified).length 
            });

            return results;

        } catch (error) {
            this.logger.error('批量验证交易失败', { error: error.message });
            throw error;
        }
    }

    /**
     * 获取交易详情
     * @param {string} txHash - 交易哈希
     * @returns {Promise<Object|null>} 交易详情
     */
    async getTransactionDetails(txHash) {
        try {
            // 获取交易基本信息
            const transaction = await tatumRpcClient.getTransaction(txHash);
            
            if (!transaction) {
                return null;
            }

            // 获取交易收据
            const receipt = await tatumRpcClient.getTransactionReceipt(txHash);

            // 获取当前最新区块号
            const latestBlockNumber = await tatumRpcClient.getLatestBlockNumber();

            // 计算确认数
            const confirmations = transaction.blockNumber ? 
                latestBlockNumber - parseInt(transaction.blockNumber, 16) + 1 : 0;

            return {
                ...transaction,
                receipt,
                confirmations,
                latestBlockNumber
            };

        } catch (error) {
            this.logger.error('获取交易详情失败', { txHash, error: error.message });
            return null;
        }
    }

    /**
     * 执行交易验证
     * @param {Object} transaction - 交易详情
     * @returns {Promise<Object>} 验证结果
     */
    async performVerification(transaction) {
        try {
            const { hash, blockNumber, receipt, confirmations } = transaction;

            let verificationResult = {
                txHash: hash,
                exists: true,
                blockNumber: blockNumber ? parseInt(blockNumber, 16) : null,
                confirmations,
                verified: false,
                status: 'pending',
                details: {},
                message: ''
            };

            // 检查交易是否已上链
            if (!blockNumber) {
                verificationResult.status = 'pending';
                verificationResult.message = '交易尚未上链';
                return verificationResult;
            }

            // 检查交易是否成功
            if (!receipt || receipt.status !== '0x1') {
                verificationResult.status = 'failed';
                verificationResult.message = '交易执行失败';
                return verificationResult;
            }

            // 分析交易类型
            const transactionType = this.analyzeTransactionType(transaction);
            verificationResult.details.type = transactionType;

            // 获取所需确认数
            const requiredConfirmations = this.getRequiredConfirmations(transactionType);
            verificationResult.details.requiredConfirmations = requiredConfirmations;

            // 检查确认数是否足够
            if (confirmations >= requiredConfirmations) {
                verificationResult.verified = true;
                verificationResult.status = 'confirmed';
                verificationResult.message = `交易已确认 (${confirmations}/${requiredConfirmations})`;
            } else {
                verificationResult.status = 'confirming';
                verificationResult.message = `等待确认 (${confirmations}/${requiredConfirmations})`;
            }

            // 添加交易详细信息
            verificationResult.details = {
                ...verificationResult.details,
                ...this.extractTransactionDetails(transaction)
            };

            return verificationResult;

        } catch (error) {
            this.logger.error('执行交易验证失败', { 
                txHash: transaction.hash, 
                error: error.message 
            });
            
            return {
                txHash: transaction.hash,
                exists: true,
                verified: false,
                status: 'error',
                message: `验证失败: ${error.message}`
            };
        }
    }

    /**
     * 分析交易类型
     * @param {Object} transaction - 交易详情
     * @returns {string} 交易类型
     */
    analyzeTransactionType(transaction) {
        const { value, input, receipt } = transaction;

        // 检查是否是TRX转账
        if (value && value !== '0x0') {
            return 'trx_transfer';
        }

        // 检查是否是智能合约调用（可能是USDT转账）
        if (receipt && receipt.logs && receipt.logs.length > 0) {
            // 检查Transfer事件
            const transferEventSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
            
            for (const log of receipt.logs) {
                if (log.topics && log.topics[0] === transferEventSignature) {
                    return 'usdt_transfer';
                }
            }
            
            return 'contract_call';
        }

        return 'unknown';
    }

    /**
     * 获取所需确认数
     * @param {string} transactionType - 交易类型
     * @returns {number} 所需确认数
     */
    getRequiredConfirmations(transactionType) {
        switch (transactionType) {
            case 'trx_transfer':
                return this.config.requiredConfirmations.trx;
            case 'usdt_transfer':
                return this.config.requiredConfirmations.usdt;
            default:
                return this.config.requiredConfirmations.default;
        }
    }

    /**
     * 提取交易详细信息
     * @param {Object} transaction - 交易详情
     * @returns {Object} 交易详细信息
     */
    extractTransactionDetails(transaction) {
        const { from, to, value, gasUsed, gasPrice, receipt } = transaction;

        let details = {
            from,
            to,
            gasUsed: gasUsed ? parseInt(gasUsed, 16) : 0,
            gasPrice: gasPrice ? parseInt(gasPrice, 16) : 0,
            timestamp: Date.now()
        };

        // 提取TRX金额
        if (value && value !== '0x0') {
            details.trxAmount = this.weiToTrx(value);
        }

        // 提取USDT转账信息
        if (receipt && receipt.logs) {
            const usdtTransfer = this.parseUsdtTransfer(receipt.logs);
            if (usdtTransfer) {
                details.usdtTransfer = usdtTransfer;
            }
        }

        return details;
    }

    /**
     * 解析USDT转账信息
     * @param {Array} logs - 交易日志
     * @returns {Object|null} USDT转账信息
     */
    parseUsdtTransfer(logs) {
        try {
            const transferEventSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
            
            for (const log of logs) {
                if (log.topics && log.topics[0] === transferEventSignature) {
                    const fromAddr = '0x' + log.topics[1].slice(26);
                    const toAddr = '0x' + log.topics[2].slice(26);
                    const amount = parseInt(log.data, 16) / 1000000; // USDT 6位小数

                    return {
                        contractAddress: log.address,
                        from: fromAddr,
                        to: toAddr,
                        amount: amount
                    };
                }
            }

            return null;

        } catch (error) {
            this.logger.error('解析USDT转账失败', { error: error.message });
            return null;
        }
    }

    /**
     * 等待交易确认
     * @param {string} txHash - 交易哈希
     * @param {number} requiredConfirmations - 所需确认数
     * @param {number} timeout - 超时时间（毫秒）
     * @returns {Promise<Object>} 确认结果
     */
    async waitForConfirmation(txHash, requiredConfirmations = null, timeout = 300000) {
        try {
            const startTime = Date.now();
            
            this.logger.info('等待交易确认', { txHash, requiredConfirmations, timeout });

            while (Date.now() - startTime < timeout) {
                const verification = await this.verifyTransaction(txHash);
                
                if (!verification.exists) {
                    throw new Error('交易不存在');
                }

                if (verification.status === 'failed') {
                    throw new Error('交易执行失败');
                }

                const targetConfirmations = requiredConfirmations || 
                    verification.details?.requiredConfirmations || 
                    this.config.requiredConfirmations.default;

                if (verification.confirmations >= targetConfirmations) {
                    this.logger.info('交易确认完成', { 
                        txHash, 
                        confirmations: verification.confirmations 
                    });
                    return verification;
                }

                // 等待一段时间后重试
                await new Promise(resolve => setTimeout(resolve, 5000));
            }

            throw new Error('等待交易确认超时');

        } catch (error) {
            this.logger.error('等待交易确认失败', { txHash, error: error.message });
            throw error;
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
     * 清除交易验证缓存
     * @param {string} txHash - 交易哈希
     */
    async clearVerificationCache(txHash) {
        try {
            const cacheKey = `tx_verify:${txHash}`;
            await this.redis.del(cacheKey);
            this.logger.debug('清除交易验证缓存', { txHash });
        } catch (error) {
            this.logger.error('清除缓存失败', { txHash, error: error.message });
        }
    }

    /**
     * 获取验证统计信息
     * @returns {Promise<Object>} 统计信息
     */
    async getVerificationStats() {
        try {
            const keys = await this.redis.keys('tx_verify:*');
            const totalCached = keys.length;

            return {
                totalCached,
                config: this.config,
                timestamp: Date.now()
            };

        } catch (error) {
            this.logger.error('获取验证统计失败', { error: error.message });
            return {
                totalCached: 0,
                config: this.config,
                error: error.message,
                timestamp: Date.now()
            };
        }
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
                stats: await this.getVerificationStats(),
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
const transactionVerificationService = new TransactionVerificationService();

module.exports = transactionVerificationService;