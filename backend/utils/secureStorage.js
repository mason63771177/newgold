const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * 安全存储管理器 - 用于加密存储和管理敏感信息
 * 主要功能：助记词加密、私钥派生、安全存储
 */
class SecureStorageManager {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyDerivation = 'pbkdf2';
        this.iterations = 100000; // PBKDF2 迭代次数
        this.keyLength = 32; // 256 bits
        this.ivLength = 16; // 128 bits
        this.saltLength = 32; // 256 bits
        this.tagLength = 16; // 128 bits
    }

    /**
     * 生成安全的随机盐值
     * @returns {Buffer} 随机盐值
     */
    generateSalt() {
        return crypto.randomBytes(this.saltLength);
    }

    /**
     * 从密码和盐值派生密钥
     * @param {string} password - 主密码
     * @param {Buffer} salt - 盐值
     * @returns {Buffer} 派生的密钥
     */
    deriveKey(password, salt) {
        return crypto.pbkdf2Sync(password, salt, this.iterations, this.keyLength, 'sha256');
    }

    /**
     * 加密助记词
     * @param {string} mnemonic - 原始助记词
     * @param {string} password - 加密密码
     * @returns {Object} 加密结果对象
     */
    encryptMnemonic(mnemonic, password) {
        try {
            // 生成随机盐值和IV
            const salt = this.generateSalt();
            const iv = crypto.randomBytes(this.ivLength);
            
            // 派生加密密钥
            const key = this.deriveKey(password, salt);
            
            // 创建加密器
            const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
            
            // 加密助记词
            let encrypted = cipher.update(mnemonic, 'utf8', 'base64');
            encrypted += cipher.final('base64');
            
            // 组合所有数据
            const result = {
                encrypted: encrypted,
                salt: salt.toString('base64'),
                iv: iv.toString('base64'),
                algorithm: 'aes-256-cbc',
                iterations: this.iterations,
                timestamp: new Date().toISOString()
            };
            
            console.log('✅ 助记词加密成功');
            return result;
            
        } catch (error) {
            console.error('❌ 助记词加密失败:', error.message);
            throw new Error(`助记词加密失败: ${error.message}`);
        }
    }

    /**
     * 解密助记词
     * @param {Object} encryptedData - 加密数据对象
     * @param {string} password - 解密密码
     * @returns {string} 解密后的助记词
     */
    decryptMnemonic(encryptedData, password) {
        try {
            // 解析加密数据
            const salt = Buffer.from(encryptedData.salt, 'base64');
            const iv = Buffer.from(encryptedData.iv, 'base64');
            const encrypted = encryptedData.encrypted;
            
            // 派生解密密钥
            const key = this.deriveKey(password, salt);
            
            // 创建解密器
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            
            // 解密助记词
            let decrypted = decipher.update(encrypted, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            
            console.log('✅ 助记词解密成功');
            return decrypted;
            
        } catch (error) {
            console.error('❌ 助记词解密失败:', error.message);
            throw new Error(`助记词解密失败: ${error.message}`);
        }
    }

    /**
     * 将加密数据保存到文件
     * @param {Object} encryptedData - 加密数据
     * @param {string} filePath - 文件路径
     */
    saveEncryptedData(encryptedData, filePath) {
        try {
            // 确保目录存在
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            // 保存加密数据
            fs.writeFileSync(filePath, JSON.stringify(encryptedData, null, 2));
            
            // 设置文件权限 (仅所有者可读写)
            fs.chmodSync(filePath, 0o600);
            
            console.log(`✅ 加密数据已保存到: ${filePath}`);
            
        } catch (error) {
            console.error('❌ 保存加密数据失败:', error.message);
            throw new Error(`保存加密数据失败: ${error.message}`);
        }
    }

    /**
     * 从文件加载加密数据
     * @param {string} filePath - 文件路径
     * @returns {Object} 加密数据对象
     */
    loadEncryptedData(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`加密文件不存在: ${filePath}`);
            }
            
            const data = fs.readFileSync(filePath, 'utf8');
            const encryptedData = JSON.parse(data);
            
            console.log(`✅ 加密数据已从文件加载: ${filePath}`);
            return encryptedData;
            
        } catch (error) {
            console.error('❌ 加载加密数据失败:', error.message);
            throw new Error(`加载加密数据失败: ${error.message}`);
        }
    }

    /**
     * 验证加密数据的完整性
     * @param {Object} encryptedData - 加密数据对象
     * @returns {boolean} 验证结果
     */
    validateEncryptedData(encryptedData) {
        const requiredFields = ['encrypted', 'salt', 'iv', 'algorithm', 'iterations'];
        
        for (const field of requiredFields) {
            if (!encryptedData[field]) {
                console.error(`❌ 缺少必需字段: ${field}`);
                return false;
            }
        }
        
        // 验证算法
        if (encryptedData.algorithm !== 'aes-256-cbc') {
            console.error(`❌ 不支持的加密算法: ${encryptedData.algorithm}`);
            return false;
        }
        
        console.log('✅ 加密数据验证通过');
        return true;
    }

    /**
     * 生成安全的主密码
     * @param {number} length - 密码长度
     * @returns {string} 生成的密码
     */
    generateSecurePassword(length = 32) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        
        for (let i = 0; i < length; i++) {
            const randomIndex = crypto.randomInt(0, charset.length);
            password += charset[randomIndex];
        }
        
        return password;
    }

    /**
     * 创建密码哈希 (用于验证)
     * @param {string} password - 原始密码
     * @returns {string} 密码哈希
     */
    createPasswordHash(password) {
        const salt = this.generateSalt();
        const hash = crypto.pbkdf2Sync(password, salt, this.iterations, 64, 'sha256');
        
        return {
            hash: hash.toString('base64'),
            salt: salt.toString('base64'),
            iterations: this.iterations
        };
    }

    /**
     * 验证密码
     * @param {string} password - 输入的密码
     * @param {Object} storedHash - 存储的哈希信息
     * @returns {boolean} 验证结果
     */
    verifyPassword(password, storedHash) {
        try {
            const salt = Buffer.from(storedHash.salt, 'base64');
            const hash = crypto.pbkdf2Sync(password, salt, storedHash.iterations, 64, 'sha256');
            const storedHashBuffer = Buffer.from(storedHash.hash, 'base64');
            
            return crypto.timingSafeEqual(hash, storedHashBuffer);
            
        } catch (error) {
            console.error('❌ 密码验证失败:', error.message);
            return false;
        }
    }

    /**
     * 保存加密的助记词到文件
     * @param {string} mnemonic - 原始助记词
     * @param {string} password - 加密密码
     * @param {string} filePath - 保存路径
     * @returns {Object} 操作结果
     */
    saveEncryptedMnemonic(mnemonic, password, filePath) {
        try {
            const encryptedData = this.encryptMnemonic(mnemonic, password);
            this.saveEncryptedData(encryptedData, filePath);
            return { success: true, filePath };
        } catch (error) {
            console.error('保存加密助记词失败:', error.message);
            throw error;
        }
    }

    /**
     * 从文件加载并解密助记词
     * @param {string} filePath - 加密文件路径
     * @param {string} password - 解密密码
     * @returns {string} 解密后的助记词
     */
    loadEncryptedMnemonic(filePath, password) {
        try {
            const fileData = this.loadEncryptedData(filePath);
            
            // 检查文件数据结构
            if (fileData.encryptedMnemonic) {
                // 新格式：助记词在 encryptedMnemonic 对象中
                return this.decryptMnemonic(fileData.encryptedMnemonic, password);
            } else if (fileData.encrypted) {
                // 旧格式：直接是加密数据
                return this.decryptMnemonic(fileData, password);
            } else {
                throw new Error('无效的加密文件格式');
            }
        } catch (error) {
            console.error('加载加密助记词失败:', error.message);
            throw error;
        }
    }
}

module.exports = SecureStorageManager;