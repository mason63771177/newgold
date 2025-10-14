/**
 * 密钥管理系统 (Key Management System)
 * 集中管理所有敏感信息：助记词、私钥、API密钥等
 * 提供统一的安全存储、访问控制和审计功能
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const SecureStorageManager = require('./secureStorage');
const KeyCache = require('./keyCache');

class KeyManagementSystem {
    constructor() {
        this.secureStorage = new SecureStorageManager();
        this.keyCache = new KeyCache({
            maxSize: 20,
            ttl: 300000, // 5分钟
            encryptCache: true
        });
        this.keyStore = new Map(); // 内存中的密钥缓存
        this.accessLog = []; // 访问日志
        this.secureDir = '/Users/mason1236/0930/secure';
        this.configFile = path.join(this.secureDir, 'key-management-config.json');
        this.accessLogFile = path.join(this.secureDir, 'access-log.json');
        
        // 密钥类型定义
        this.keyTypes = {
            MASTER_MNEMONIC: 'master_mnemonic',
            TATUM_API_KEY: 'tatum_api_key',
            DATABASE_PASSWORD: 'database_password',
            REDIS_PASSWORD: 'redis_password',
            JWT_SECRET: 'jwt_secret',
            WEBHOOK_SECRET: 'webhook_secret'
        };
        
        // 访问权限级别
        this.accessLevels = {
            READ_ONLY: 'read_only',
            READ_WRITE: 'read_write',
            ADMIN: 'admin'
        };
        
        this.isInitialized = false;
    }

    /**
     * 初始化密钥管理系统
     */
    async initialize() {
        try {
            console.log('🔐 初始化密钥管理系统...');
            
            // 确保安全目录存在
            await this.ensureSecureDirectory();
            
            // 加载配置
            await this.loadConfiguration();
            
            // 验证系统完整性
            await this.verifySystemIntegrity();
            
            this.isInitialized = true;
            console.log('✅ 密钥管理系统初始化成功');
            
        } catch (error) {
            console.error('❌ 密钥管理系统初始化失败:', error.message);
            throw error;
        }
    }

    /**
     * 确保安全目录存在且权限正确
     */
    async ensureSecureDirectory() {
        if (!fs.existsSync(this.secureDir)) {
            fs.mkdirSync(this.secureDir, { recursive: true, mode: 0o700 });
            console.log(`✅ 创建安全目录: ${this.secureDir}`);
        }
        
        // 设置目录权限为仅所有者可访问
        fs.chmodSync(this.secureDir, 0o700);
    }

    /**
     * 加载系统配置
     */
    async loadConfiguration() {
        if (fs.existsSync(this.configFile)) {
            try {
                const config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
                console.log('✅ 加载现有配置');
                return config;
            } catch (error) {
                console.warn('⚠️ 配置文件损坏，将创建新配置');
            }
        }
        
        // 创建默认配置
        const defaultConfig = {
            version: '1.0.0',
            created_at: new Date().toISOString(),
            encryption_algorithm: 'aes-256-gcm',
            key_rotation_interval: 90, // 天
            access_log_retention: 365, // 天
            keys: {}
        };
        
        await this.saveConfiguration(defaultConfig);
        return defaultConfig;
    }

    /**
     * 保存配置
     */
    async saveConfiguration(config) {
        fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2), { mode: 0o600 });
    }

    /**
     * 验证系统完整性
     */
    async verifySystemIntegrity() {
        const requiredFiles = [
            'master-wallet-encrypted.json',
            'master-password.txt'
        ];
        
        for (const file of requiredFiles) {
            const filePath = path.join(this.secureDir, file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`关键文件缺失: ${file}`);
            }
        }
        
        console.log('✅ 系统完整性验证通过');
    }

    /**
     * 存储密钥
     * @param {string} keyType - 密钥类型
     * @param {string} keyValue - 密钥值
     * @param {string} password - 加密密码
     * @param {Object} metadata - 元数据
     */
    async storeKey(keyType, keyValue, password, metadata = {}) {
        try {
            this.ensureInitialized();
            
            const keyId = this.generateKeyId(keyType);
            const encryptedData = this.secureStorage.encryptMnemonic(keyValue, password);
            
            const keyRecord = {
                id: keyId,
                type: keyType,
                encrypted_data: encryptedData,
                metadata: {
                    ...metadata,
                    created_at: new Date().toISOString(),
                    last_accessed: null,
                    access_count: 0
                },
                permissions: {
                    read: true,
                    write: true,
                    delete: false
                }
            };
            
            // 保存到文件
            const keyFile = path.join(this.secureDir, `${keyId}.json`);
            fs.writeFileSync(keyFile, JSON.stringify(keyRecord, null, 2), { mode: 0o600 });
            
            // 记录访问日志
            await this.logAccess('STORE', keyType, keyId);
            
            console.log(`✅ 密钥存储成功: ${keyType}`);
            return keyId;
            
        } catch (error) {
            console.error('❌ 密钥存储失败:', error.message);
            throw error;
        }
    }

    /**
     * 获取密钥
     * @param {string} keyType - 密钥类型
     * @param {string} password - 解密密码
     */
    async getKey(keyType, password) {
        try {
            this.ensureInitialized();
            
            // 首先尝试从缓存获取
            const cachedKey = this.keyCache.get(keyType);
            if (cachedKey) {
                await this.logAccess('GET_CACHED', keyType);
                return cachedKey;
            }
            
            // 检查内存缓存
            const cacheKey = `${keyType}_${this.hashPassword(password)}`;
            if (this.keyStore.has(cacheKey)) {
                await this.logAccess('GET_CACHED', keyType);
                return this.keyStore.get(cacheKey);
            }
            
            // 从文件加载
            const keyId = this.generateKeyId(keyType);
            const keyFile = path.join(this.secureDir, `${keyId}.json`);
            
            if (!fs.existsSync(keyFile)) {
                throw new Error(`密钥不存在: ${keyType}`);
            }
            
            const keyRecord = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
            const decryptedKey = this.secureStorage.decryptMnemonic(keyRecord.encrypted_data, password);
            
            // 更新访问记录
            keyRecord.metadata.last_accessed = new Date().toISOString();
            keyRecord.metadata.access_count += 1;
            fs.writeFileSync(keyFile, JSON.stringify(keyRecord, null, 2), { mode: 0o600 });
            
            // 存入缓存
            this.keyCache.set(keyType, decryptedKey);
            
            // 缓存到内存（有限时间）
            this.keyStore.set(cacheKey, decryptedKey);
            setTimeout(() => {
                this.keyStore.delete(cacheKey);
            }, 300000); // 5分钟后清除缓存
            
            // 记录访问日志
            await this.logAccess('GET', keyType, keyId);
            
            return decryptedKey;
            
        } catch (error) {
            console.error('❌ 密钥获取失败:', error.message);
            await this.logAccess('GET_FAILED', keyType, null, error.message);
            throw error;
        }
    }

    /**
     * 获取主钱包助记词
     * @param {string} masterPassword - 主密码
     */
    async getMasterMnemonic(masterPassword) {
        try {
            // 首先尝试从缓存获取
            const cachedMnemonic = this.keyCache.get('master_mnemonic');
            if (cachedMnemonic) {
                await this.logAccess('GET_CACHED', 'master_mnemonic', null, null);
                return cachedMnemonic;
            }
            
            // 直接从现有的加密文件加载
            const encryptedConfigPath = path.join(this.secureDir, 'master-wallet-encrypted.json');
            const mnemonic = await this.secureStorage.loadEncryptedMnemonic(encryptedConfigPath, masterPassword);
            
            if (!mnemonic) {
                await this.logAccess('GET', 'master_mnemonic', null, '主助记词不存在');
                throw new Error('主助记词不存在');
            }
            
            // 存入缓存
            this.keyCache.set('master_mnemonic', mnemonic);
            
            await this.logAccess('GET', 'master_mnemonic', null, null);
            return mnemonic;
            
        } catch (error) {
            console.error('❌ 获取主钱包助记词失败:', error.message);
            await this.logAccess('GET', 'master_mnemonic', null, error.message);
            throw error;
        }
    }

    /**
     * 轮换密钥
     * @param {string} keyType - 密钥类型
     * @param {string} oldPassword - 旧密码
     * @param {string} newPassword - 新密码
     */
    async rotateKey(keyType, oldPassword, newPassword) {
        try {
            this.ensureInitialized();
            
            // 获取当前密钥
            const currentKey = await this.getKey(keyType, oldPassword);
            
            // 用新密码重新加密
            const keyId = this.generateKeyId(keyType);
            const keyFile = path.join(this.secureDir, `${keyId}.json`);
            const keyRecord = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
            
            // 重新加密
            keyRecord.encrypted_data = this.secureStorage.encryptMnemonic(currentKey, newPassword);
            keyRecord.metadata.rotated_at = new Date().toISOString();
            
            // 保存更新后的记录
            fs.writeFileSync(keyFile, JSON.stringify(keyRecord, null, 2), { mode: 0o600 });
            
            // 清除缓存
            this.keyStore.clear();
            
            // 记录访问日志
            await this.logAccess('ROTATE', keyType, keyId);
            
            console.log(`✅ 密钥轮换成功: ${keyType}`);
            
        } catch (error) {
            console.error('❌ 密钥轮换失败:', error.message);
            throw error;
        }
    }

    /**
     * 生成密钥ID
     */
    generateKeyId(keyType) {
        return `key_${keyType}_${crypto.createHash('sha256').update(keyType).digest('hex').substring(0, 8)}`;
    }

    /**
     * 哈希密码（用于缓存键）
     */
    hashPassword(password) {
        if (!password) {
            throw new Error('密码不能为空');
        }
        return crypto.createHash('sha256').update(password).digest('hex').substring(0, 16);
    }

    /**
     * 记录访问日志
     */
    async logAccess(action, keyType, keyId = null, error = null) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action,
            key_type: keyType,
            key_id: keyId,
            success: !error,
            error: error || null,
            process_id: process.pid,
            user_agent: process.env.USER || 'system'
        };
        
        this.accessLog.push(logEntry);
        
        // 定期保存日志到文件
        if (this.accessLog.length >= 100) {
            await this.flushAccessLog();
        }
    }

    /**
     * 刷新访问日志到文件
     */
    async flushAccessLog() {
        if (this.accessLog.length === 0) return;
        
        let existingLogs = [];
        if (fs.existsSync(this.accessLogFile)) {
            try {
                existingLogs = JSON.parse(fs.readFileSync(this.accessLogFile, 'utf8'));
            } catch (error) {
                console.warn('⚠️ 访问日志文件损坏，将重新创建');
            }
        }
        
        const allLogs = [...existingLogs, ...this.accessLog];
        
        // 保留最近的日志（根据配置）
        const retentionDays = 365;
        const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
        const filteredLogs = allLogs.filter(log => new Date(log.timestamp) > cutoffDate);
        
        fs.writeFileSync(this.accessLogFile, JSON.stringify(filteredLogs, null, 2), { mode: 0o600 });
        this.accessLog = [];
    }

    /**
     * 获取访问统计
     */
    async getAccessStats() {
        await this.flushAccessLog();
        
        if (!fs.existsSync(this.accessLogFile)) {
            return { total: 0, by_type: {}, recent: [] };
        }
        
        const logs = JSON.parse(fs.readFileSync(this.accessLogFile, 'utf8'));
        
        const stats = {
            total: logs.length,
            by_type: {},
            by_action: {},
            recent: logs.slice(-10).reverse(),
            errors: logs.filter(log => !log.success).length
        };
        
        logs.forEach(log => {
            stats.by_type[log.key_type] = (stats.by_type[log.key_type] || 0) + 1;
            stats.by_action[log.action] = (stats.by_action[log.action] || 0) + 1;
        });
        
        return stats;
    }

    /**
     * 确保系统已初始化
     */
    ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error('密钥管理系统未初始化，请先调用 initialize()');
        }
    }

    /**
     * 清理资源
     */
    async cleanup() {
        // 刷新日志
        await this.flushAccessLog();
        
        // 清除内存缓存
        this.keyStore.clear();
        
        console.log('✅ 密钥管理系统清理完成');
    }
}

module.exports = KeyManagementSystem;