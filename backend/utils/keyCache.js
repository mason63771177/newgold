/**
 * 密钥缓存机制
 * 提供安全的内存缓存，提升密钥访问性能
 */

const crypto = require('crypto');

class KeyCache {
    constructor(options = {}) {
        this.cache = new Map();
        this.accessLog = new Map();
        this.config = {
            maxSize: options.maxSize || 50,
            ttl: options.ttl || 300000, // 5分钟默认TTL
            maxAccessCount: options.maxAccessCount || 1000,
            cleanupInterval: options.cleanupInterval || 60000, // 1分钟清理间隔
            encryptCache: options.encryptCache !== false, // 默认加密缓存
            ...options
        };
        
        // 缓存加密密钥 (32字节用于AES-256)
        this.cacheKey = crypto.randomBytes(32).toString('hex');
        
        // 启动定期清理
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.config.cleanupInterval);
        
        console.log('🔧 密钥缓存系统已初始化');
    }

    /**
     * 生成缓存键
     */
    generateCacheKey(keyType, userId = null) {
        const keyData = userId ? `${keyType}:${userId}` : keyType;
        return crypto.createHash('sha256').update(keyData).digest('hex');
    }

    /**
     * 加密缓存值
     */
    encryptValue(value) {
        if (!this.config.encryptCache) {
            return value;
        }
        
        const iv = crypto.randomBytes(16);
        const key = Buffer.from(this.cacheKey, 'hex');
        const cipher = crypto.createCipher('aes-256-cbc', key);
        
        let encrypted = cipher.update(JSON.stringify(value), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            timestamp: Date.now()
        };
    }

    /**
     * 解密缓存值
     */
    decryptValue(encryptedData) {
        if (!this.config.encryptCache) {
            return encryptedData;
        }
        
        try {
            const key = Buffer.from(this.cacheKey, 'hex');
            const decipher = crypto.createDecipher('aes-256-cbc', key);
            
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return JSON.parse(decrypted);
        } catch (error) {
            console.error('❌ 缓存解密失败:', error.message);
            return null;
        }
    }

    /**
     * 设置缓存
     */
    set(keyType, value, userId = null, customTtl = null) {
        let cacheKey;
        try {
            cacheKey = this.generateCacheKey(keyType, userId);
            const ttl = customTtl || this.config.ttl;
            const expiresAt = Date.now() + ttl;
            
            // 检查缓存大小限制
            if (this.cache.size >= this.config.maxSize) {
                this.evictOldest();
            }
            
            // 加密并存储
            const encryptedValue = this.encryptValue(value);
            
            const cacheEntry = {
                value: encryptedValue,
                expiresAt,
                createdAt: Date.now(),
                accessCount: 0,
                keyType,
                userId
            };
            
            this.cache.set(cacheKey, cacheEntry);
            
            // 记录访问日志
            this.logAccess(cacheKey, 'SET', true);
            
            console.log(`✅ 缓存已设置: ${keyType}${userId ? ` (用户: ${userId})` : ''}`);
            return true;
            
        } catch (error) {
            console.error('❌ 设置缓存失败:', error.message);
            this.logAccess(cacheKey || 'unknown', 'SET', false, error.message);
            return false;
        }
    }

    /**
     * 获取缓存
     */
    get(keyType, userId = null) {
        try {
            const cacheKey = this.generateCacheKey(keyType, userId);
            const entry = this.cache.get(cacheKey);
            
            if (!entry) {
                this.logAccess(cacheKey, 'GET', false, '缓存未命中');
                return null;
            }
            
            // 检查过期
            if (Date.now() > entry.expiresAt) {
                this.cache.delete(cacheKey);
                this.logAccess(cacheKey, 'GET', false, '缓存已过期');
                return null;
            }
            
            // 检查访问次数限制
            if (entry.accessCount >= this.config.maxAccessCount) {
                this.cache.delete(cacheKey);
                this.logAccess(cacheKey, 'GET', false, '访问次数超限');
                return null;
            }
            
            // 更新访问计数
            entry.accessCount++;
            entry.lastAccessAt = Date.now();
            
            // 解密并返回
            const decryptedValue = this.decryptValue(entry.value);
            
            if (decryptedValue === null) {
                this.cache.delete(cacheKey);
                this.logAccess(cacheKey, 'GET', false, '解密失败');
                return null;
            }
            
            this.logAccess(cacheKey, 'GET', true);
            return decryptedValue;
            
        } catch (error) {
            console.error('❌ 获取缓存失败:', error.message);
            this.logAccess(cacheKey, 'GET', false, error.message);
            return null;
        }
    }

    /**
     * 删除缓存
     */
    delete(keyType, userId = null) {
        const cacheKey = this.generateCacheKey(keyType, userId);
        const deleted = this.cache.delete(cacheKey);
        
        this.logAccess(cacheKey, 'DELETE', deleted);
        
        if (deleted) {
            console.log(`✅ 缓存已删除: ${keyType}${userId ? ` (用户: ${userId})` : ''}`);
        }
        
        return deleted;
    }

    /**
     * 清空缓存
     */
    clear() {
        const size = this.cache.size;
        this.cache.clear();
        this.accessLog.clear();
        
        console.log(`✅ 已清空 ${size} 个缓存项`);
        return size;
    }

    /**
     * 检查缓存是否存在
     */
    has(keyType, userId = null) {
        const cacheKey = this.generateCacheKey(keyType, userId);
        const entry = this.cache.get(cacheKey);
        
        if (!entry) {
            return false;
        }
        
        // 检查是否过期
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(cacheKey);
            return false;
        }
        
        return true;
    }

    /**
     * 淘汰最旧的缓存项
     */
    evictOldest() {
        let oldestKey = null;
        let oldestTime = Date.now();
        
        for (const [key, entry] of this.cache.entries()) {
            if (entry.createdAt < oldestTime) {
                oldestTime = entry.createdAt;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.logAccess(oldestKey, 'EVICT', true, '缓存空间不足');
            console.log('🗑️ 已淘汰最旧的缓存项');
        }
    }

    /**
     * 清理过期缓存
     */
    cleanup() {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }
        
        // 清理访问日志
        const logRetentionTime = 24 * 60 * 60 * 1000; // 24小时
        for (const [key, logs] of this.accessLog.entries()) {
            const filteredLogs = logs.filter(log => 
                now - log.timestamp < logRetentionTime
            );
            
            if (filteredLogs.length === 0) {
                this.accessLog.delete(key);
            } else {
                this.accessLog.set(key, filteredLogs);
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 已清理 ${cleanedCount} 个过期缓存项`);
        }
    }

    /**
     * 记录访问日志
     */
    logAccess(cacheKey, action, success, details = '') {
        if (!this.accessLog.has(cacheKey)) {
            this.accessLog.set(cacheKey, []);
        }
        
        const logs = this.accessLog.get(cacheKey);
        logs.push({
            timestamp: Date.now(),
            action,
            success,
            details
        });
        
        // 限制日志数量
        if (logs.length > 100) {
            logs.splice(0, logs.length - 100);
        }
    }

    /**
     * 获取缓存统计
     */
    getStats() {
        const now = Date.now();
        let totalAccess = 0;
        let expiredCount = 0;
        
        const stats = {
            totalEntries: this.cache.size,
            maxSize: this.config.maxSize,
            utilization: (this.cache.size / this.config.maxSize * 100).toFixed(2) + '%',
            entries: [],
            accessStats: {
                total: 0,
                successful: 0,
                failed: 0,
                hitRate: '0%'
            }
        };
        
        // 统计缓存项
        for (const [key, entry] of this.cache.entries()) {
            totalAccess += entry.accessCount;
            
            if (now > entry.expiresAt) {
                expiredCount++;
            }
            
            stats.entries.push({
                keyType: entry.keyType,
                userId: entry.userId,
                accessCount: entry.accessCount,
                createdAt: new Date(entry.createdAt).toISOString(),
                expiresAt: new Date(entry.expiresAt).toISOString(),
                isExpired: now > entry.expiresAt,
                ttlRemaining: Math.max(0, entry.expiresAt - now)
            });
        }
        
        // 统计访问日志
        let successfulAccess = 0;
        let totalLoggedAccess = 0;
        
        for (const logs of this.accessLog.values()) {
            for (const log of logs) {
                totalLoggedAccess++;
                if (log.success) {
                    successfulAccess++;
                }
            }
        }
        
        stats.accessStats = {
            total: totalLoggedAccess,
            successful: successfulAccess,
            failed: totalLoggedAccess - successfulAccess,
            hitRate: totalLoggedAccess > 0 ? 
                (successfulAccess / totalLoggedAccess * 100).toFixed(2) + '%' : '0%'
        };
        
        stats.expiredCount = expiredCount;
        stats.totalAccess = totalAccess;
        
        return stats;
    }

    /**
     * 预热缓存
     */
    async warmup(keyProvider, keyTypes = []) {
        console.log('🔥 开始缓存预热...');
        
        let warmedCount = 0;
        
        for (const keyType of keyTypes) {
            try {
                const value = await keyProvider(keyType);
                if (value) {
                    this.set(keyType, value);
                    warmedCount++;
                }
            } catch (error) {
                console.warn(`⚠️ 预热密钥失败: ${keyType}`, error.message);
            }
        }
        
        console.log(`✅ 缓存预热完成，已预热 ${warmedCount} 个密钥`);
        return warmedCount;
    }

    /**
     * 销毁缓存系统
     */
    destroy() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        
        this.clear();
        
        // 清除加密密钥（字符串类型）
        if (this.cacheKey) {
            this.cacheKey = null;
        }
        
        console.log('✅ 密钥缓存系统已销毁');
    }
}

module.exports = KeyCache;