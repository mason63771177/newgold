const { TatumSDK, Network, Tron } = require('@tatumio/tatum');
const { pool, redisClient } = require('../config/database');
const UserWalletAddress = require('../models/UserWalletAddress');

/**
 * 资金归集服务
 * 负责将用户充值钱包的资金定期归集到主钱包
 */
class FundConsolidationService {
    constructor() {
        this.tatum = null;
        this.isRunning = false;
        this.consolidationInterval = 30 * 60 * 1000; // 30分钟执行一次
        this.minConsolidationAmount = 10; // 最小归集金额 10 USDT
        this.masterWalletAddress = process.env.MASTER_WALLET_ADDRESS;
        this.masterWalletPrivateKey = process.env.MASTER_WALLET_PRIVATE_KEY;
    }

    /**
     * 初始化 Tatum SDK
     */
    async initialize() {
        try {
            this.tatum = await TatumSDK.init({
                network: Network.TRON,
                apiKey: {
                    v4: process.env.TATUM_API_KEY
                }
            });
            console.log('✅ 资金归集服务初始化成功');
        } catch (error) {
            console.error('❌ 资金归集服务初始化失败:', error);
            throw error;
        }
    }

    /**
     * 获取需要归集的钱包地址列表
     * @param {number} minBalance - 最小余额阈值（USDT）
     * @returns {Array} 钱包地址列表
     */
    async getWalletsForConsolidation(minBalance = 10) {
        try {
            // 使用新的UserWalletAddress模型获取有余额的地址
            const addressesWithBalance = await UserWalletAddress.findAddressesWithBalance('TRC20', minBalance);
            
            // 验证实时余额
            const walletsToConsolidate = [];
            for (const addressInfo of addressesWithBalance) {
                const realTimeBalance = await this.getWalletBalance(addressInfo.address);
                if (realTimeBalance >= minBalance) {
                    walletsToConsolidate.push({
                        wallet_address: addressInfo.address,
                        user_id: addressInfo.userId,
                        private_key_encrypted: addressInfo.privateKeyEncrypted,
                        balance: realTimeBalance,
                        created_at: addressInfo.createdAt
                    });
                }
            }
            
            console.log(`📊 找到 ${walletsToConsolidate.length} 个需要归集的钱包`);
            return walletsToConsolidate;
        } catch (error) {
            console.error('❌ 获取归集钱包列表失败:', error);
            throw error;
        }
    }

    /**
     * 获取钱包USDT余额
     * @param {string} address - 钱包地址
     * @returns {number} USDT余额
     */
    async getWalletBalance(address) {
        try {
            if (!this.tatum) {
                await this.initialize();
            }

            // 获取TRC20 USDT余额
            const balance = await this.tatum.rpc.getTokenBalance(
                address,
                process.env.USDT_CONTRACT_ADDRESS
            );
            
            return parseFloat(balance) || 0;
            
        } catch (error) {
            console.error(`❌ 获取钱包 ${address} 余额失败:`, error);
            return 0;
        }
    }

    /**
     * 执行单个钱包的资金归集
     * @param {Object} wallet - 钱包信息
     * @returns {Object} 归集结果
     */
    async consolidateWallet(wallet) {
        try {
            const { wallet_address, user_id, private_key_encrypted, balance } = wallet;
            
            // 计算归集金额（预留少量TRX作为手续费）
            const consolidationAmount = balance - 0.1; // 预留0.1 USDT等值的TRX
            
            if (consolidationAmount <= 0) {
                return {
                    address: wallet_address,
                    status: 'skipped',
                    reason: '余额不足以支付手续费',
                    amount: 0
                };
            }

            // 解密私钥
            const privateKey = this.decryptPrivateKey(private_key_encrypted);
            
            // 构建转账交易
            const txData = {
                from: wallet_address,
                to: process.env.MASTER_WALLET_ADDRESS,
                amount: consolidationAmount.toString(),
                tokenAddress: process.env.USDT_CONTRACT_ADDRESS,
                fromPrivateKey: privateKey
            };

            // 发送交易
            const txResult = await this.tatum.rpc.sendTransaction(txData);
            
            if (txResult.txId) {
                // 记录归集操作到fund_consolidation_records表
                await this.recordConsolidation({
                    from_address: wallet_address,
                    to_address: process.env.MASTER_WALLET_ADDRESS,
                    amount: consolidationAmount,
                    tx_hash: txResult.txId,
                    status: 'pending'
                });

                console.log(`✅ 钱包 ${wallet_address} 归集成功, 金额: ${consolidationAmount} USDT, TX: ${txResult.txId}`);
                
                return {
                    address: wallet_address,
                    status: 'success',
                    amount: consolidationAmount,
                    txHash: txResult.txId
                };
            } else {
                throw new Error('交易发送失败');
            }
            
        } catch (error) {
            console.error(`❌ 钱包 ${wallet.wallet_address} 归集失败:`, error);
            
            return {
                address: wallet.wallet_address,
                status: 'failed',
                error: error.message,
                amount: 0
            };
        }
    }

    /**
     * 批量执行资金归集
     * @param {Array} walletAddresses - 指定的钱包地址列表（可选）
     * @param {number} minBalance - 最小余额阈值
     * @returns {Object} 归集结果汇总
     */
    async consolidateFunds(walletAddresses = null, minBalance = 10) {
        // 获取分布式锁
        const lockKey = 'fund_consolidation_lock';
        const lockAcquired = await redisClient.set(
            lockKey, 
            Date.now(), 
            'PX', 30000, // 30秒过期
            'NX' // 只在不存在时设置
        );

        if (!lockAcquired) {
            throw new Error('资金归集正在进行中，请稍后再试');
        }

        try {
            console.log('🚀 开始执行资金归集...');
            
            let walletsToConsolidate;
            
            if (walletAddresses && walletAddresses.length > 0) {
                // 使用指定的钱包地址
                const addressesWithBalance = await UserWalletAddress.findAddressesWithBalance(minBalance);
                walletsToConsolidate = addressesWithBalance.filter(addr => 
                    walletAddresses.includes(addr.address)
                ).map(addr => ({
                    wallet_address: addr.address,
                    user_id: addr.user_id,
                    private_key_encrypted: addr.private_key_encrypted,
                    balance: 0, // 将在下面获取实时余额
                    created_at: addr.created_at
                }));
                
                // 检查实时余额
                for (const wallet of walletsToConsolidate) {
                    const balance = await this.getWalletBalance(wallet.wallet_address);
                    wallet.balance = balance;
                }
                
                // 过滤掉余额不足的钱包
                walletsToConsolidate = walletsToConsolidate.filter(w => w.balance >= minBalance);
            } else {
                // 自动获取需要归集的钱包
                walletsToConsolidate = await this.getWalletsForConsolidation(minBalance);
            }

            if (walletsToConsolidate.length === 0) {
                console.log('📝 没有需要归集的钱包');
                return {
                    total: 0,
                    successful: 0,
                    failed: 0,
                    totalAmount: 0,
                    results: []
                };
            }

            // 批量执行归集
            const results = [];
            let totalAmount = 0;
            let successCount = 0;
            let failCount = 0;

            for (const wallet of walletsToConsolidate) {
                const result = await this.consolidateWallet(wallet);
                results.push(result);
                
                if (result.status === 'success') {
                    successCount++;
                    totalAmount += result.amount;
                } else {
                    failCount++;
                }

                // 避免请求过于频繁
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log(`📊 资金归集完成: 成功 ${successCount}, 失败 ${failCount}, 总金额 ${totalAmount} USDT`);

            return {
                total: walletsToConsolidate.length,
                successful: successCount,
                failed: failCount,
                totalAmount,
                results
            };

        } finally {
            // 释放锁
            await redisClient.del(lockKey);
        }
    }

    /**
     * 解密私钥
     * @param {string} encryptedPrivateKey - 加密的私钥
     * @returns {string} 解密后的私钥
     */
    decryptPrivateKey(encryptedPrivateKey) {
        try {
            // TODO: 实现私钥解密逻辑
            // 这里应该使用与userWalletAddressService中相同的解密方法
            // 临时返回加密的私钥，实际应该解密
            return encryptedPrivateKey;
        } catch (error) {
            console.error('❌ 解密私钥失败:', error);
            throw error;
        }
    }

    /**
     * 记录归集操作到数据库
     * @param {Object} consolidationData - 归集数据
     */
    async recordConsolidation(consolidationData) {
        try {
            const {
                from_address,
                to_address,
                amount,
                tx_hash,
                status
            } = consolidationData;

            const insertQuery = `
                INSERT INTO fund_consolidation_records 
                (from_address, to_address, amount, tx_hash, status, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `;

            await pool.execute(insertQuery, [
                from_address,
                to_address,
                amount,
                tx_hash,
                status
            ]);

            console.log(`📝 归集记录已保存: ${from_address} -> ${to_address} ${amount} USDT`);
            
        } catch (error) {
            console.error('❌ 保存归集记录失败:', error);
        }
    }

    /**
     * 获取归集历史记录
     * @param {number} page - 页码
     * @param {number} limit - 每页数量
     * @returns {Promise<Object>} 归集历史记录
     */
    async getConsolidationHistory(page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            
            // 查询归集记录
            const query = `
                SELECT 
                    fc.id,
                    fc.from_address,
                    fc.to_address,
                    fc.amount,
                    fc.tx_hash,
                    fc.status,
                    fc.failure_reason,
                    fc.created_at,
                    fc.updated_at
                FROM fund_consolidation_records fc
                ORDER BY fc.created_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `;

            const [rows] = await pool.execute(query);

            // 查询总数
            const countQuery = 'SELECT COUNT(*) as total FROM fund_consolidation_records';
            const [countResult] = await pool.execute(countQuery);
            const total = countResult[0].total;

            return {
                records: rows,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            console.error('❌ 获取归集历史失败:', error);
            throw error;
        }
    }

    /**
     * 定时任务：自动资金归集
     * 建议通过cron job调用此方法
     */
    async autoConsolidate() {
        try {
            console.log('🤖 开始自动资金归集任务...');
            
            const result = await this.consolidateFunds(null, 50); // 50 USDT以上才归集
            
            console.log(`🤖 自动归集完成: ${result.successful}/${result.total} 成功`);
            
            return result;
            
        } catch (error) {
            console.error('❌ 自动归集任务失败:', error);
            throw error;
        }
    }

    /**
     * 销毁服务
     */
    async destroy() {
        if (this.tatum) {
            await this.tatum.destroy();
        }
    }
}

/**
 * 获取归集历史记录
 * @param {number} page - 页码
 * @param {number} limit - 每页数量
 * @param {object} filters - 过滤条件
 * @returns {Promise<object>} 归集历史记录
 */
async function getConsolidationHistory(page = 1, limit = 10, filters = {}) {
    const connection = await pool.getConnection();
    
    try {
        let whereClause = 'WHERE 1=1';
        const params = [];
        
        // 状态过滤
        if (filters.status) {
            whereClause += ' AND status = ?';
            params.push(filters.status);
        }
        
        // 日期范围过滤
        if (filters.startDate) {
            whereClause += ' AND created_at >= ?';
            params.push(filters.startDate);
        }
        
        if (filters.endDate) {
            whereClause += ' AND created_at <= ?';
            params.push(filters.endDate);
        }
        
        // 获取总数
        const [countResult] = await connection.execute(`
            SELECT COUNT(*) as total FROM fund_consolidation_records ${whereClause}
        `, params);
        
        const total = countResult[0].total;
        
        // 获取分页数据
        const offset = (page - 1) * limit;
        const [records] = await connection.execute(`
            SELECT 
                id,
                from_address,
                to_address,
                amount,
                tx_hash,
                status,
                failure_reason,
                created_at,
                updated_at
            FROM fund_consolidation_records 
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);
        
        return {
            records,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
        
    } finally {
        connection.release();
    }
}

module.exports = new FundConsolidationService();
module.exports.getConsolidationHistory = getConsolidationHistory;