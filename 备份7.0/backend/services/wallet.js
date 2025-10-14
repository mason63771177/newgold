/**
 * 钱包服务 - 统一钱包操作接口
 * 整合Tatum钱包服务和实际钱包服务
 */

const tatumWalletService = require('./tatumWalletService');
const realTatumWalletService = require('./realTatumWalletService');
const logger = require('../utils/logger');

class WalletService {
    constructor() {
        this.tatumService = tatumWalletService;
        this.realWalletService = realTatumWalletService;
    }

    /**
     * 获取用户余额
     * @param {number} userId - 用户ID
     * @returns {Promise<number>} 余额
     */
    async getUserBalance(userId) {
        try {
            // 优先使用真实钱包服务
            if (this.realWalletService) {
                return await this.realWalletService.getUserBalance(userId);
            }
            return await this.tatumService.getUserBalance(userId);
        } catch (error) {
            logger.error('获取用户余额失败', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * 获取充值地址
     * @param {number} userId - 用户ID
     * @returns {Promise<string>} 充值地址
     */
    async getDepositAddress(userId) {
        try {
            if (this.realWalletService) {
                return await this.realWalletService.getDepositAddress(userId);
            }
            return await this.tatumService.getDepositAddress(userId);
        } catch (error) {
            logger.error('获取充值地址失败', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * 处理提现
     * @param {number} userId - 用户ID
     * @param {string} toAddress - 目标地址
     * @param {number} amount - 提现金额
     * @returns {Promise<Object>} 提现结果
     */
    async processWithdrawal(userId, toAddress, amount) {
        try {
            if (this.realWalletService) {
                return await this.realWalletService.processWithdrawal(userId, toAddress, amount);
            }
            return await this.tatumService.processWithdrawal(userId, toAddress, amount);
        } catch (error) {
            logger.error('处理提现失败', { userId, toAddress, amount, error: error.message });
            throw error;
        }
    }

    /**
     * 计算提现手续费
     * @param {number} amount - 提现金额
     * @returns {Object} 手续费详情
     */
    calculateWithdrawalFee(amount) {
        try {
            if (this.realWalletService) {
                return this.realWalletService.calculateWithdrawalFee(amount);
            }
            return this.tatumService.calculateWithdrawalFee(amount);
        } catch (error) {
            logger.error('计算提现手续费失败', { amount, error: error.message });
            throw error;
        }
    }

    /**
     * 获取交易历史
     * @param {number} userId - 用户ID
     * @param {Object} options - 查询选项
     * @returns {Promise<Array>} 交易历史
     */
    async getTransactionHistory(userId, options = {}) {
        try {
            if (this.realWalletService) {
                return await this.realWalletService.getTransactionHistory(userId, options);
            }
            return await this.tatumService.getTransactionHistory(userId, options);
        } catch (error) {
            logger.error('获取交易历史失败', { userId, options, error: error.message });
            throw error;
        }
    }

    /**
     * 资金归集
     * @param {number} userId - 用户ID（可选）
     * @returns {Promise<Object>} 归集结果
     */
    async consolidateFunds(userId = null) {
        try {
            if (this.realWalletService) {
                return await this.realWalletService.consolidateFunds(userId);
            }
            return await this.tatumService.consolidateFunds(userId);
        } catch (error) {
            logger.error('资金归集失败', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * 健康检查
     * @returns {Promise<Object>} 健康状态
     */
    async healthCheck() {
        try {
            const results = {
                tatumService: false,
                realWalletService: false,
                overall: false
            };

            // 检查Tatum服务
            try {
                await this.tatumService.healthCheck();
                results.tatumService = true;
            } catch (error) {
                logger.warn('Tatum服务健康检查失败', { error: error.message });
            }

            // 检查真实钱包服务
            try {
                if (this.realWalletService && this.realWalletService.healthCheck) {
                    await this.realWalletService.healthCheck();
                    results.realWalletService = true;
                }
            } catch (error) {
                logger.warn('真实钱包服务健康检查失败', { error: error.message });
            }

            results.overall = results.tatumService || results.realWalletService;
            return results;
        } catch (error) {
            logger.error('钱包服务健康检查失败', { error: error.message });
            throw error;
        }
    }
}

module.exports = new WalletService();