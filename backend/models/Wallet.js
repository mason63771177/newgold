/**
 * 钱包模型 - 用户钱包数据模型
 * 管理用户钱包信息和相关操作
 */

const { pool } = require('../config/database');
const logger = require('../utils/logger');

class Wallet {
    constructor(data = {}) {
        this.id = data.id || null;
        this.userId = data.userId || data.user_id || null;
        this.address = data.address || null;
        this.balance = parseFloat(data.balance || '0');
        this.frozenBalance = parseFloat(data.frozenBalance || data.frozen_balance || '0');
        this.network = data.network || 'TRC20';
        this.currency = data.currency || 'USDT';
        this.derivationIndex = data.derivationIndex || data.derivation_index || 0;
        this.isActive = data.isActive !== undefined ? data.isActive : (data.is_active !== undefined ? data.is_active : true);
        this.createdAt = data.createdAt || data.created_at || null;
        this.updatedAt = data.updatedAt || data.updated_at || null;
    }

    /**
     * 创建新钱包
     * @param {Object} walletData - 钱包数据
     * @returns {Promise<Wallet>} 钱包实例
     */
    static async create(walletData) {
        try {
            const {
                userId,
                address,
                balance = 0,
                frozenBalance = 0,
                network = 'TRC20',
                currency = 'USDT',
                derivationIndex = 0
            } = walletData;

            const query = `
                INSERT INTO wallets (
                    user_id, address, balance, frozen_balance, 
                    network, currency, derivation_index, is_active, 
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
            `;

            const [result] = await pool.execute(query, [
                userId, address, balance, frozenBalance,
                network, currency, derivationIndex
            ]);

            const wallet = new Wallet({
                id: result.insertId,
                userId,
                address,
                balance,
                frozenBalance,
                network,
                currency,
                derivationIndex,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            logger.info('钱包创建成功', { walletId: wallet.id, userId, address });
            return wallet;
        } catch (error) {
            logger.error('创建钱包失败', { walletData, error: error.message });
            throw error;
        }
    }

    /**
     * 根据ID查找钱包
     * @param {number} id - 钱包ID
     * @returns {Promise<Wallet|null>} 钱包实例
     */
    static async findById(id) {
        try {
            const query = `
                SELECT * FROM wallets 
                WHERE id = ? AND is_active = 1
            `;
            const [rows] = await pool.execute(query, [id]);
            
            if (rows.length === 0) {
                return null;
            }

            return new Wallet(rows[0]);
        } catch (error) {
            logger.error('根据ID查找钱包失败', { id, error: error.message });
            throw error;
        }
    }

    /**
     * 根据用户ID查找钱包
     * @param {number} userId - 用户ID
     * @returns {Promise<Wallet|null>} 钱包实例
     */
    static async findByUserId(userId) {
        try {
            const query = `
                SELECT * FROM wallets 
                WHERE user_id = ? AND is_active = 1
                ORDER BY created_at DESC
                LIMIT 1
            `;
            const [rows] = await pool.execute(query, [userId]);
            
            if (rows.length === 0) {
                return null;
            }

            return new Wallet(rows[0]);
        } catch (error) {
            logger.error('根据用户ID查找钱包失败', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * 根据地址查找钱包
     * @param {string} address - 钱包地址
     * @returns {Promise<Wallet|null>} 钱包实例
     */
    static async findByAddress(address) {
        try {
            const query = `
                SELECT * FROM wallets 
                WHERE address = ? AND is_active = 1
            `;
            const [rows] = await pool.execute(query, [address]);
            
            if (rows.length === 0) {
                return null;
            }

            return new Wallet(rows[0]);
        } catch (error) {
            logger.error('根据地址查找钱包失败', { address, error: error.message });
            throw error;
        }
    }

    /**
     * 获取所有活跃钱包
     * @param {Object} options - 查询选项
     * @returns {Promise<Array<Wallet>>} 钱包列表
     */
    static async findAll(options = {}) {
        try {
            const {
                limit = 100,
                offset = 0,
                network = null,
                currency = null,
                minBalance = null
            } = options;

            let query = `
                SELECT * FROM wallets 
                WHERE is_active = 1
            `;
            const params = [];

            if (network) {
                query += ` AND network = ?`;
                params.push(network);
            }

            if (currency) {
                query += ` AND currency = ?`;
                params.push(currency);
            }

            if (minBalance !== null) {
                query += ` AND balance >= ?`;
                params.push(minBalance);
            }

            query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const [rows] = await pool.execute(query, params);
            return rows.map(row => new Wallet(row));
        } catch (error) {
            logger.error('获取钱包列表失败', { options, error: error.message });
            throw error;
        }
    }

    /**
     * 更新钱包余额
     * @param {number} balance - 新余额
     * @param {number} frozenBalance - 冻结余额（可选）
     * @returns {Promise<boolean>} 更新结果
     */
    async updateBalance(balance, frozenBalance = null) {
        try {
            let query = `
                UPDATE wallets 
                SET balance = ?, updated_at = NOW()
            `;
            const params = [balance];

            if (frozenBalance !== null) {
                query = `
                    UPDATE wallets 
                    SET balance = ?, frozen_balance = ?, updated_at = NOW()
                `;
                params.push(frozenBalance);
            }

            query += ` WHERE id = ?`;
            params.push(this.id);

            await pool.execute(query, params);

            this.balance = balance;
            if (frozenBalance !== null) {
                this.frozenBalance = frozenBalance;
            }
            this.updatedAt = new Date();

            logger.info('钱包余额更新成功', { 
                walletId: this.id, 
                balance, 
                frozenBalance 
            });
            return true;
        } catch (error) {
            logger.error('更新钱包余额失败', { 
                walletId: this.id, 
                balance, 
                frozenBalance, 
                error: error.message 
            });
            throw error;
        }
    }

    /**
     * 冻结余额
     * @param {number} amount - 冻结金额
     * @returns {Promise<boolean>} 冻结结果
     */
    async freezeBalance(amount) {
        try {
            if (this.balance < amount) {
                throw new Error('余额不足，无法冻结');
            }

            const newBalance = this.balance - amount;
            const newFrozenBalance = this.frozenBalance + amount;

            await this.updateBalance(newBalance, newFrozenBalance);
            return true;
        } catch (error) {
            logger.error('冻结余额失败', { 
                walletId: this.id, 
                amount, 
                error: error.message 
            });
            throw error;
        }
    }

    /**
     * 解冻余额
     * @param {number} amount - 解冻金额
     * @returns {Promise<boolean>} 解冻结果
     */
    async unfreezeBalance(amount) {
        try {
            if (this.frozenBalance < amount) {
                throw new Error('冻结余额不足，无法解冻');
            }

            const newBalance = this.balance + amount;
            const newFrozenBalance = this.frozenBalance - amount;

            await this.updateBalance(newBalance, newFrozenBalance);
            return true;
        } catch (error) {
            logger.error('解冻余额失败', { 
                walletId: this.id, 
                amount, 
                error: error.message 
            });
            throw error;
        }
    }

    /**
     * 获取可用余额
     * @returns {number} 可用余额
     */
    getAvailableBalance() {
        return Math.max(0, this.balance - this.frozenBalance);
    }

    /**
     * 软删除钱包
     * @returns {Promise<boolean>} 删除结果
     */
    async softDelete() {
        try {
            const query = `
                UPDATE wallets 
                SET is_active = 0, updated_at = NOW()
                WHERE id = ?
            `;
            await pool.execute(query, [this.id]);

            this.isActive = false;
            this.updatedAt = new Date();

            logger.info('钱包软删除成功', { walletId: this.id });
            return true;
        } catch (error) {
            logger.error('钱包软删除失败', { 
                walletId: this.id, 
                error: error.message 
            });
            throw error;
        }
    }

    /**
     * 转换为JSON对象
     * @returns {Object} JSON对象
     */
    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            address: this.address,
            balance: this.balance,
            frozenBalance: this.frozenBalance,
            availableBalance: this.getAvailableBalance(),
            network: this.network,
            currency: this.currency,
            derivationIndex: this.derivationIndex,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Wallet;