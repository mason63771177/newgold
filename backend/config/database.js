const mysql = require('mysql2/promise');
const redis = require('redis');
require('dotenv').config();

// MySQL连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gold7_game',
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci',
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// 创建MySQL连接池
const pool = mysql.createPool(dbConfig);

// Redis连接配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: 0,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null
};

// 创建Redis客户端
const redisClient = redis.createClient(redisConfig);

// Redis连接事件处理
redisClient.on('connect', () => {
  console.log('✅ Redis连接成功');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis连接错误:', err);
});

// 连接Redis
redisClient.connect().catch(console.error);

// 测试数据库连接
async function testConnection() {
  try {
    // 测试MySQL连接
    const connection = await pool.getConnection();
    console.log('✅ MySQL连接成功');
    connection.release();
    
    // 测试Redis连接
    await redisClient.ping();
    console.log('✅ Redis连接测试成功');
    
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    return false;
  }
}

// 优雅关闭数据库连接
async function closeConnections() {
  try {
    await pool.end();
    await redisClient.quit();
    console.log('✅ 数据库连接已关闭');
  } catch (error) {
    console.error('❌ 关闭数据库连接时出错:', error);
  }
}

module.exports = {
  pool,
  redisClient,
  testConnection,
  closeConnections
};