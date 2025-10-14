/**
 * 更新服务文件以使用加密存储模块
 * 替换直接从环境变量读取助记词的方式
 */

const fs = require('fs');
const path = require('path');
const SecureStorageManager = require('../utils/secureStorage');

class ServiceUpdater {
    constructor() {
        this.secureStorage = new SecureStorageManager();
        this.servicesToUpdate = [
            'services/tatumWalletService.js',
            'services/userWalletAddressService.js',
            'services/tatumBasicWalletService.js',
            'services/tatum.js'
        ];
        this.backupDir = path.join(__dirname, '../backups/service-updates');
    }

    /**
     * 创建备份目录
     */
    async createBackupDir() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
            console.log(`✅ 创建备份目录: ${this.backupDir}`);
        }
    }

    /**
     * 备份原始文件
     */
    async backupOriginalFiles() {
        console.log('\n📦 备份原始服务文件...');
        
        for (const serviceFile of this.servicesToUpdate) {
            const sourcePath = path.join(__dirname, '..', serviceFile);
            const backupPath = path.join(this.backupDir, `${path.basename(serviceFile)}.backup`);
            
            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, backupPath);
                console.log(`   ✅ 备份: ${serviceFile} -> ${backupPath}`);
            } else {
                console.log(`   ⚠️ 文件不存在: ${serviceFile}`);
            }
        }
    }

    /**
     * 更新 tatumWalletService.js
     */
    async updateTatumWalletService() {
        const filePath = path.join(__dirname, '../services/tatumWalletService.js');
        
        if (!fs.existsSync(filePath)) {
            console.log('⚠️ tatumWalletService.js 不存在，跳过更新');
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        
        // 添加 SecureStorageManager 导入
        if (!content.includes('SecureStorageManager')) {
            const importLine = "const SecureStorageManager = require('../utils/secureStorage');\n";
            content = content.replace(
                "const feeProfitService = require('./feeProfitService');",
                `const feeProfitService = require('./feeProfitService');\n${importLine}`
            );
        }

        // 更新构造函数
        content = content.replace(
            'this.masterWalletMnemonic = process.env.TATUM_MASTER_WALLET_MNEMONIC;',
            `this.secureStorage = new SecureStorageManager();
        this.masterWalletMnemonic = null; // 将从加密存储加载`
        );

        // 添加加载助记词的方法
        const loadMnemonicMethod = `
    /**
     * 从加密存储加载助记词
     */
    async loadMasterWalletMnemonic() {
        try {
            if (!this.masterWalletMnemonic) {
                const encryptedConfigPath = '/Users/mason1236/0930/secure/master-wallet-encrypted.json';
                const masterPasswordPath = '/Users/mason1236/0930/secure/master-password.txt';
                
                if (!fs.existsSync(encryptedConfigPath) || !fs.existsSync(masterPasswordPath)) {
                    throw new Error('加密配置文件或主密码文件不存在');
                }
                
                const masterPassword = fs.readFileSync(masterPasswordPath, 'utf8').trim();
                this.masterWalletMnemonic = await this.secureStorage.loadEncryptedMnemonic(
                    encryptedConfigPath, 
                    masterPassword
                );
                console.log('✅ 成功从加密存储加载助记词');
            }
            return this.masterWalletMnemonic;
        } catch (error) {
            console.error('❌ 加载助记词失败:', error.message);
            throw error;
        }
    }
`;

        // 在 initialize 方法之前插入新方法
        content = content.replace(
            '    /**\n     * 初始化Tatum SDK\n     */',
            `${loadMnemonicMethod}
    /**
     * 初始化Tatum SDK
     */`
        );

        // 更新 initialize 方法，添加助记词加载
        content = content.replace(
            'async initialize() {\n        try {',
            `async initialize() {
        try {
            // 加载加密的助记词
            await this.loadMasterWalletMnemonic();`
        );

        // 添加 fs 导入
        if (!content.includes("const fs = require('fs');")) {
            content = content.replace(
                "const { TatumSDK, Network, Tron } = require('@tatumio/tatum');",
                `const { TatumSDK, Network, Tron } = require('@tatumio/tatum');
const fs = require('fs');`
            );
        }

        fs.writeFileSync(filePath, content);
        console.log('✅ 更新 tatumWalletService.js 完成');
    }

    /**
     * 更新 userWalletAddressService.js
     */
    async updateUserWalletAddressService() {
        const filePath = path.join(__dirname, '../services/userWalletAddressService.js');
        
        if (!fs.existsSync(filePath)) {
            console.log('⚠️ userWalletAddressService.js 不存在，跳过更新');
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        
        // 添加 SecureStorageManager 和 fs 导入
        if (!content.includes('SecureStorageManager')) {
            content = content.replace(
                "const UserWalletAddress = require('../models/UserWalletAddress');",
                `const UserWalletAddress = require('../models/UserWalletAddress');
const SecureStorageManager = require('../utils/secureStorage');
const fs = require('fs');`
            );
        }

        // 更新构造函数
        content = content.replace(
            'this.masterPrivateKey = process.env.TATUM_MASTER_PRIVATE_KEY;',
            `this.secureStorage = new SecureStorageManager();
        this.masterMnemonic = null; // 将从加密存储加载`
        );

        // 添加加载助记词的方法
        const loadMnemonicMethod = `
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
`;

        // 在 initialize 方法之前插入新方法
        content = content.replace(
            '    /**\n     * 初始化Tatum SDK\n     */',
            `${loadMnemonicMethod}
    /**
     * 初始化Tatum SDK
     */`
        );

        // 更新 ensureInitialized 方法
        content = content.replace(
            'async ensureInitialized() {\n        if (!this.tatum) {\n            await this.initialize();\n        }\n    }',
            `async ensureInitialized() {
        if (!this.tatum) {
            await this.initialize();
        }
        if (!this.masterMnemonic) {
            await this.loadMasterMnemonic();
        }
    }`
        );

        fs.writeFileSync(filePath, content);
        console.log('✅ 更新 userWalletAddressService.js 完成');
    }

    /**
     * 更新 tatumBasicWalletService.js
     */
    async updateTatumBasicWalletService() {
        const filePath = path.join(__dirname, '../services/tatumBasicWalletService.js');
        
        if (!fs.existsSync(filePath)) {
            console.log('⚠️ tatumBasicWalletService.js 不存在，跳过更新');
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        
        // 添加 SecureStorageManager 和 fs 导入
        if (!content.includes('SecureStorageManager')) {
            content = content.replace(
                "const { pool } = require('../config/database');",
                `const { pool } = require('../config/database');
const SecureStorageManager = require('../utils/secureStorage');
const fs = require('fs');`
            );
        }

        // 更新构造函数
        content = content.replace(
            'this.api = axios.create({',
            `this.secureStorage = new SecureStorageManager();
        this.masterMnemonic = null;
        
        this.api = axios.create({`
        );

        // 添加加载助记词的方法
        const loadMnemonicMethod = `
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
`;

        // 在 initialize 方法之前插入新方法
        content = content.replace(
            '    /**\n     * 初始化服务\n     */',
            `${loadMnemonicMethod}
    /**
     * 初始化服务
     */`
        );

        // 更新 initialize 方法
        content = content.replace(
            'async initialize() {\n        console.log(\'🚀 初始化Tatum基础钱包服务...\');',
            `async initialize() {
        console.log('🚀 初始化Tatum基础钱包服务...');
        
        // 加载加密的助记词
        await this.loadMasterMnemonic();`
        );

        fs.writeFileSync(filePath, content);
        console.log('✅ 更新 tatumBasicWalletService.js 完成');
    }

    /**
     * 执行所有更新
     */
    async updateAllServices() {
        try {
            console.log('🔄 开始更新服务文件以使用加密存储...\n');
            
            // 创建备份目录
            await this.createBackupDir();
            
            // 备份原始文件
            await this.backupOriginalFiles();
            
            console.log('\n🔧 更新服务文件...');
            
            // 更新各个服务文件
            await this.updateTatumWalletService();
            await this.updateUserWalletAddressService();
            await this.updateTatumBasicWalletService();
            
            console.log('\n✅ 所有服务文件更新完成！');
            console.log('\n📋 更新摘要:');
            console.log('   - 添加了 SecureStorageManager 导入');
            console.log('   - 替换了直接读取环境变量的助记词');
            console.log('   - 添加了从加密存储加载助记词的方法');
            console.log('   - 更新了初始化流程');
            console.log(`   - 原始文件已备份到: ${this.backupDir}`);
            
            console.log('\n🔐 安全提醒:');
            console.log('   - 确保 /Users/mason1236/0930/secure/ 目录权限正确');
            console.log('   - 定期备份加密配置文件');
            console.log('   - 保护主密码文件的安全');
            
        } catch (error) {
            console.error('❌ 更新服务文件失败:', error.message);
            throw error;
        }
    }
}

// 执行更新
if (require.main === module) {
    const updater = new ServiceUpdater();
    updater.updateAllServices()
        .then(() => {
            console.log('\n🎉 服务文件更新成功完成！');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 更新失败:', error.message);
            process.exit(1);
        });
}

module.exports = ServiceUpdater;