/**
 * Tatum RPC 客户端工具类
 * 封装与 Tatum RPC 网关的交互逻辑
 */

require('dotenv').config();
const axios = require('axios');
const logger = require('./logger');

class TatumRpcClient {
    constructor() {
        this.logger = logger;
        this.apiKey = process.env.TATUM_API_KEY;
        this.isTestnet = process.env.TATUM_TESTNET === 'true';
        this.endpoint = this.isTestnet 
            ? process.env.TATUM_RPC_ENDPOINT 
            : process.env.TATUM_RPC_MAINNET_ENDPOINT;
        this.rateLimit = parseInt(process.env.TATUM_RPC_RATE_LIMIT) || 3;
        this.retryAttempts = parseInt(process.env.TATUM_RPC_RETRY_ATTEMPTS) || 3;
        this.timeout = parseInt(process.env.TATUM_RPC_TIMEOUT) || 30000;
        
        // 请求队列管理
        this.requestQueue = [];
        this.isProcessing = false;
        this.lastRequestTime = 0;
        
        this.logger.info('Tatum RPC客户端初始化完成', {
            endpoint: this.endpoint,
            rateLimit: this.rateLimit,
            isTestnet: this.isTestnet
        });
    }

    /**
     * 发送RPC请求
     * @param {string} method - RPC方法名
     * @param {Array} params - 参数数组
     * @param {number} retries - 重试次数
     * @returns {Promise<Object>} RPC响应
     */
    async call(method, params = [], retries = null) {
        if (retries === null) {
            retries = this.retryAttempts;
        }

        return new Promise((resolve, reject) => {
            this.requestQueue.push({
                method,
                params,
                retries,
                resolve,
                reject,
                timestamp: Date.now()
            });

            this.processQueue();
        });
    }

    /**
     * 处理请求队列
     */
    async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.requestQueue.length > 0) {
            const request = this.requestQueue.shift();
            
            try {
                // 实现速率限制
                await this.enforceRateLimit();
                
                const result = await this.executeRequest(request);
                request.resolve(result);
                
            } catch (error) {
                if (request.retries > 0 && this.shouldRetry(error)) {
                    // 重试逻辑
                    request.retries--;
                    this.requestQueue.unshift(request);
                    await this.delay(1000); // 等待1秒后重试
                } else {
                    request.reject(error);
                }
            }
        }

        this.isProcessing = false;
    }

    /**
     * 执行单个RPC请求
     * @param {Object} request - 请求对象
     * @returns {Promise<Object>} 响应结果
     */
    async executeRequest(request) {
        const { method, params } = request;
        
        const payload = {
            jsonrpc: "2.0",
            method: method,
            params: params,
            id: Date.now()
        };

        const config = {
            method: 'POST',
            url: this.endpoint,
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'x-api-key': this.apiKey
            },
            data: payload,
            timeout: this.timeout
        };

        this.logger.debug('发送RPC请求', { method, params });

        const response = await axios(config);
        
        if (response.data.error) {
            throw new Error(`RPC错误: ${response.data.error.message}`);
        }

        this.logger.debug('RPC请求成功', { method, result: response.data.result });
        return response.data;
    }

    /**
     * 实施速率限制
     */
    async enforceRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const minInterval = 1000 / this.rateLimit; // 毫秒

        if (timeSinceLastRequest < minInterval) {
            const waitTime = minInterval - timeSinceLastRequest;
            await this.delay(waitTime);
        }

        this.lastRequestTime = Date.now();
    }

    /**
     * 判断是否应该重试
     * @param {Error} error - 错误对象
     * @returns {boolean} 是否重试
     */
    shouldRetry(error) {
        // 429 (Too Many Requests) 或网络错误时重试
        return error.response?.status === 429 || 
               error.code === 'ECONNRESET' || 
               error.code === 'ETIMEDOUT';
    }

    /**
     * 延迟函数
     * @param {number} ms - 延迟毫秒数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ==================== 区块链查询方法 ====================

    /**
     * 获取最新区块号
     * @returns {Promise<number>} 区块号
     */
    async getLatestBlockNumber() {
        const result = await this.call('eth_blockNumber');
        return parseInt(result.result, 16);
    }

    /**
     * 获取链ID
     * @returns {Promise<number>} 链ID
     */
    async getChainId() {
        const result = await this.call('eth_chainId');
        return parseInt(result.result, 16);
    }

    /**
     * 获取账户TRX余额
     * @param {string} address - 账户地址
     * @returns {Promise<string>} 余额 (wei)
     */
    async getTrxBalance(address) {
        const result = await this.call('eth_getBalance', [address, 'latest']);
        return result.result;
    }

    /**
     * 获取账户交易数量
     * @param {string} address - 账户地址
     * @returns {Promise<number>} 交易数量
     */
    async getTransactionCount(address) {
        const result = await this.call('eth_getTransactionCount', [address, 'latest']);
        return parseInt(result.result, 16);
    }

    /**
     * 获取交易详情
     * @param {string} txHash - 交易哈希
     * @returns {Promise<Object>} 交易详情
     */
    async getTransaction(txHash) {
        const result = await this.call('eth_getTransactionByHash', [txHash]);
        return result.result;
    }

    /**
     * 获取交易收据
     * @param {string} txHash - 交易哈希
     * @returns {Promise<Object>} 交易收据
     */
    async getTransactionReceipt(txHash) {
        const result = await this.call('eth_getTransactionReceipt', [txHash]);
        return result.result;
    }

    /**
     * 获取区块信息
     * @param {string|number} blockNumber - 区块号或'latest'
     * @param {boolean} fullTransactions - 是否包含完整交易信息
     * @returns {Promise<Object>} 区块信息
     */
    async getBlock(blockNumber = 'latest', fullTransactions = false) {
        const blockParam = typeof blockNumber === 'number' 
            ? `0x${blockNumber.toString(16)}` 
            : blockNumber;
        
        const result = await this.call('eth_getBlockByNumber', [blockParam, fullTransactions]);
        return result.result;
    }

    /**
     * 调用智能合约方法（只读）
     * @param {Object} callData - 调用数据
     * @returns {Promise<string>} 调用结果
     */
    async contractCall(callData) {
        const result = await this.call('eth_call', [callData, 'latest']);
        return result.result;
    }

    /**
     * 估算Gas费用
     * @param {Object} txData - 交易数据
     * @returns {Promise<string>} Gas估算值
     */
    async estimateGas(txData) {
        const result = await this.call('eth_estimateGas', [txData]);
        return result.result;
    }

    /**
     * 发送原始交易
     * @param {string} signedTx - 签名后的交易数据
     * @returns {Promise<string>} 交易哈希
     */
    async sendRawTransaction(signedTx) {
        const result = await this.call('eth_sendRawTransaction', [signedTx]);
        return result.result;
    }

    // ==================== USDT 相关方法 ====================

    /**
     * 获取USDT余额
     * @param {string} address - 账户地址
     * @param {string} contractAddress - USDT合约地址
     * @returns {Promise<number>} USDT余额
     */
    /**
     * 获取USDT余额
     * @param {string} address - 账户地址
     * @param {string} contractAddress - USDT合约地址
     * @returns {Promise<number>} USDT余额
     */
    async getUsdtBalance(address, contractAddress = null) {
        const usdtContract = contractAddress || process.env.USDT_CONTRACT_ADDRESS;
        
        // 构造balanceOf方法调用数据
        const methodId = '0x70a08231'; // balanceOf方法签名
        
        // 对于Tron网络，地址需要转换为十六进制格式
        let paddedAddress;
        if (address.startsWith('0x')) {
            // 如果已经是十六进制格式，直接使用
            paddedAddress = address.replace('0x', '').padStart(64, '0');
        } else if (address.startsWith('T')) {
            // 如果是Base58格式，需要转换（这里简化处理）
            paddedAddress = address.replace('T', '41').padStart(64, '0');
        } else {
            throw new Error('不支持的地址格式');
        }
        
        const callData = methodId + paddedAddress;
        
        try {
            const result = await this.contractCall({
                to: usdtContract,
                data: callData
            });
            
            if (result && result !== '0x') {
                const balance = parseInt(result, 16);
                return balance / 1000000; // USDT使用6位小数
            }
            
            return 0;
        } catch (error) {
            this.logger.error('查询USDT余额失败', { address, error: error.message });
            return 0;
        }
    }

    /**
     * 检查健康状态
     * @returns {Promise<boolean>} 是否健康
     */
    async healthCheck() {
        try {
            await this.getLatestBlockNumber();
            return true;
        } catch (error) {
            this.logger.error('RPC健康检查失败', { error: error.message });
            return false;
        }
    }
}

// 创建单例实例
const tatumRpcClient = new TatumRpcClient();

module.exports = tatumRpcClient;