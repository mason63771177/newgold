#!/usr/bin/env node

/**
 * 过期数据清理脚本
 * 用于清理数据库中的过期和冗余数据
 */

const { pool } = require('../config/database');
const logger = require('../utils/logger');

class DataCleanup {
    constructor() {
        this.retentionDays = {
            transactions: 365,      // 交易记录保留1年
            balanceLogs: 180,       // 余额日志保留6个月
            errorLogs: 30,          // 错误日志保留1个月
            tempData: 7             // 临时数据保留7天
        };
    }

    /**
     * 执行数据清理
     */
    async cleanup() {
        try {
            logger.info('开始执行数据清理任务');
            
            const results = {
                transactions: await this.cleanupTransactions(),
                balanceLogs: await this.cleanupBalanceLogs(),
                errorLogs: await this.cleanupErrorLogs(),
                tempData: await this.cleanupTempData(),
                optimization: await this.optimizeTables()
            };

            logger.info('数据清理任务完成', results);
            return results;

        } catch (error) {
            logger.error('数据清理任务失败', { error: error.message });
            throw error;
        }
    }

    /**
     * 清理过期交易记录
     */
    async cleanupTransactions() {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays.transactions);

            // 清理失败的交易记录（保留成功的交易记录更长时间）
            const failedQuery = `
                DELETE FROM wallet_transactions 
                WHERE status = 'failed' 
                AND created_at < ? 
                LIMIT 1000
            `;

            const result = await pool.execute(failedQuery, [cutoffDate]);
            
            logger.info('清理过期失败交易记录', { 
                deletedRows: result[0].affectedRows,
                cutoffDate: cutoffDate.toISOString()
            });

            return {
                deletedRows: result[0].affectedRows,
                type: 'failed_transactions'
            };

        } catch (error) {
            logger.error('清理交易记录失败', { error: error.message });
            return { deletedRows: 0, error: error.message };
        }
    }

    /**
     * 清理过期余额日志
     */
    async cleanupBalanceLogs() {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays.balanceLogs);

            const query = `
                DELETE FROM balance_logs 
                WHERE created_at < ? 
                LIMIT 1000
            `;

            const result = await pool.execute(query, [cutoffDate]);
            
            logger.info('清理过期余额日志', { 
                deletedRows: result[0].affectedRows,
                cutoffDate: cutoffDate.toISOString()
            });

            return {
                deletedRows: result[0].affectedRows,
                type: 'balance_logs'
            };

        } catch (error) {
            logger.error('清理余额日志失败', { error: error.message });
            return { deletedRows: 0, error: error.message };
        }
    }

    /**
     * 清理错误日志
     */
    async cleanupErrorLogs() {
        try {
            // 这里假设有一个错误日志表，如果没有可以跳过
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays.errorLogs);

            // 检查表是否存在
            const checkTableQuery = `
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_schema = DATABASE() 
                AND table_name = 'error_logs'
            `;

            const [tableCheck] = await pool.execute(checkTableQuery);
            
            if (tableCheck[0].count === 0) {
                logger.info('错误日志表不存在，跳过清理');
                return { deletedRows: 0, type: 'error_logs', skipped: true };
            }

            const query = `
                DELETE FROM error_logs 
                WHERE created_at < ? 
                LIMIT 1000
            `;

            const result = await pool.execute(query, [cutoffDate]);
            
            logger.info('清理过期错误日志', { 
                deletedRows: result[0].affectedRows,
                cutoffDate: cutoffDate.toISOString()
            });

            return {
                deletedRows: result[0].affectedRows,
                type: 'error_logs'
            };

        } catch (error) {
            logger.error('清理错误日志失败', { error: error.message });
            return { deletedRows: 0, error: error.message };
        }
    }

    /**
     * 清理临时数据
     */
    async cleanupTempData() {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays.tempData);

            // 清理过期的钱包映射（如果用户已删除）
            const orphanedMappingsQuery = `
                DELETE wm FROM wallet_mappings wm
                LEFT JOIN users u ON wm.user_id = u.id
                WHERE u.id IS NULL
                LIMIT 100
            `;

            const mappingResult = await pool.execute(orphanedMappingsQuery);

            logger.info('清理孤立的钱包映射', { 
                deletedRows: mappingResult[0].affectedRows
            });

            return {
                deletedRows: mappingResult[0].affectedRows,
                type: 'orphaned_mappings'
            };

        } catch (error) {
            logger.error('清理临时数据失败', { error: error.message });
            return { deletedRows: 0, error: error.message };
        }
    }

    /**
     * 优化数据库表
     */
    async optimizeTables() {
        try {
            const tables = [
                'wallet_transactions',
                'wallet_mappings', 
                'balance_logs',
                'users'
            ];

            const results = [];

            for (const table of tables) {
                try {
                    await pool.execute(`OPTIMIZE TABLE ${table}`);
                    results.push({ table, status: 'optimized' });
                    logger.info(`表 ${table} 优化完成`);
                } catch (error) {
                    results.push({ table, status: 'failed', error: error.message });
                    logger.warn(`表 ${table} 优化失败`, { error: error.message });
                }
            }

            return { optimizedTables: results };

        } catch (error) {
            logger.error('表优化失败', { error: error.message });
            return { optimizedTables: [], error: error.message };
        }
    }

    /**
     * 获取数据库统计信息
     */
    async getDatabaseStats() {
        try {
            const queries = {
                totalTransactions: 'SELECT COUNT(*) as count FROM wallet_transactions',
                totalMappings: 'SELECT COUNT(*) as count FROM wallet_mappings',
                totalUsers: 'SELECT COUNT(*) as count FROM users',
                totalBalanceLogs: 'SELECT COUNT(*) as count FROM balance_logs',
                dbSize: `
                    SELECT 
                        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
                    FROM information_schema.tables 
                    WHERE table_schema = DATABASE()
                `
            };

            const stats = {};
            
            for (const [key, query] of Object.entries(queries)) {
                try {
                    const [result] = await pool.execute(query);
                    stats[key] = result[0].count || result[0].size_mb;
                } catch (error) {
                    stats[key] = 'N/A';
                }
            }

            return stats;

        } catch (error) {
            logger.error('获取数据库统计失败', { error: error.message });
            return {};
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const cleanup = new DataCleanup();
    
    (async () => {
        try {
            console.log('开始数据清理...');
            
            // 获取清理前的统计
            const statsBefore = await cleanup.getDatabaseStats();
            console.log('清理前统计:', statsBefore);
            
            // 执行清理
            const results = await cleanup.cleanup();
            console.log('清理结果:', results);
            
            // 获取清理后的统计
            const statsAfter = await cleanup.getDatabaseStats();
            console.log('清理后统计:', statsAfter);
            
            console.log('数据清理完成');
            process.exit(0);
            
        } catch (error) {
            console.error('数据清理失败:', error);
            process.exit(1);
        } finally {
            if (pool) {
                await pool.end();
            }
        }
    })();
}

module.exports = DataCleanup;