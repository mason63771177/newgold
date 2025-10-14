/**
 * 密钥管理系统使用示例
 * 生成时间: 2025-10-12T00:57:26.175Z
 */


// ==========================================
// BASIC USAGE
// ==========================================

// 基本使用示例
const KeyManagementSystem = require('./utils/keyManagementSystem');

async function initializeWalletService() {
    // 1. 初始化密钥管理系统
    const kms = new KeyManagementSystem();
    await kms.initialize();
    
    // 2. 获取主密码（从安全存储或用户输入）
    const masterPassword = await getMasterPassword();
    
    // 3. 获取主钱包助记词
    const mnemonic = await kms.getMasterMnemonic(masterPassword);
    
    // 4. 获取 Tatum API 密钥
    const apiKey = await kms.getKey(kms.keyTypes.TATUM_API_KEY, masterPassword);
    
    // 5. 初始化 Tatum 服务
    const tatumService = new TatumWalletService(apiKey, mnemonic);
    
    return tatumService;
}



// ==========================================
// SERVICE INTEGRATION
// ==========================================

// 服务集成示例
class TatumWalletService {
    constructor() {
        this.kms = null;
        this.masterPassword = null;
    }
    
    async initialize(masterPassword) {
        this.kms = new KeyManagementSystem();
        await this.kms.initialize();
        this.masterPassword = masterPassword;
        
        // 验证密码
        await this.kms.getMasterMnemonic(masterPassword);
        console.log('✅ 钱包服务初始化成功');
    }
    
    async getMnemonic() {
        return await this.kms.getMasterMnemonic(this.masterPassword);
    }
    
    async getApiKey() {
        return await this.kms.getKey(this.kms.keyTypes.TATUM_API_KEY, this.masterPassword);
    }
}



// ==========================================
// ERROR HANDLING
// ==========================================

// 错误处理示例
async function safeKeyAccess() {
    try {
        const kms = new KeyManagementSystem();
        await kms.initialize();
        
        const masterPassword = await getMasterPassword();
        const mnemonic = await kms.getMasterMnemonic(masterPassword);
        
        return mnemonic;
        
    } catch (error) {
        if (error.message.includes('密码')) {
            console.error('密码错误，请检查主密码');
        } else if (error.message.includes('文件')) {
            console.error('加密文件损坏或缺失');
        } else {
            console.error('未知错误:', error.message);
        }
        throw error;
    }
}



// ==========================================
// SECURITY BEST PRACTICES
// ==========================================

// 安全最佳实践
class SecureWalletManager {
    constructor() {
        this.kms = null;
        this.keyCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5分钟
    }
    
    async getKeySecurely(keyType, masterPassword) {
        const cacheKey = `${keyType}_${Date.now()}`;
        
        // 检查缓存
        if (this.keyCache.has(keyType)) {
            const cached = this.keyCache.get(keyType);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.value;
            }
        }
        
        // 从 KMS 获取
        const key = await this.kms.getKey(keyType, masterPassword);
        
        // 缓存密钥
        this.keyCache.set(keyType, {
            value: key,
            timestamp: Date.now()
        });
        
        // 设置自动清理
        setTimeout(() => {
            this.keyCache.delete(keyType);
        }, this.cacheTimeout);
        
        return key;
    }
    
    clearCache() {
        this.keyCache.clear();
    }
}



module.exports = {
    // 导出示例函数供测试使用
};
