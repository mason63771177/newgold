/**
 * 余额查询服务
 * 支持TRX和USDT余额的实时查询和缓存
 */

const tatumRpcClient = require('../utils/tatumRpcClient');
const redis = require('../config/redis');
const logger = require('../utils/logger');

class BalanceQueryService {
    constructor() {
        this.logger = logger;
        this.redis = redis;
        
        // 缓存配置
        this.cacheConfig = {
            trxBalanceTTL: 30, // TRX余额缓存30秒
            usdtBalanceTTL: 60, // USDT余额缓存60秒
            batchQueryLimit: 10 // 批量查询限制
        };

        this.logger.info('余额查询服务初始化完成');
    }

    /**
     * 查询TRX余额
     * @param {string} address - 钱包地址
     * @param {boolean} useCache - 是否使用缓存
     * @returns {Promise<Object>} 余额信息
     */
    async getTrxBalance(address, useCache = true) {
        try {
            const cacheKey = `trx_balance:${address}`;
            
            // 尝试从缓存获取
            if (useCache) {
                const cachedBalance = await this.redis.get(cacheKey);
                if (cachedBalance) {
                    this.logger.debug('从缓存获取TRX余额', { address, balance: cachedBalance });
                    return {
                        address,
                        balance: parseFloat(cachedBalance),
                        currency: 'TRX',
                        source: 'cache',
                        timestamp: Date.now()
                    };
                }
            }

            // 从RPC查询
            const balanceWei = await tatumRpcClient.getTrxBalance(address);
            const balanceTrx = this.weiToTrx(balanceWei);

            // 缓存结果
            if (useCache) {
                await this.redis.setEx(cacheKey, this.cacheConfig.trxBalanceTTL, balanceTrx.toString());
            }

            this.logger.info('查询TRX余额成功', { address, balance: balanceTrx });

            return {
                address,
                balance: balanceTrx,
                currency: 'TRX',
                source: 'rpc',
                timestamp: Date.now()
            };

        } catch (error) {
            this.logger.error('查询TRX余额失败', { address, error: error.message });
            throw new Error(`查询TRX余额失败: ${error.message}`);
        }
    }

    /**
     * 查询USDT余额
     * @param {string} address - 钱包地址
     * @param {boolean} useCache - 是否使用缓存
     * @returns {Promise<Object>} 余额信息
     */
    async getUsdtBalance(address, useCache = true) {
        try {
            const cacheKey = `usdt_balance:${address}`;
            
            // 尝试从缓存获取
            if (useCache) {
                const cachedBalance = await this.redis.get(cacheKey);
                if (cachedBalance) {
                    this.logger.debug('从缓存获取USDT余额', { address, balance: cachedBalance });
                    return {
                        address,
                        balance: parseFloat(cachedBalance),
                        currency: 'USDT',
                        source: 'cache',
                        timestamp: Date.now()
                    };
                }
            }

            // 从RPC查询
            const balanceUsdt = await tatumRpcClient.getUsdtBalance(address);

            // 缓存结果
            if (useCache) {
                await this.redis.setEx(cacheKey, this.cacheConfig.usdtBalanceTTL, balanceUsdt.toString());
            }

            this.logger.info('查询USDT余额成功', { address, balance: balanceUsdt });

            return {
                address,
                balance: balanceUsdt,
                currency: 'USDT',
                source: 'rpc',
                timestamp: Date.now()
            };

        } catch (error) {
            this.logger.error('查询USDT余额失败', { address, error: error.message });
            throw new Error(`查询USDT余额失败: ${error.message}`);
        }
    }

    /**
     * 查询完整余额信息（TRX + USDT）
     * @param {string} address - 钱包地址
     * @param {boolean} useCache - 是否使用缓存
     * @returns {Promise<Object>} 完整余额信息
     */
    async getFullBalance(address, useCache = true) {
        try {
            const [trxResult, usdtResult] = await Promise.all([
                this.getTrxBalance(address, useCache),
                this.getUsdtBalance(address, useCache)
            ]);

            return {
                address,
                trx: trxResult.balance,
                usdt: usdtResult.balance,
                balances: {
                    trx: trxResult.balance,
                    usdt: usdtResult.balance
                },
                timestamp: Date.now()
            };

        } catch (error) {
            this.logger.error('查询完整余额失败', { address, error: error.message });
            throw new Error(`查询完整余额失败: ${error.message}`);
        }
    }

    /**
     * 批量查询余额
     * @param {Array<string>} addresses - 地址数组
     * @param {string} currency - 货币类型 ('TRX', 'USDT', 'ALL')
     * @param {boolean} useCache - 是否使用缓存
     * @returns {Promise<Array>} 余额信息数组
     */
    async getBatchBalances(addresses, currency = 'ALL', useCache = true) {
        try {
            if (addresses.length > this.cacheConfig.batchQueryLimit) {
                throw new Error(`批量查询地址数量超过限制: ${this.cacheConfig.batchQueryLimit}`);
            }

            const results = [];

            for (const address of addresses) {
                try {
                    let balanceInfo;

                    switch (currency.toUpperCase()) {
                        case 'TRX':
                            balanceInfo = await this.getTrxBalance(address, useCache);
                            break;
                        case 'USDT':
                            balanceInfo = await this.getUsdtBalance(address, useCache);
                            break;
                        case 'ALL':
                            balanceInfo = await this.getFullBalance(address, useCache);
                            break;
                        default:
                            throw new Error(`不支持的货币类型: ${currency}`);
                    }

                    results.push({
                        success: true,
                        data: balanceInfo
                    });

                } catch (error) {
                    results.push({
                        success: false,
                        address,
                        error: error.message
                    });
                }
            }

            this.logger.info('批量查询余额完成', { 
                addressCount: addresses.length, 
                currency,
                successCount: results.filter(r => r.success).length
            });

            return results;

        } catch (error) {
            this.logger.error('批量查询余额失败', { error: error.message });
            throw error;
        }
    }

    /**
     * 监控地址余额变化
     * @param {string} address - 监控地址
     * @param {Function} callback - 变化回调函数
     * @param {number} interval - 检查间隔（毫秒）
     */
    async monitorBalanceChanges(address, callback, interval = 30000) {
        let lastBalance = null;

        const checkBalance = async () => {
            try {
                const currentBalance = await this.getFullBalance(address, false);
                
                if (lastBalance) {
                    const trxChanged = lastBalance.balances.trx.balance !== currentBalance.balances.trx.balance;
                    const usdtChanged = lastBalance.balances.usdt.balance !== currentBalance.balances.usdt.balance;
                    
                    if (trxChanged || usdtChanged) {
                        this.logger.info('检测到余额变化', { 
                            address, 
                            oldBalance: lastBalance, 
                            newBalance: currentBalance 
                        });
                        
                        callback({
                            address,
                            oldBalance: lastBalance,
                            newBalance: currentBalance,
                            changes: {
                                trx: trxChanged,
                                usdt: usdtChanged
                            }
                        });
                    }
                }

                lastBalance = currentBalance;

            } catch (error) {
                this.logger.error('余额监控检查失败', { address, error: error.message });
            }
        };

        // 立即执行一次
        await checkBalance();

        // 设置定时检查
        const intervalId = setInterval(checkBalance, interval);

        this.logger.info('开始监控余额变化', { address, interval });

        return {
            stop: () => {
                clearInterval(intervalId);
                this.logger.info('停止监控余额变化', { address });
            }
        };
    }

    /**
     * 清除地址余额缓存
     * @param {string} address - 钱包地址
     * @param {string} currency - 货币类型 ('TRX', 'USDT', 'ALL')
     */
    async clearBalanceCache(address, currency = 'ALL') {
        try {
            const keys = [];

            switch (currency.toUpperCase()) {
                case 'TRX':
                    keys.push(`trx_balance:${address}`);
                    break;
                case 'USDT':
                    keys.push(`usdt_balance:${address}`);
                    break;
                case 'ALL':
                    keys.push(`trx_balance:${address}`, `usdt_balance:${address}`);
                    break;
            }

            if (keys.length > 0) {
                await this.redis.del(...keys);
                this.logger.info('清除余额缓存成功', { address, currency, keys });
            }

        } catch (error) {
            this.logger.error('清除余额缓存失败', { address, currency, error: error.message });
        }
    }

    /**
     * 获取余额统计信息
     * @param {Array<string>} addresses - 地址数组
     * @returns {Promise<Object>} 统计信息
     */
    async getBalanceStats(addresses) {
        return await this.getBalanceStatistics(addresses);
    }

    /**
     * 获取余额统计信息
     * @param {Array<string>} addresses - 地址数组
     * @returns {Promise<Object>} 统计信息
     */
    async getBalanceStatistics(addresses) {
        try {
            const balances = await this.getBatchBalances(addresses, 'ALL', true);
            const successfulBalances = balances.filter(b => b.success).map(b => b.data);

            const stats = {
                totalAddresses: addresses.length,
                successfulQueries: successfulBalances.length,
                failedQueries: balances.length - successfulBalances.length,
                totalTrx: 0,
                totalUsdt: 0,
                averageTrx: 0,
                averageUsdt: 0,
                timestamp: Date.now()
            };

            // 计算总额和平均值
            successfulBalances.forEach(balance => {
                stats.totalTrx += balance.balances.trx.balance;
                stats.totalUsdt += balance.balances.usdt.balance;
            });

            if (successfulBalances.length > 0) {
                stats.averageTrx = stats.totalTrx / successfulBalances.length;
                stats.averageUsdt = stats.totalUsdt / successfulBalances.length;
            }

            this.logger.info('余额统计完成', stats);
            return stats;

        } catch (error) {
            this.logger.error('获取余额统计失败', { error: error.message });
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
     * TRX转Wei
     * @param {number} trxAmount - TRX数量
     * @returns {string} Wei数量
     */
    trxToWei(trxAmount) {
        const wei = BigInt(Math.round(trxAmount * Math.pow(10, 6)));
        return wei.toString();
    }

    /**
     * 健康检查
     * @returns {Promise<Object>} 健康状态
     */
    async healthCheck() {
        try {
            // 检查RPC连接
            const rpcHealthy = await tatumRpcClient.healthCheck();
            
            // 检查Redis连接
            const redisHealthy = await this.redis.ping() === 'PONG';

            const isHealthy = rpcHealthy && redisHealthy;

            return {
                healthy: isHealthy,
                services: {
                    rpc: rpcHealthy,
                    redis: redisHealthy
                },
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
const balanceQueryService = new BalanceQueryService();

module.exports = balanceQueryService;