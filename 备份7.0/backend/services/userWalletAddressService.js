/**
 * 用户钱包地址服务
 * 为每个用户分配专属的TRC20 USDT充值地址
 */

const { TatumSDK, Network, Tron } = require('@tatumio/tatum');
const { TronWalletProvider } = require('@tatumio/tron-wallet-provider');
const crypto = require('crypto');
const { pool } = require('../config/database');
const UserWalletAddress = require('../models/UserWalletAddress');
const KeyManagementSystem = require('../utils/keyManagementSystem');
const fs = require('fs');

class UserWalletAddressService {
    constructor() {
        this.tatum = null;
        this.masterXPub = process.env.TATUM_MASTER_XPUB;
        this.kms = new KeyManagementSystem();
        this.masterMnemonic = null; // 将从加密存储加载
        this.network = process.env.TATUM_NETWORK || 'testnet';
        this.encryptionKey = process.env.WALLET_ENCRYPTION_KEY || 'default-key-change-in-production';
        this.isInitialized = false;
        this.masterPassword = null;
    }


    /**
     * 从加密存储加载助记词
     */
    async loadMasterMnemonic() {
        try {
            if (!this.masterMnemonic) {
                const encryptedConfigPath = '/Users/mason1236/0930/secure/master-wallet-encrypted.json';
                const masterPasswordPath = '/Users/mason1236/0930/secure/master-password.txt';
                
                const masterPassword = fs.readFileSync(masterPasswordPath, 'utf8').trim();
                this.masterMnemonic = await this.secureStorage.loadEncryptedMnemonic(
                    encryptedConfigPath, 
                    masterPassword
                );
            }
            return this.masterMnemonic;
        } catch (error) {
            console.error('❌ 加载助记词失败:', error.message);
            throw error;
        }
    }

    /**
     * 初始化服务
     */
    async initialize(masterPassword) {
        try {
            console.log('🔧 初始化用户钱包地址服务...');
            
            this.masterPassword = masterPassword;
            
            // 初始化密钥管理系统
            await this.kms.initialize();
            
            // 验证主密码
            await this.kms.getMasterMnemonic(masterPassword);
            
            // 初始化Tatum SDK
            this.tatum = await TatumSDK.init({
                network: this.network === 'mainnet' ? Network.TRON : Network.TRON_SHASTA,
                apiKey: {
                    v4: process.env.TATUM_API_KEY
                },
                configureWalletProviders: [TronWalletProvider]
            });
            
            this.isInitialized = true;
            console.log('✅ 用户钱包地址服务初始化完成');
            
        } catch (error) {
            console.error('❌ 用户钱包地址服务初始化失败:', error);
            throw error;
        }
    }

    /**
     * 确保SDK已初始化
     */
    async ensureInitialized() {
        if (!this.tatum) {
            await this.initialize();
        }
        if (!this.masterMnemonic) {
            await this.loadMasterMnemonic();
        }
    }

    /**
     * 加密私钥
     * @param {string} privateKey - 私钥
     * @returns {string} 加密后的私钥
     */
    encryptPrivateKey(privateKey) {
        const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
        let encrypted = cipher.update(privateKey, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    /**
     * 解密私钥
     * @param {string} encryptedPrivateKey - 加密的私钥
     * @returns {string} 解密后的私钥
     */
    decryptPrivateKey(encryptedPrivateKey) {
        const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
        let decrypted = decipher.update(encryptedPrivateKey, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    /**
     * 为用户分配专属钱包地址
     * @param {string} userId - 用户ID
     * @param {string} currency - 币种 (默认USDT)
     * @returns {Promise<Object>} 地址信息
     */
    async assignAddressToUser(userId, currency = 'USDT') {
        await this.ensureInitialized();

        try {
            // 检查用户是否已有地址
            const existingAddress = await UserWalletAddress.findByUserId(userId, currency, this.network);
            if (existingAddress) {
                console.log(`User ${userId} already has address: ${existingAddress.address}`);
                return existingAddress.toSafeObject();
            }

            // 生成新地址
            const addressInfo = await this.generateNewAddress(userId);
            
            // 保存到数据库
            const walletAddress = await UserWalletAddress.create({
                userId: userId,
                address: addressInfo.address,
                addressIndex: addressInfo.index,
                privateKeyEncrypted: this.encryptPrivateKey(addressInfo.privateKey),
                network: this.network,
                currency: currency,
                status: 'active'
            });

            console.log(`New address assigned to user ${userId}: ${addressInfo.address}`);
            
            return walletAddress.toSafeObject();

        } catch (error) {
            console.error('Error assigning address to user:', error);
            throw error;
        }
    }

    /**
     * 生成新的钱包地址
     * @param {string} userId - 用户ID
     * @returns {Promise<Object>} 地址信息
     */
    async generateNewAddress(userId) {
        try {
            await this.ensureInitialized();
            
            // 获取下一个可用的地址索引
            const addressIndex = await this.getNextAddressIndex();
            
            // 使用xPub生成地址
            if (this.masterXPub) {
                const address = await this.tatum.walletProvider
                    .use(TronWalletProvider)
                    .generateAddressFromXpub(this.masterXPub, addressIndex);
                
                // 生成对应的私钥
                const privateKey = await this.tatum.walletProvider
                    .use(TronWalletProvider)
                    .generatePrivateKeyFromMnemonic(
                        process.env.TATUM_MASTER_MNEMONIC,
                        addressIndex
                    );

                return {
                    address: address,
                    privateKey: privateKey,
                    index: addressIndex,
                    userId: userId
                };
            } else {
                // 备用方法：直接生成新的钱包
                const wallet = await this.tatum.walletProvider
                    .use(TronWalletProvider)
                    .getWallet();
                
                return {
                    address: wallet.address,
                    privateKey: wallet.privateKey,
                    index: addressIndex,
                    userId: userId
                };
            }

        } catch (error) {
            console.error('Error generating new address:', error);
            throw error;
        }
    }

    /**
     * 获取下一个可用的地址索引
     * @returns {Promise<number>} 地址索引
     */
    async getNextAddressIndex() {
        try {
            // 获取当前最大索引
            const stats = await UserWalletAddress.getStatistics(this.network);
            return stats.totalAddresses + 1;
        } catch (error) {
            console.error('Error getting next address index:', error);
            // 如果出错，返回基于时间戳的索引
            return Date.now() % 1000000;
        }
    }

    /**
     * 获取用户所有地址
     * @param {string} userId - 用户ID
     * @returns {Promise<Array>} 用户地址列表
     */
    async getUserAllAddresses(userId) {
        try {
            const addresses = await UserWalletAddress.findAllByUserId(userId);
            return addresses.map(addr => addr.toSafeObject());
        } catch (error) {
            console.error('Error getting user addresses:', error);
            throw error;
        }
    }

    /**
     * 获取用户充值地址
     * @param {string} userId - 用户ID
     * @param {string} currency - 币种
     * @returns {Promise<Object|null>} 地址信息
     */
    async getUserDepositAddress(userId, currency = 'USDT') {
        try {
            const address = await UserWalletAddress.findByUserId(userId, currency, 'TRC20');
            return address ? address.toSafeObject() : null;
        } catch (error) {
            console.error('Error getting user deposit address:', error);
            throw error;
        }
    }

}

module.exports = new UserWalletAddressService();