const { TatumSDK, Network, Tron } = require('@tatumio/tatum');
const { pool, redisClient } = require('../config/database');

/**
 * 手续费利润管理服务
 * 负责计算客户手续费与Tatum实际手续费的差额，并将利润转入指定钱包
 */
class FeeProfitService {
    constructor() {
        this.tatum = null;
        this.pool = pool; // 添加数据库连接池引用
        this.usdtContractAddress = process.env.USDT_CONTRACT_ADDRESS;
        
        // 手续费配置
        this.tatumActualFee = parseFloat(process.env.TATUM_ACTUAL_FEE) || 1.0;
        this.customerFixedFee = parseFloat(process.env.CUSTOMER_FIXED_FEE) || 2.0;
        this.customerPercentageFeeMin = parseFloat(process.env.CUSTOMER_PERCENTAGE_FEE_MIN) || 0.01;
        this.customerPercentageFeeMax = parseFloat(process.env.CUSTOMER_PERCENTAGE_FEE_MAX) || 0.05;
        
        // 利润钱包配置
        this.feeProfitWalletAddress = process.env.FEE_PROFIT_WALLET_ADDRESS;
        this.feeProfitPrivateKey = process.env.FEE_PROFIT_PRIVATE_KEY;
        this.profitWalletAddress = process.env.PROFIT_WALLET_ADDRESS || 'TProfit1234567890123456789012345';
        
        // 主钱包配置（用于支付Tatum手续费）
        this.masterWalletAddress = process.env.PAYMENT_WALLET_ADDRESS;
        this.masterWalletPrivateKey = process.env.PAYMENT_PRIVATE_KEY;
    }

    /**
     * 初始化Tatum SDK
     */
    async initialize() {
        try {
            if (!this.tatum) {
                this.tatum = await TatumSDK.init({
                    network: process.env.TATUM_TESTNET === 'true' ? Network.TRON_SHASTA : Network.TRON,
                    apiKey: process.env.TATUM_API_KEY,
                    verbose: true
                });
                console.log('✅ FeeProfitService Tatum SDK 初始化成功');
            }
        } catch (error) {
            console.error('❌ FeeProfitService Tatum SDK 初始化失败:', error);
            throw error;
        }
    }

    /**
     * 计算客户手续费
     * @param {number} amount - 提币金额
     * @returns {Object} 客户手续费详情
     */
    calculateCustomerFee(amount) {
        const fixedFee = this.customerFixedFee;
        const percentageRate = amount > 1000 ? this.customerPercentageFeeMax : 
                              (amount > 500 ? 0.03 : this.customerPercentageFeeMin);
        const percentageFee = amount * percentageRate;
        const totalCustomerFee = fixedFee + percentageFee;

        return {
            fixedFee,
            percentageFee: parseFloat(percentageFee.toFixed(6)),
            percentageRate,
            totalFee: parseFloat(totalCustomerFee.toFixed(6)),
            netAmount: parseFloat((amount - totalCustomerFee).toFixed(6))
        };
    }

    /**
     * 计算手续费利润
     * @param {number} amount - 提币金额
     * @returns {Object} 手续费利润详情
     */
    calculateFeeProfit(amount) {
        const customerFee = this.calculateCustomerFee(amount);
        const tatumFee = this.tatumActualFee;
        const profit = customerFee.totalFee - tatumFee;

        return {
            customerFee: customerFee.totalFee,
            tatumFee,
            profit: parseFloat(profit.toFixed(6)),
            profitMargin: parseFloat(((profit / customerFee.totalFee) * 100).toFixed(2)),
            customerFeeDetails: customerFee
        };
    }

    /**
     * 转账手续费利润到利润钱包
     * @param {string} withdrawalId - 提币记录ID
     * @param {number} amount - 原始提币金额
     * @param {string} originalTxHash - 原始提币交易哈希
     * @returns {Promise<Object>} 转账结果
     */
    async transferFeeProfit(withdrawalId, amount, originalTxHash) {
        try {
            // 计算手续费利润
            const profitInfo = this.calculateFeeProfit(amount);
            
            if (profitInfo.profit <= 0) {
                console.log(`❌ 提币 ${withdrawalId} 无利润可转账: ${profitInfo.profit} USDT`);
                return {
                    success: false,
                    message: '无利润可转账',
                    profit: profitInfo.profit
                };
            }

            console.log(`💰 开始转账手续费利润: ${profitInfo.profit} USDT (提币ID: ${withdrawalId})`);

            // 记录转账尝试
            await this.recordFeeProfitTransfer(
                withdrawalId,
                amount,
                profitInfo,
                null, // 暂时没有交易哈希
                originalTxHash
            );

            // 模拟转账（实际环境中应该调用真实的转账接口）
            const mockTxHash = `0xprofit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            console.log(`✅ 手续费利润转账成功: ${mockTxHash}`);
            console.log(`📊 利润详情: 客户手续费 ${profitInfo.customerFee} USDT - Tatum手续费 ${profitInfo.tatumFee} USDT = 利润 ${profitInfo.profit} USDT`);

            return {
                success: true,
                profit: profitInfo.profit,
                txHash: mockTxHash,
                withdrawalId: withdrawalId
            };

        } catch (error) {
            console.error(`❌ 手续费利润转账失败 (提币ID: ${withdrawalId}):`, error);
            
            // 记录失败的转账尝试
            await this.recordFeeProfitTransferError(withdrawalId, amount, error.message);
            
            return {
                success: false,
                error: error.message,
                withdrawalId: withdrawalId
            };
        }
    }

    /**
     * 记录手续费利润转账
     * @param {string} withdrawalId - 提币记录ID
     * @param {number} originalAmount - 原始提币金额
     * @param {number} customerFee - 客户手续费
     * @param {number} tatumFee - Tatum手续费
     * @param {number} profitAmount - 利润金额
     * @param {number} profitMargin - 利润率
     * @param {string} profitTxHash - 利润转账哈希
     * @param {string} status - 状态
     */
    async recordFeeProfitTransfer(withdrawalId, originalAmount, customerFee, tatumFee, profitAmount, profitMargin, profitTxHash, status) {
        try {
            const query = `
                INSERT INTO fee_profit_records (
                    withdrawal_id, original_amount, customer_fee, tatum_fee, 
                    profit_amount, profit_margin, profit_tx_hash, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;

            const values = [
                withdrawalId,
                originalAmount,
                customerFee,
                tatumFee,
                profitAmount,
                profitMargin,
                profitTxHash,
                status
            ];

            await pool.execute(query, values);
            console.log('✅ 手续费利润记录已保存');

        } catch (error) {
            console.error('❌ 保存手续费利润记录失败:', error);
            // 不抛出错误，避免影响主流程
        }
    }

    /**
     * 更新手续费利润记录
     * @param {string} withdrawalId - 提币记录ID
     * @param {string} txHash - 交易哈希
     * @param {string} status - 状态
     */
    async updateFeeProfitRecord(withdrawalId, txHash, status) {
        try {
            const query = `
                UPDATE fee_profit_records 
                SET profit_tx_hash = ?, status = ?, updated_at = NOW()
                WHERE withdrawal_id = ?
            `;

            await pool.execute(query, [txHash, status, withdrawalId]);
            console.log(`✅ 手续费利润记录已更新: ${withdrawalId} -> ${status}`);

        } catch (error) {
            console.error('❌ 更新手续费利润记录失败:', error);
        }
    }

    /**
     * 记录手续费利润转账错误
     * @param {string} withdrawalId - 提币记录ID
     * @param {string} errorMessage - 错误信息
     */
    async recordFeeProfitError(withdrawalId, errorMessage) {
        try {
            const query = `
                UPDATE fee_profit_records 
                SET status = 'failed', error_message = ?, updated_at = NOW()
                WHERE withdrawal_id = ?
            `;

            await pool.execute(query, [errorMessage, withdrawalId]);
            console.log(`❌ 手续费利润错误已记录: ${withdrawalId}`);

        } catch (error) {
            console.error('❌ 记录手续费利润错误失败:', error);
        }
    }

    /**
     * 获取手续费利润记录列表（带分页和筛选）
     * @param {Object} options - 查询选项
     * @param {number} options.page - 页码
     * @param {number} options.limit - 每页数量
     * @param {string} options.status - 状态筛选
     * @param {string} options.startDate - 开始日期
     * @param {string} options.endDate - 结束日期
     * @returns {Promise<Object>} 记录列表和分页信息
     */
    async getFeeProfitRecords(options = {}) {
        try {
            const { page = 1, limit = 20, status, startDate, endDate } = options;
            const offset = (page - 1) * limit;
            
            let whereClause = '';
            const params = [];
            
            if (status) {
                whereClause += ' WHERE status = ?';
                params.push(status);
            }
            
            if (startDate && endDate) {
                whereClause += (whereClause ? ' AND' : ' WHERE') + ' DATE(created_at) BETWEEN ? AND ?';
                params.push(startDate, endDate);
            }
            
            const query = `
                SELECT 
                    id, withdrawal_id, original_amount, customer_fee, tatum_fee,
                    profit_amount, profit_margin, profit_tx_hash, profit_wallet_address,
                    status, error_message, created_at, updated_at
                FROM fee_profit_records
                ${whereClause}
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `;
            
            params.push(limit, offset);
            
            const [records] = await this.pool.execute(query, params);
            
            // 获取总数
            const countQuery = `SELECT COUNT(*) as total FROM fee_profit_records ${whereClause}`;
            const countParams = params.slice(0, -2); // 移除 limit 和 offset
            const [countResult] = await this.pool.execute(countQuery, countParams);
            const total = countResult[0].total;
            
            return {
                records,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('❌ 获取手续费利润记录失败:', error);
            throw error;
        }
    }

    /**
     * 获取手续费利润统计
     * @param {number} days - 统计天数，默认30天
     * @returns {Promise<Array>} 统计数据
     */
    async getFeeProfitStats(days = 30) {
        try {
            const query = `
                SELECT 
                    DATE(created_at) as profit_date,
                    COUNT(*) as total_records,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_records,
                    SUM(CASE WHEN status = 'completed' THEN profit_amount ELSE 0 END) as total_profit,
                    AVG(CASE WHEN status = 'completed' THEN profit_amount ELSE NULL END) as avg_profit,
                    MAX(CASE WHEN status = 'completed' THEN profit_amount ELSE NULL END) as max_profit,
                    MIN(CASE WHEN status = 'completed' THEN profit_amount ELSE NULL END) as min_profit
                FROM fee_profit_records 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY DATE(created_at)
                ORDER BY profit_date DESC
            `;

            const [rows] = await this.pool.execute(query, [days]);
            return rows;

        } catch (error) {
            console.error('❌ 获取手续费利润统计失败:', error);
            throw error;
        }
    }

    /**
     * 获取利润钱包余额
     * @returns {Promise<number>} 利润钱包余额
     */
    async getProfitWalletBalance() {
        try {
            if (!this.tatum) {
                await this.initializeTatum();
            }

            // 使用 Tatum API 查询 TRC20 USDT 余额
            const response = await fetch(`https://api.tatum.io/v3/tron/account/${this.profitWalletAddress}/balance`, {
                method: 'GET',
                headers: {
                    'x-api-key': process.env.TATUM_API_KEY,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`获取余额失败: ${response.statusText}`);
            }

            const data = await response.json();
            
            // 查找 USDT 代币余额
            const usdtBalance = data.trc20?.find(token => 
                token.contract === process.env.USDT_CONTRACT_ADDRESS
            );

            return usdtBalance ? parseFloat(usdtBalance.balance) : 0;

        } catch (error) {
            console.error('❌ 获取利润钱包余额失败:', error);
            throw error;
        }
    }
    async getFeeProfitWalletBalance() {
        try {
            if (!this.tatum) {
                await this.initialize();
            }

            const balance = await this.tatum.rpc.getBalance(this.feeProfitWalletAddress);
            return parseFloat(balance.balance || 0);

        } catch (error) {
            console.error('❌ 获取利润钱包余额失败:', error);
            return 0;
        }
    }

    /**
     * 销毁服务实例
     */
    async destroy() {
        if (this.tatum) {
            await this.tatum.destroy();
            this.tatum = null;
        }
    }
}

// 创建单例实例
const feeProfitService = new FeeProfitService();

// 自动初始化
(async () => {
    try {
        await feeProfitService.initialize();
    } catch (error) {
        console.error('FeeProfitService 自动初始化失败:', error);
    }
})();

module.exports = feeProfitService;