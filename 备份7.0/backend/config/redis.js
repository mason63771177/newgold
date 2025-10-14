/**
 * Redis 配置文件
 * 提供统一的Redis客户端实例
 */

const redis = require('redis');
require('dotenv').config();

// Redis连接配置
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB || 0,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
    connectTimeout: 10000,
    lazyConnect: true
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

redisClient.on('ready', () => {
    console.log('✅ Redis客户端就绪');
});

redisClient.on('reconnecting', () => {
    console.log('🔄 Redis重新连接中...');
});

// 连接Redis（延迟连接）
const connectRedis = async () => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
        return redisClient;
    } catch (error) {
        console.error('❌ Redis连接失败:', error);
        throw error;
    }
};

// 确保连接
connectRedis().catch(console.error);

module.exports = redisClient;