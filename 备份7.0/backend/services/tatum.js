/**
 * Tatum API 服务 - 直接与Tatum API交互
 * 提供底层的区块链操作接口
 */

const axios = require('axios');
const logger = require('../utils/logger');

class TatumService {
    constructor() {
        this.apiKey = process.env.TATUM_API_KEY;
        this.testnet = process.env.TATUM_TESTNET === 'true';
        this.baseUrl = this.testnet 
            ? 'https://api.tatum.io/v3' 
            : 'https://api.tatum.io/v3';
        
        this.headers = {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json'
        };

        if (!this.apiKey) {
            logger.warn('Tatum API密钥未设置');
        }
    }

    /**
     * 发送HTTP请求到Tatum API
     * @param {string} method - HTTP方法
     * @param {string} endpoint - API端点
     * @param {Object} data - 请求数据
     * @returns {Promise<Object>} API响应
     */
    async request(method, endpoint, data = null) {
        try {
            const config = {
                method,
                url: `${this.baseUrl}${endpoint}`,
                headers: this.headers,
                timeout: 30000
            };

            if (data) {
                config.data = data;
            }

            const response = await axios(config);
            return response.data;
        } catch (error) {
            logger.error('Tatum API请求失败', {
                method,
                endpoint,
                error: error.response?.data || error.message
            });
            throw new Error(`Tatum API错误: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * 生成钱包地址
     * @param {string} currency - 货币类型 (TRON, USDT_TRON)
     * @param {number} index - 地址索引
     * @returns {Promise<Object>} 地址信息
     */
    async generateAddress(currency = 'TRON', index = 0) {
        try {
            const masterWalletXpub = process.env.TATUM_MASTER_WALLET_XPUB;
            if (!masterWalletXpub) {
                throw new Error('主钱包XPUB未配置');
            }

            const endpoint = `/offchain/account/address/${currency}/${masterWalletXpub}/${index}`;
            const result = await this.request('GET', endpoint);
            
            return {
                address: result.address,
                currency,
                index,
                derivationKey: result.derivationKey
            };
        } catch (error) {
            logger.error('生成钱包地址失败', { currency, index, error: error.message });
            throw error;
        }
    }

    /**
     * 获取地址余额
     * @param {string} address - 钱包地址
     * @param {string} currency - 货币类型
     * @returns {Promise<number>} 余额
     */
    async getBalance(address, currency = 'TRON') {
        try {
            let endpoint;
            if (currency === 'USDT_TRON') {
                // TRC20 USDT余额查询
                const contractAddress = process.env.USDT_CONTRACT_ADDRESS || 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
                endpoint = `/tron/account/balance/${address}/${contractAddress}`;
            } else {
                // TRX余额查询
                endpoint = `/tron/account/balance/${address}`;
            }

            const result = await this.request('GET', endpoint);
            return parseFloat(result.balance || '0');
        } catch (error) {
            logger.error('获取地址余额失败', { address, currency, error: error.message });
            return 0;
        }
    }

    /**
     * 发送交易
     * @param {Object} transactionData - 交易数据
     * @returns {Promise<Object>} 交易结果
     */
    async sendTransaction(transactionData) {
        try {
            const endpoint = '/tron/transaction';
            const result = await this.request('POST', endpoint, transactionData);
            
            return {
                txHash: result.txId,
                status: 'pending',
                ...result
            };
        } catch (error) {
            logger.error('发送交易失败', { transactionData, error: error.message });
            throw error;
        }
    }

    /**
     * 获取交易详情
     * @param {string} txHash - 交易哈希
     * @returns {Promise<Object>} 交易详情
     */
    async getTransaction(txHash) {
        try {
            const endpoint = `/tron/transaction/${txHash}`;
            const result = await this.request('GET', endpoint);
            return result;
        } catch (error) {
            logger.error('获取交易详情失败', { txHash, error: error.message });
            throw error;
        }
    }

    /**
     * 获取地址交易历史
     * @param {string} address - 钱包地址
     * @param {number} limit - 限制数量
     * @param {number} offset - 偏移量
     * @returns {Promise<Array>} 交易列表
     */
    async getTransactionsByAddress(address, limit = 50, offset = 0) {
        try {
            const endpoint = `/tron/account/transaction/${address}?limit=${limit}&offset=${offset}`;
            const result = await this.request('GET', endpoint);
            return result.data || [];
        } catch (error) {
            logger.error('获取地址交易历史失败', { address, error: error.message });
            return [];
        }
    }

    /**
     * 创建TRC20转账交易
     * @param {string} fromAddress - 发送地址
     * @param {string} toAddress - 接收地址
     * @param {number} amount - 转账金额
     * @param {string} contractAddress - 合约地址
     * @param {string} privateKey - 私钥
     * @returns {Promise<Object>} 交易结果
     */
    async sendTRC20(fromAddress, toAddress, amount, contractAddress, privateKey) {
        try {
            const transactionData = {
                from: fromAddress,
                to: toAddress,
                amount: amount.toString(),
                tokenAddress: contractAddress,
                fromPrivateKey: privateKey,
                feeLimit: 100000000 // 100 TRX fee limit
            };

            const endpoint = '/tron/trc20/transaction';
            const result = await this.request('POST', endpoint, transactionData);
            
            return {
                txHash: result.txId,
                status: 'pending',
                ...result
            };
        } catch (error) {
            logger.error('发送TRC20交易失败', { 
                fromAddress, 
                toAddress, 
                amount, 
                error: error.message 
            });
            throw error;
        }
    }

    /**
     * 估算交易手续费
     * @param {Object} transactionData - 交易数据
     * @returns {Promise<number>} 预估手续费
     */
    async estimateFee(transactionData) {
        try {
            // Tron网络的基础手续费通常是固定的
            // TRX转账: ~0.1 TRX
            // TRC20转账: ~5-15 TRX
            const baseFee = transactionData.tokenAddress ? 10 : 0.1;
            return baseFee;
        } catch (error) {
            logger.error('估算交易手续费失败', { transactionData, error: error.message });
            return 10; // 默认返回10 TRX
        }
    }

    /**
     * 验证地址格式
     * @param {string} address - 钱包地址
     * @returns {boolean} 是否有效
     */
    isValidAddress(address) {
        try {
            // Tron地址格式验证
            return /^T[A-Za-z1-9]{33}$/.test(address);
        } catch (error) {
            logger.error('验证地址格式失败', { address, error: error.message });
            return false;
        }
    }

    /**
     * 健康检查
     * @returns {Promise<Object>} 健康状态
     */
    async healthCheck() {
        try {
            // 简单的API连通性测试
            const endpoint = '/tron/info';
            await this.request('GET', endpoint);
            
            return {
                status: 'healthy',
                apiKey: !!this.apiKey,
                testnet: this.testnet,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Tatum服务健康检查失败', { error: error.message });
            throw error;
        }
    }
}

module.exports = new TatumService();