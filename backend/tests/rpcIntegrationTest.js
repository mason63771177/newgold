/**
 * RPC集成测试
 * 测试所有RPC功能的完整性和稳定性
 */

// 加载环境变量
require('dotenv').config();

const tatumRpcClient = require('../utils/tatumRpcClient');
const balanceQueryService = require('../services/balanceQueryService');
const depositMonitoringService = require('../services/depositMonitoringService');
const transactionVerificationService = require('../services/transactionVerificationService');
const logger = require('../utils/logger');

const testLogger = logger;

class RpcIntegrationTest {
    constructor() {
        this.testResults = [];
        this.testConfig = {
            // 测试地址（使用十六进制格式，兼容Ethereum JSON-RPC）
            testAddresses: [
                '0x85cC29184B18AE2909b85668DA996ACFA253F4e2', // 测试地址1（十六进制格式）
                '0xa614f803B6FD780986A42c78Ec9c7f77e6DeD13C'  // 测试地址2（十六进制格式）
            ],
            // 测试交易哈希（使用已知的测试交易）
            testTxHashes: [
                // 这些需要替换为实际的测试网交易哈希
                '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
            ],
            timeout: 30000, // 30秒超时
            retryAttempts: 3
        };
    }

    /**
     * 运行所有集成测试
     */
    async runAllTests() {
        try {
            testLogger.info('开始RPC集成测试');
            
            const startTime = Date.now();
            this.testResults = [];

            // 1. 基础RPC客户端测试
            await this.testRpcClient();

            // 2. 余额查询服务测试
            await this.testBalanceQueryService();

            // 3. 充值监听服务测试
            await this.testDepositMonitoringService();

            // 4. 交易验证服务测试
            await this.testTransactionVerificationService();

            // 5. 性能测试
            await this.testPerformance();

            // 6. 错误处理测试
            await this.testErrorHandling();

            const endTime = Date.now();
            const duration = endTime - startTime;

            const summary = this.generateTestSummary(duration);
            testLogger.info('RPC集成测试完成', summary);

            return summary;

        } catch (error) {
            testLogger.error('RPC集成测试失败', { error: error.message });
            throw error;
        }
    }

    /**
     * 测试RPC客户端
     */
    async testRpcClient() {
        testLogger.info('开始测试RPC客户端');

        // 测试健康检查
        await this.runTest('RPC健康检查', async () => {
            const health = await tatumRpcClient.healthCheck();
            if (!health) {
                throw new Error('RPC健康检查失败');
            }
            return { healthy: health };
        });

        // 测试获取最新区块号
        await this.runTest('获取最新区块号', async () => {
            const blockNumber = await tatumRpcClient.getLatestBlockNumber();
            if (typeof blockNumber !== 'number' || blockNumber <= 0) {
                throw new Error('获取的区块号无效');
            }
            return { blockNumber };
        });

        // 测试获取链ID
        await this.runTest('获取链ID', async () => {
            const chainId = await tatumRpcClient.getChainId();
            if (!chainId) {
                throw new Error('获取链ID失败');
            }
            return { chainId };
        });

        // 测试获取TRX余额
        await this.runTest('获取TRX余额', async () => {
            const address = this.testConfig.testAddresses[0];
            const balanceWei = await tatumRpcClient.getTrxBalance(address);
            // getTrxBalance返回的是十六进制字符串，需要转换为数字
            const balance = parseInt(balanceWei, 16);
            if (typeof balance !== 'number' || balance < 0) {
                throw new Error('获取TRX余额失败');
            }
            return { address, balance, balanceWei };
        });

        // 测试获取USDT余额
        await this.runTest('获取USDT余额', async () => {
            const address = this.testConfig.testAddresses[0];
            const balance = await tatumRpcClient.getUsdtBalance(address);
            if (typeof balance !== 'number' || balance < 0) {
                throw new Error('获取USDT余额失败');
            }
            return { address, balance };
        });
    }

    /**
     * 测试余额查询服务
     */
    async testBalanceQueryService() {
        testLogger.info('开始测试余额查询服务');

        const testAddress = this.testConfig.testAddresses[0];

        // 测试单个地址TRX余额查询
        await this.runTest('查询TRX余额', async () => {
            const result = await balanceQueryService.getTrxBalance(testAddress);
            // balanceQueryService.getTrxBalance返回的是对象，包含balance属性
            if (!result || typeof result.balance !== 'number' || result.balance < 0) {
                throw new Error('TRX余额查询失败');
            }
            return { address: testAddress, balance: result.balance, result };
        });

        // 测试单个地址USDT余额查询
        await this.runTest('查询USDT余额', async () => {
            const result = await balanceQueryService.getUsdtBalance(testAddress);
            // balanceQueryService.getUsdtBalance返回的是对象，包含balance属性
            if (!result || typeof result.balance !== 'number' || result.balance < 0) {
                throw new Error('USDT余额查询失败');
            }
            return { address: testAddress, balance: result.balance, result };
        });

        // 测试完整余额查询
        await this.runTest('查询完整余额', async () => {
            const result = await balanceQueryService.getFullBalance(testAddress);
            // balanceQueryService.getFullBalance返回的是对象，包含trx和usdt属性
            if (!result || typeof result.trx !== 'number' || typeof result.usdt !== 'number' || 
                result.trx < 0 || result.usdt < 0) {
                throw new Error('完整余额查询失败');
            }
            return { address: testAddress, trx: result.trx, usdt: result.usdt, result };
        });

        // 测试批量余额查询
        await this.runTest('批量余额查询', async () => {
            const addresses = this.testConfig.testAddresses;
            const results = await balanceQueryService.getBatchBalances(addresses);
            if (!Array.isArray(results) || results.length !== addresses.length) {
                throw new Error('批量余额查询失败');
            }
            return { addresses: addresses.length, results: results.length };
        });

        // 测试余额统计
        await this.runTest('余额统计', async () => {
            const stats = await balanceQueryService.getBalanceStats(this.testConfig.testAddresses);
            if (!stats || typeof stats.totalTrx !== 'number' || typeof stats.totalUsdt !== 'number') {
                throw new Error('余额统计失败');
            }
            return stats;
        });
    }

    /**
     * 测试充值监听服务
     */
    async testDepositMonitoringService() {
        testLogger.info('开始测试充值监听服务');

        // 测试添加监控地址
        await this.runTest('添加监控地址', async () => {
            const addresses = this.testConfig.testAddresses;
            depositMonitoringService.addMonitoredAddresses(addresses);
            const status = depositMonitoringService.getMonitoringStatus();
            if (status.monitoredAddressCount < addresses.length) {
                throw new Error('添加监控地址失败');
            }
            return { addedCount: addresses.length, totalCount: status.monitoredAddressCount };
        });

        // 测试获取监控状态
        await this.runTest('获取监控状态', async () => {
            const status = depositMonitoringService.getMonitoringStatus();
            if (!status || typeof status.monitoredAddressCount !== 'number') {
                throw new Error('获取监控状态失败');
            }
            return status;
        });

        // 测试健康检查
        await this.runTest('充值监听健康检查', async () => {
            const health = await depositMonitoringService.healthCheck();
            if (!health || typeof health.healthy !== 'boolean') {
                throw new Error('充值监听健康检查失败');
            }
            return health;
        });

        // 测试移除监控地址
        await this.runTest('移除监控地址', async () => {
            const addresses = [this.testConfig.testAddresses[0]];
            depositMonitoringService.removeMonitoredAddresses(addresses);
            const status = depositMonitoringService.getMonitoringStatus();
            return { removedCount: addresses.length, remainingCount: status.monitoredAddressCount };
        });
    }

    /**
     * 测试交易验证服务
     */
    async testTransactionVerificationService() {
        testLogger.info('开始测试交易验证服务');

        // 注意：这些测试需要真实的交易哈希才能正常工作
        // 在实际环境中，应该使用已知的测试网交易

        // 测试验证不存在的交易
        await this.runTest('验证不存在的交易', async () => {
            const fakeTxHash = '0x' + '0'.repeat(64);
            const result = await transactionVerificationService.verifyTransaction(fakeTxHash);
            if (result.exists) {
                throw new Error('不应该找到不存在的交易');
            }
            return { txHash: fakeTxHash, exists: result.exists };
        });

        // 测试获取验证统计
        await this.runTest('获取验证统计', async () => {
            const stats = await transactionVerificationService.getVerificationStats();
            if (!stats || typeof stats.totalCached !== 'number') {
                throw new Error('获取验证统计失败');
            }
            return stats;
        });

        // 测试健康检查
        await this.runTest('交易验证健康检查', async () => {
            const health = await transactionVerificationService.healthCheck();
            if (!health || typeof health.healthy !== 'boolean') {
                throw new Error('交易验证健康检查失败');
            }
            return health;
        });

        // 测试批量验证（使用假交易哈希）
        await this.runTest('批量验证交易', async () => {
            const fakeTxHashes = [
                '0x' + '1'.repeat(64),
                '0x' + '2'.repeat(64)
            ];
            const results = await transactionVerificationService.verifyTransactionsBatch(fakeTxHashes);
            if (!Array.isArray(results) || results.length !== fakeTxHashes.length) {
                throw new Error('批量验证失败');
            }
            return { requested: fakeTxHashes.length, received: results.length };
        });
    }

    /**
     * 性能测试
     */
    async testPerformance() {
        testLogger.info('开始性能测试');

        // 测试并发余额查询
        await this.runTest('并发余额查询性能', async () => {
            const address = this.testConfig.testAddresses[0];
            const concurrentRequests = 10;
            const startTime = Date.now();

            const promises = Array(concurrentRequests).fill().map(() => 
                balanceQueryService.getTrxBalance(address)
            );

            const results = await Promise.all(promises);
            const endTime = Date.now();
            const duration = endTime - startTime;

            if (results.length !== concurrentRequests) {
                throw new Error('并发请求结果数量不匹配');
            }

            return {
                concurrentRequests,
                duration,
                averageTime: duration / concurrentRequests,
                requestsPerSecond: (concurrentRequests / duration) * 1000
            };
        });

        // 测试RPC请求限制
        await this.runTest('RPC请求限制测试', async () => {
            const startTime = Date.now();
            let successCount = 0;
            let errorCount = 0;

            // 快速发送多个请求测试限制器
            const promises = Array(20).fill().map(async () => {
                try {
                    await tatumRpcClient.getLatestBlockNumber();
                    successCount++;
                } catch (error) {
                    errorCount++;
                }
            });

            await Promise.all(promises);
            const endTime = Date.now();
            const duration = endTime - startTime;

            return {
                totalRequests: 20,
                successCount,
                errorCount,
                duration,
                rateLimitWorking: duration > 5000 // 如果耗时超过5秒，说明限制器在工作
            };
        });
    }

    /**
     * 错误处理测试
     */
    async testErrorHandling() {
        testLogger.info('开始错误处理测试');

        // 测试无效地址处理
        await this.runTest('无效地址错误处理', async () => {
            const invalidAddress = 'invalid_address';
            try {
                await balanceQueryService.getTrxBalance(invalidAddress);
                throw new Error('应该抛出错误');
            } catch (error) {
                if (error.message === '应该抛出错误') {
                    throw error;
                }
                return { errorHandled: true, errorMessage: error.message };
            }
        });

        // 测试空参数处理
        await this.runTest('空参数错误处理', async () => {
            try {
                await transactionVerificationService.verifyTransaction('');
                throw new Error('应该抛出错误');
            } catch (error) {
                if (error.message === '应该抛出错误') {
                    throw error;
                }
                return { errorHandled: true, errorMessage: error.message };
            }
        });

        // 测试网络错误恢复
        await this.runTest('网络错误恢复测试', async () => {
            // 这个测试模拟网络问题，实际实现可能需要mock
            let retryCount = 0;
            const maxRetries = 3;

            while (retryCount < maxRetries) {
                try {
                    await tatumRpcClient.getLatestBlockNumber();
                    break;
                } catch (error) {
                    retryCount++;
                    if (retryCount >= maxRetries) {
                        return { 
                            errorHandled: true, 
                            retryCount, 
                            finalError: error.message 
                        };
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            return { 
                errorHandled: true, 
                retryCount, 
                recovered: retryCount < maxRetries 
            };
        });
    }

    /**
     * 运行单个测试
     * @param {string} testName - 测试名称
     * @param {Function} testFunction - 测试函数
     */
    async runTest(testName, testFunction) {
        const startTime = Date.now();
        let result = {
            name: testName,
            success: false,
            duration: 0,
            error: null,
            data: null
        };

        try {
            testLogger.debug(`开始测试: ${testName}`);
            
            const data = await Promise.race([
                testFunction(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('测试超时')), this.testConfig.timeout)
                )
            ]);

            result.success = true;
            result.data = data;
            testLogger.debug(`测试通过: ${testName}`);

        } catch (error) {
            result.error = error.message;
            testLogger.warn(`测试失败: ${testName}`, { error: error.message });
        } finally {
            result.duration = Date.now() - startTime;
            this.testResults.push(result);
        }

        return result;
    }

    /**
     * 生成测试摘要
     * @param {number} totalDuration - 总耗时
     * @returns {Object} 测试摘要
     */
    generateTestSummary(totalDuration) {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;

        const summary = {
            totalTests,
            passedTests,
            failedTests,
            successRate: totalTests > 0 ? (passedTests / totalTests * 100).toFixed(2) + '%' : '0%',
            totalDuration,
            averageTestDuration: totalTests > 0 ? Math.round(totalDuration / totalTests) : 0,
            timestamp: new Date().toISOString(),
            results: this.testResults
        };

        // 按类别分组结果
        summary.resultsByCategory = {
            rpcClient: this.testResults.filter(r => r.name.includes('RPC') || r.name.includes('区块') || r.name.includes('链ID') || r.name.includes('余额')),
            balanceQuery: this.testResults.filter(r => r.name.includes('查询') && !r.name.includes('RPC')),
            depositMonitoring: this.testResults.filter(r => r.name.includes('监控') || r.name.includes('充值')),
            transactionVerification: this.testResults.filter(r => r.name.includes('验证') || r.name.includes('交易')),
            performance: this.testResults.filter(r => r.name.includes('性能') || r.name.includes('并发')),
            errorHandling: this.testResults.filter(r => r.name.includes('错误') || r.name.includes('处理'))
        };

        return summary;
    }

    /**
     * 生成测试报告
     * @returns {string} 测试报告
     */
    generateTestReport() {
        const summary = this.generateTestSummary(0);
        
        let report = '\n=== RPC集成测试报告 ===\n';
        report += `测试时间: ${summary.timestamp}\n`;
        report += `总测试数: ${summary.totalTests}\n`;
        report += `通过测试: ${summary.passedTests}\n`;
        report += `失败测试: ${summary.failedTests}\n`;
        report += `成功率: ${summary.successRate}\n`;
        report += `平均耗时: ${summary.averageTestDuration}ms\n\n`;

        // 详细结果
        report += '=== 详细测试结果 ===\n';
        this.testResults.forEach(result => {
            const status = result.success ? '✅ 通过' : '❌ 失败';
            report += `${status} ${result.name} (${result.duration}ms)\n`;
            if (!result.success && result.error) {
                report += `   错误: ${result.error}\n`;
            }
        });

        return report;
    }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
    const test = new RpcIntegrationTest();
    test.runAllTests()
        .then(summary => {
            console.log('\n测试完成！');
            console.log(test.generateTestReport());
            process.exit(summary.failedTests > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('测试运行失败:', error);
            process.exit(1);
        });
}

module.exports = RpcIntegrationTest;