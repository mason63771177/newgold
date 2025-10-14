#!/usr/bin/env node

/**
 * 自动资金归集脚本
 * 定期将用户钱包中的资金归集到主钱包
 */

const realTatumWalletService = require('../services/realTatumWalletService');
const logger = require('../utils/logger');

class AutoConsolidation {
    constructor() {
        this.minConsolidationAmount = 1; // 最小归集金额 1 USDT
        this.maxWalletsPerBatch = 10;    // 每批次最大处理钱包数
        this.delayBetweenBatches = 5000; // 批次间延迟 5 秒
    }

    /**
     * 执行自动归集
     */
    async run() {
        try {
            logger.info('开始自动资金归集任务');
            
            // 初始化钱包服务
            await realTatumWalletService.initialize();
            
            // 获取需要归集的钱包
            const walletsToConsolidate = await this.getWalletsForConsolidation();
            
            if (walletsToConsolidate.length === 0) {
                logger.info('没有需要归集的钱包');
                return { success: true, consolidated: 0, totalAmount: 0 };
            }

            logger.info(`找到 ${walletsToConsolidate.length} 个钱包需要归集`);

            // 分批处理
            const batches = this.createBatches(walletsToConsolidate, this.maxWalletsPerBatch);
            let totalConsolidated = 0;
            let totalAmount = 0;
            const results = [];

            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                logger.info(`处理第 ${i + 1}/${batches.length} 批次，包含 ${batch.length} 个钱包`);

                const batchResult = await this.processBatch(batch);
                results.push(batchResult);
                
                totalConsolidated += batchResult.successful;
                totalAmount += batchResult.totalAmount;

                // 批次间延迟
                if (i < batches.length - 1) {
                    logger.info(`等待 ${this.delayBetweenBatches}ms 后处理下一批次`);
                    await this.sleep(this.delayBetweenBatches);
                }
            }

            const summary = {
                success: true,
                totalWallets: walletsToConsolidate.length,
                consolidated: totalConsolidated,
                totalAmount: totalAmount,
                batches: results
            };

            logger.info('自动归集任务完成', summary);
            return summary;

        } catch (error) {
            logger.error('自动归集任务失败', { error: error.message });
            throw error;
        } finally {
            await realTatumWalletService.destroy();
        }
    }

    /**
     * 获取需要归集的钱包列表
     */
    async getWalletsForConsolidate() {
        try {
            // 获取所有有余额的钱包
            const allWallets = await realTatumWalletService.getWalletsForConsolidation();
            
            // 过滤出余额大于最小归集金额的钱包
            const walletsToConsolidate = [];
            
            for (const wallet of allWallets) {
                try {
                    const balance = await realTatumWalletService.getWalletBalance(wallet.address);
                    const usdtBalance = parseFloat(balance.usdt || 0);
                    
                    if (usdtBalance >= this.minConsolidationAmount) {
                        walletsToConsolidate.push({
                            ...wallet,
                            balance: usdtBalance
                        });
                    }
                } catch (error) {
                    logger.warn('获取钱包余额失败', { 
                        address: wallet.address, 
                        error: error.message 
                    });
                }
            }

            // 按余额降序排序，优先处理大额钱包
            walletsToConsolidate.sort((a, b) => b.balance - a.balance);

            return walletsToConsolidate;

        } catch (error) {
            logger.error('获取归集钱包列表失败', { error: error.message });
            throw error;
        }
    }

    /**
     * 处理一批钱包
     */
    async processBatch(wallets) {
        const results = {
            successful: 0,
            failed: 0,
            totalAmount: 0,
            details: []
        };

        for (const wallet of wallets) {
            try {
                logger.info('开始归集钱包', { 
                    userId: wallet.user_id,
                    address: wallet.address,
                    balance: wallet.balance
                });

                const consolidationResult = await realTatumWalletService.consolidateFunds(wallet.user_id);
                
                if (consolidationResult.success) {
                    results.successful++;
                    results.totalAmount += wallet.balance;
                    results.details.push({
                        userId: wallet.user_id,
                        address: wallet.address,
                        amount: wallet.balance,
                        status: 'success',
                        txHash: consolidationResult.txHash
                    });
                    
                    logger.info('钱包归集成功', {
                        userId: wallet.user_id,
                        amount: wallet.balance,
                        txHash: consolidationResult.txHash
                    });
                } else {
                    throw new Error(consolidationResult.error || '归集失败');
                }

            } catch (error) {
                results.failed++;
                results.details.push({
                    userId: wallet.user_id,
                    address: wallet.address,
                    amount: wallet.balance,
                    status: 'failed',
                    error: error.message
                });
                
                logger.error('钱包归集失败', {
                    userId: wallet.user_id,
                    address: wallet.address,
                    error: error.message
                });
            }

            // 单个钱包处理间隔
            await this.sleep(1000);
        }

        return results;
    }

    /**
     * 创建批次
     */
    createBatches(items, batchSize) {
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }

    /**
     * 延迟函数
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 获取归集统计信息
     */
    async getConsolidationStats() {
        try {
            const stats = {
                totalWallets: 0,
                walletsWithBalance: 0,
                totalBalance: 0,
                eligibleForConsolidation: 0,
                eligibleBalance: 0
            };

            const allWallets = await realTatumWalletService.getWalletsForConsolidation();
            stats.totalWallets = allWallets.length;

            for (const wallet of allWallets) {
                try {
                    const balance = await realTatumWalletService.getWalletBalance(wallet.address);
                    const usdtBalance = parseFloat(balance.usdt || 0);
                    
                    if (usdtBalance > 0) {
                        stats.walletsWithBalance++;
                        stats.totalBalance += usdtBalance;
                        
                        if (usdtBalance >= this.minConsolidationAmount) {
                            stats.eligibleForConsolidation++;
                            stats.eligibleBalance += usdtBalance;
                        }
                    }
                } catch (error) {
                    logger.warn('获取钱包余额失败', { 
                        address: wallet.address, 
                        error: error.message 
                    });
                }
            }

            return stats;

        } catch (error) {
            logger.error('获取归集统计失败', { error: error.message });
            throw error;
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const consolidation = new AutoConsolidation();
    
    (async () => {
        try {
            // 检查命令行参数
            const args = process.argv.slice(2);
            const command = args[0];

            if (command === 'stats') {
                // 只显示统计信息
                console.log('获取归集统计信息...');
                await realTatumWalletService.initialize();
                const stats = await consolidation.getConsolidationStats();
                console.log('归集统计:', stats);
                await realTatumWalletService.destroy();
                
            } else if (command === 'dry-run') {
                // 模拟运行，不实际执行归集
                console.log('模拟运行归集任务...');
                await realTatumWalletService.initialize();
                const wallets = await consolidation.getWalletsForConsolidation();
                console.log(`找到 ${wallets.length} 个钱包需要归集:`);
                wallets.forEach(wallet => {
                    console.log(`- 用户 ${wallet.user_id}: ${wallet.address} (${wallet.balance} USDT)`);
                });
                await realTatumWalletService.destroy();
                
            } else {
                // 执行实际归集
                console.log('开始自动资金归集...');
                const result = await consolidation.run();
                console.log('归集完成:', result);
            }
            
            process.exit(0);
            
        } catch (error) {
            console.error('自动归集失败:', error);
            process.exit(1);
        }
    })();
}

module.exports = AutoConsolidation;