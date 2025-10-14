/**
 * PostgreSQL数据库连接配置
 * 用于H5游戏项目的数据库连接管理
 */

const { Pool } = require('pg');
require('dotenv').config();

/**
 * PostgreSQL连接池配置
 */
const poolConfig = {
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    user: process.env.PG_USER || process.env.USER,
    password: process.env.PG_PASSWORD || '',
    database: process.env.PG_DATABASE || 'h5_game_db',
    
    // 连接池配置
    max: 20,                    // 最大连接数
    min: 2,                     // 最小连接数
    idleTimeoutMillis: 30000,   // 空闲连接超时时间
    connectionTimeoutMillis: 2000, // 连接超时时间
    
    // SSL配置（生产环境建议启用）
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
};

/**
 * 创建连接池实例
 */
const pool = new Pool(poolConfig);

/**
 * 连接池事件监听
 */
pool.on('connect', (client) => {
    console.log('PostgreSQL客户端连接成功');
});

pool.on('error', (err, client) => {
    console.error('PostgreSQL连接池错误:', err);
});

/**
 * 执行查询的封装函数
 * @param {string} text - SQL查询语句
 * @param {Array} params - 查询参数
 * @returns {Promise} 查询结果
 */
async function query(text, params) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        
        // 记录慢查询（超过100ms）
        if (duration > 100) {
            console.warn(`慢查询检测 (${duration}ms):`, text);
        }
        
        return res;
    } catch (error) {
        console.error('数据库查询错误:', error);
        throw error;
    }
}

/**
 * 获取数据库客户端连接
 * @returns {Promise} 数据库客户端
 */
async function getClient() {
    return await pool.connect();
}

/**
 * 事务处理封装
 * @param {Function} callback - 事务回调函数
 * @returns {Promise} 事务结果
 */
async function transaction(callback) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * 测试数据库连接
 * @returns {Promise<boolean>} 连接是否成功
 */
async function testConnection() {
    try {
        const result = await query('SELECT NOW() as current_time, version() as version');
        console.log('数据库连接测试成功:', result.rows[0]);
        return true;
    } catch (error) {
        console.error('数据库连接测试失败:', error);
        return false;
    }
}

/**
 * 关闭连接池
 */
async function closePool() {
    try {
        await pool.end();
        console.log('PostgreSQL连接池已关闭');
    } catch (error) {
        console.error('关闭连接池时出错:', error);
    }
}

/**
 * 获取数据库统计信息
 * @returns {Promise<Object>} 统计信息
 */
async function getStats() {
    try {
        const result = await query(`
            SELECT 
                schemaname,
                tablename,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
                pg_stat_get_tuples_returned(c.oid) as tuples_returned,
                pg_stat_get_tuples_fetched(c.oid) as tuples_fetched
            FROM pg_tables pt
            JOIN pg_class c ON c.relname = pt.tablename
            WHERE schemaname = 'public'
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        `);
        
        return {
            tables: result.rows,
            pool_stats: {
                total_count: pool.totalCount,
                idle_count: pool.idleCount,
                waiting_count: pool.waitingCount
            }
        };
    } catch (error) {
        console.error('获取数据库统计信息失败:', error);
        return null;
    }
}

module.exports = {
    pool,
    query,
    getClient,
    transaction,
    testConnection,
    closePool,
    getStats
};