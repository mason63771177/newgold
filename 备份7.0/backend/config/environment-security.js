/**
 * 环境变量安全配置模块
 * 实施访问控制、审计和安全的环境变量管理
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const KeyManagementSystem = require('../utils/keyManagementSystem');

class EnvironmentSecurity {
    constructor() {
        this.kms = new KeyManagementSystem();
        this.accessLog = [];
        this.secureDir = '/Users/mason1236/0930/secure';
        this.configFile = path.join(this.secureDir, 'env-security-config.json');
        this.accessLogFile = path.join(this.secureDir, 'env-access-log.json');
        
        // 敏感环境变量映射
        this.sensitiveEnvMapping = {
            'TATUM_API_KEY': 'tatum_api_key',
            'TATUM_MASTER_WALLET_MNEMONIC': 'master_mnemonic',
            'DB_PASSWORD': 'database_password',
            'REDIS_PASSWORD': 'redis_password',
            'JWT_SECRET': 'jwt_secret',
            'WEBHOOK_SECRET': 'webhook_secret'
        };
        
        // 访问权限配置
        this.accessPermissions = {
            'tatum_api_key': ['TatumWalletService', 'UserWalletAddressService'],
            'master_mnemonic': ['TatumWalletService', 'UserWalletAddressService', 'TatumBasicWalletService'],
            'database_password': ['DatabaseService', 'UserService'],
            'redis_password': ['CacheService', 'SessionService'],
            'jwt_secret': ['AuthService', 'TokenService'],
            'webhook_secret': ['WebhookService', 'NotificationService']
        };
        
        this.isInitialized = false;
        this.masterPassword = null;
    }

    /**
     * 初始化环境安全系统
     */
    async initialize(masterPassword) {
        try {
            console.log('🔒 初始化环境安全系统...');
            
            // 初始化密钥管理系统
            await this.kms.initialize();
            this.masterPassword = masterPassword;
            
            // 验证主密码
            await this.kms.getMasterMnemonic(masterPassword);
            
            // 加载配置
            await this.loadSecurityConfig();
            
            // 设置环境变量代理
            this.setupEnvironmentProxy();
            
            // 清理原始环境变量
            await this.cleanupSensitiveEnvVars();
            
            this.isInitialized = true;
            console.log('✅ 环境安全系统初始化完成');
            
        } catch (error) {
            console.error('❌ 环境安全系统初始化失败:', error.message);
            throw error;
        }
    }

    /**
     * 加载安全配置
     */
    async loadSecurityConfig() {
        if (fs.existsSync(this.configFile)) {
            try {
                const config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
                console.log('✅ 加载现有安全配置');
                return config;
            } catch (error) {
                console.warn('⚠️ 安全配置文件损坏，将创建新配置');
            }
        }
        
        // 创建默认配置
        const defaultConfig = {
            version: '1.0.0',
            created_at: new Date().toISOString(),
            security_level: 'high',
            audit_enabled: true,
            access_control_enabled: true,
            env_var_cleanup: true,
            log_retention_days: 90,
            allowed_callers: Object.values(this.accessPermissions).flat()
        };
        
        await this.saveSecurityConfig(defaultConfig);
        return defaultConfig;
    }

    /**
     * 保存安全配置
     */
    async saveSecurityConfig(config) {
        fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2), { mode: 0o600 });
    }

    /**
     * 设置环境变量代理
     */
    setupEnvironmentProxy() {
        console.log('🔧 设置环境变量安全代理...');
        
        // 创建安全的环境变量访问器
        global.secureEnv = new Proxy({}, {
            get: (target, prop) => {
                return this.getSecureEnvVar(prop);
            },
            
            set: (target, prop, value) => {
                this.logAccess('SET_ATTEMPT', prop, false, '尝试设置环境变量被阻止');
                throw new Error(`不允许设置环境变量: ${prop}`);
            },
            
            has: (target, prop) => {
                return this.sensitiveEnvMapping.hasOwnProperty(prop);
            },
            
            ownKeys: (target) => {
                this.logAccess('ENUMERATE', 'ALL_KEYS', true, '枚举环境变量');
                return Object.keys(this.sensitiveEnvMapping);
            }
        });
        
        console.log('✅ 环境变量安全代理已设置');
    }

    /**
     * 安全获取环境变量
     */
    async getSecureEnvVar(varName, callerInfo = null) {
        try {
            // 检查是否为敏感变量
            if (!this.sensitiveEnvMapping[varName]) {
                // 非敏感变量，直接返回原始环境变量
                const value = process.env[varName];
                this.logAccess('GET_NON_SENSITIVE', varName, true, '获取非敏感环境变量');
                return value;
            }
            
            // 获取调用者信息
            const caller = callerInfo || this.getCallerInfo();
            
            // 检查访问权限
            const keyType = this.sensitiveEnvMapping[varName];
            if (!this.checkAccessPermission(keyType, caller)) {
                this.logAccess('ACCESS_DENIED', varName, false, `访问被拒绝: ${caller}`);
                throw new Error(`访问被拒绝: ${varName} (调用者: ${caller})`);
            }
            
            // 从密钥管理系统获取
            let value;
            if (keyType === 'master_mnemonic') {
                value = await this.kms.getMasterMnemonic(this.masterPassword);
            } else {
                value = await this.kms.getKey(keyType, this.masterPassword);
            }
            
            this.logAccess('GET_SUCCESS', varName, true, `成功获取: ${caller}`);
            return value;
            
        } catch (error) {
            this.logAccess('GET_ERROR', varName, false, error.message);
            throw error;
        }
    }

    /**
     * 获取调用者信息
     */
    getCallerInfo() {
        const stack = new Error().stack;
        const lines = stack.split('\n');
        
        // 查找第一个非本模块的调用者
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i];
            if (line && !line.includes('environment-security.js')) {
                const match = line.match(/at\s+(.+?)\s+\(/);
                if (match) {
                    return match[1];
                }
                
                const fileMatch = line.match(/\/([^\/]+\.js):/);
                if (fileMatch) {
                    return fileMatch[1];
                }
            }
        }
        
        return 'unknown';
    }

    /**
     * 检查访问权限
     */
    checkAccessPermission(keyType, caller) {
        const allowedCallers = this.accessPermissions[keyType];
        
        if (!allowedCallers) {
            return false;
        }
        
        // 检查精确匹配
        if (allowedCallers.includes(caller)) {
            return true;
        }
        
        // 检查文件名匹配
        const callerFile = caller.split('/').pop();
        return allowedCallers.some(allowed => 
            callerFile.includes(allowed) || allowed.includes(callerFile)
        );
    }

    /**
     * 清理敏感环境变量
     */
    async cleanupSensitiveEnvVars() {
        console.log('🧹 清理敏感环境变量...');
        
        const cleanedVars = [];
        
        for (const envVar of Object.keys(this.sensitiveEnvMapping)) {
            if (process.env[envVar]) {
                // 备份原始值（用于验证）
                const originalValue = process.env[envVar];
                
                // 删除环境变量
                delete process.env[envVar];
                cleanedVars.push(envVar);
                
                console.log(`✅ 已清理敏感环境变量: ${envVar}`);
            }
        }
        
        // 记录清理操作
        this.logAccess('CLEANUP', cleanedVars.join(','), true, `清理了 ${cleanedVars.length} 个敏感环境变量`);
        
        console.log(`✅ 共清理 ${cleanedVars.length} 个敏感环境变量`);
    }

    /**
     * 记录访问日志
     */
    logAccess(action, varName, success, details = '') {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action,
            variable: varName,
            success,
            details,
            caller: this.getCallerInfo(),
            process_id: process.pid,
            session_id: this.generateSessionId()
        };
        
        this.accessLog.push(logEntry);
        
        // 定期刷新日志
        if (this.accessLog.length >= 50) {
            this.flushAccessLog();
        }
    }

    /**
     * 刷新访问日志
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
        
        // 保留最近的日志
        const retentionDays = 90;
        const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
        const filteredLogs = allLogs.filter(log => new Date(log.timestamp) > cutoffDate);
        
        fs.writeFileSync(this.accessLogFile, JSON.stringify(filteredLogs, null, 2), { mode: 0o600 });
        this.accessLog = [];
    }

    /**
     * 生成会话ID
     */
    generateSessionId() {
        return crypto.createHash('sha256')
            .update(`${process.pid}_${Date.now()}_${Math.random()}`)
            .digest('hex')
            .substring(0, 16);
    }

    /**
     * 获取访问统计
     */
    async getAccessStats() {
        await this.flushAccessLog();
        
        if (!fs.existsSync(this.accessLogFile)) {
            return { total: 0, by_variable: {}, by_action: {}, recent: [] };
        }
        
        const logs = JSON.parse(fs.readFileSync(this.accessLogFile, 'utf8'));
        
        const stats = {
            total: logs.length,
            by_variable: {},
            by_action: {},
            by_caller: {},
            recent: logs.slice(-20).reverse(),
            errors: logs.filter(log => !log.success).length,
            success_rate: (logs.filter(log => log.success).length / logs.length * 100).toFixed(2) + '%'
        };
        
        logs.forEach(log => {
            stats.by_variable[log.variable] = (stats.by_variable[log.variable] || 0) + 1;
            stats.by_action[log.action] = (stats.by_action[log.action] || 0) + 1;
            stats.by_caller[log.caller] = (stats.by_caller[log.caller] || 0) + 1;
        });
        
        return stats;
    }

    /**
     * 添加访问权限
     */
    addAccessPermission(keyType, caller) {
        if (!this.accessPermissions[keyType]) {
            this.accessPermissions[keyType] = [];
        }
        
        if (!this.accessPermissions[keyType].includes(caller)) {
            this.accessPermissions[keyType].push(caller);
            this.logAccess('PERMISSION_ADDED', keyType, true, `为 ${caller} 添加访问权限`);
        }
    }

    /**
     * 移除访问权限
     */
    removeAccessPermission(keyType, caller) {
        if (this.accessPermissions[keyType]) {
            const index = this.accessPermissions[keyType].indexOf(caller);
            if (index > -1) {
                this.accessPermissions[keyType].splice(index, 1);
                this.logAccess('PERMISSION_REMOVED', keyType, true, `移除 ${caller} 的访问权限`);
            }
        }
    }

    /**
     * 清理资源
     */
    async cleanup() {
        await this.flushAccessLog();
        console.log('✅ 环境安全系统清理完成');
    }
}

module.exports = EnvironmentSecurity;