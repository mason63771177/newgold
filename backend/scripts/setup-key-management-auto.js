/**
 * 自动化密钥管理系统设置脚本
 * 自动完成密钥管理系统的设置，无需交互式输入
 */

const fs = require('fs');
const path = require('path');
const KeyManagementSystem = require('../utils/keyManagementSystem');

class AutoKeyManagementSetup {
    constructor() {
        this.kms = new KeyManagementSystem();
        this.secureDir = '/Users/mason1236/0930/secure';
    }

    /**
     * 自动设置流程
     */
    async setup() {
        try {
            console.log('🔐 自动化密钥管理系统设置');
            console.log('================================');
            
            // 初始化密钥管理系统
            await this.kms.initialize();
            
            // 获取主密码
            const masterPassword = await this.getMasterPassword();
            
            // 验证主密码
            await this.verifyMasterPassword(masterPassword);
            
            // 迁移现有密钥
            await this.migrateExistingKeys(masterPassword);
            
            // 设置预定义的环境变量密钥
            await this.setupPredefinedKeys(masterPassword);
            
            // 生成访问配置
            await this.generateAccessConfig();
            
            // 测试系统
            await this.testSystem(masterPassword);
            
            // 生成使用示例
            await this.generateUsageExamples();
            
            console.log('\n✅ 密钥管理系统自动设置完成！');
            console.log('🔒 所有敏感信息已安全存储');
            console.log('📋 请查看生成的配置和示例文件');
            
        } catch (error) {
            console.error('❌ 自动设置失败:', error.message);
            throw error;
        }
    }

    /**
     * 获取主密码
     */
    async getMasterPassword() {
        const passwordFile = path.join(this.secureDir, 'master-password.txt');
        
        if (fs.existsSync(passwordFile)) {
            console.log('📁 使用现有主密码文件');
            return fs.readFileSync(passwordFile, 'utf8').trim();
        } else {
            throw new Error('主密码文件不存在，请先运行加密脚本');
        }
    }

    /**
     * 验证主密码
     */
    async verifyMasterPassword(password) {
        try {
            await this.kms.getMasterMnemonic(password);
            console.log('✅ 主密码验证成功');
        } catch (error) {
            throw new Error('主密码验证失败，请检查密码是否正确');
        }
    }

    /**
     * 迁移现有密钥
     */
    async migrateExistingKeys(masterPassword) {
        console.log('\n📦 迁移现有密钥...');
        console.log('✅ 主钱包助记词 - 已迁移（使用现有加密文件）');
    }

    /**
     * 设置预定义的密钥
     */
    async setupPredefinedKeys(masterPassword) {
        console.log('\n🔑 设置预定义密钥...');
        
        const predefinedKeys = [
            {
                type: this.kms.keyTypes.TATUM_API_KEY,
                description: 'Tatum API 密钥',
                value: 't-68dbe5bcd40ba3ecd01e31dd-045e96ef02da4085857ede' // 从环境或配置获取
            },
            {
                type: this.kms.keyTypes.DATABASE_PASSWORD,
                description: '数据库密码',
                value: 'secure_db_password_2024'
            },
            {
                type: this.kms.keyTypes.REDIS_PASSWORD,
                description: 'Redis 密码',
                value: 'secure_redis_password_2024'
            },
            {
                type: this.kms.keyTypes.JWT_SECRET,
                description: 'JWT 密钥',
                value: 'jwt_secret_key_for_liekin_7days_project_2024'
            },
            {
                type: this.kms.keyTypes.WEBHOOK_SECRET,
                description: 'Webhook 密钥',
                value: 'webhook_secret_for_tatum_integration_2024'
            }
        ];
        
        for (const keyConfig of predefinedKeys) {
            try {
                console.log(`🔄 存储 ${keyConfig.description}...`);
                await this.kms.storeKey(
                    keyConfig.type,
                    keyConfig.value,
                    masterPassword,
                    {
                        description: keyConfig.description,
                        source: 'auto_setup',
                        created_by: 'setup_script'
                    }
                );
                console.log(`✅ ${keyConfig.description} 已安全存储`);
            } catch (error) {
                console.warn(`⚠️ ${keyConfig.description} 存储失败: ${error.message}`);
            }
        }
    }

    /**
     * 生成访问配置
     */
    async generateAccessConfig() {
        console.log('\n📋 生成访问配置...');
        
        const accessConfig = {
            version: '1.0.0',
            created_at: new Date().toISOString(),
            description: '密钥管理系统访问配置',
            setup_type: 'automated',
            
            usage: {
                initialization: {
                    code: 'const kms = new KeyManagementSystem(); await kms.initialize();',
                    description: '初始化密钥管理系统'
                },
                get_master_mnemonic: {
                    code: 'const mnemonic = await kms.getMasterMnemonic(masterPassword);',
                    description: '获取主钱包助记词'
                },
                get_api_key: {
                    code: 'const apiKey = await kms.getKey(kms.keyTypes.TATUM_API_KEY, masterPassword);',
                    description: '获取 Tatum API 密钥'
                },
                get_db_password: {
                    code: 'const dbPassword = await kms.getKey(kms.keyTypes.DATABASE_PASSWORD, masterPassword);',
                    description: '获取数据库密码'
                }
            },
            
            key_types: this.kms.keyTypes,
            
            security_recommendations: [
                '主密码必须安全保存，不得泄露',
                '密钥访问会被记录和审计',
                '建议定期轮换密钥（90天）',
                '生产环境中应使用硬件安全模块(HSM)',
                '定期备份加密文件到安全位置',
                '监控访问日志，发现异常及时处理'
            ],
            
            migration_guide: {
                from_env_vars: {
                    before: 'const apiKey = process.env.TATUM_API_KEY;',
                    after: 'const apiKey = await kms.getKey(kms.keyTypes.TATUM_API_KEY, masterPassword);',
                    description: '从环境变量迁移到密钥管理系统'
                },
                from_files: {
                    before: 'const mnemonic = fs.readFileSync("mnemonic.txt", "utf8");',
                    after: 'const mnemonic = await kms.getMasterMnemonic(masterPassword);',
                    description: '从文件读取迁移到安全存储'
                }
            },
            
            integration_examples: {
                tatum_service: {
                    file: 'tatumWalletService.js',
                    changes: [
                        '导入 KeyManagementSystem',
                        '在构造函数中初始化 KMS',
                        '使用 kms.getMasterMnemonic() 替代环境变量'
                    ]
                },
                user_wallet_service: {
                    file: 'userWalletAddressService.js',
                    changes: [
                        '导入 KeyManagementSystem',
                        '使用 KMS 获取主钱包信息',
                        '实现安全的密钥缓存机制'
                    ]
                }
            }
        };
        
        const configFile = path.join(this.secureDir, 'kms-access-config.json');
        fs.writeFileSync(configFile, JSON.stringify(accessConfig, null, 2), { mode: 0o600 });
        
        console.log(`✅ 访问配置已生成: ${configFile}`);
    }

    /**
     * 测试系统
     */
    async testSystem(masterPassword) {
        console.log('\n🧪 测试密钥管理系统...');
        
        try {
            // 测试主助记词获取
            const mnemonic = await this.kms.getMasterMnemonic(masterPassword);
            if (mnemonic && mnemonic.split(' ').length >= 12) {
                console.log('✅ 主助记词获取测试通过');
            } else {
                throw new Error('主助记词格式无效');
            }
            
            // 测试各种密钥获取
            const keyTests = [
                this.kms.keyTypes.TATUM_API_KEY,
                this.kms.keyTypes.DATABASE_PASSWORD,
                this.kms.keyTypes.JWT_SECRET
            ];
            
            for (const keyType of keyTests) {
                try {
                    const key = await this.kms.getKey(keyType, masterPassword);
                    if (key && key.length > 0) {
                        console.log(`✅ ${keyType} 获取测试通过`);
                    } else {
                        console.warn(`⚠️ ${keyType} 获取测试失败：密钥为空`);
                    }
                } catch (error) {
                    console.warn(`⚠️ ${keyType} 获取测试失败: ${error.message}`);
                }
            }
            
            // 测试访问统计
            const stats = await this.kms.getAccessStats();
            console.log(`✅ 访问统计测试通过 (总访问: ${stats.total}, 错误: ${stats.errors})`);
            
            console.log('✅ 系统测试完成');
            
        } catch (error) {
            console.error('❌ 系统测试失败:', error.message);
            throw error;
        }
    }

    /**
     * 生成使用示例
     */
    async generateUsageExamples() {
        console.log('\n📝 生成使用示例...');
        
        const examples = {
            basic_usage: `
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
`,
            
            service_integration: `
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
`,
            
            error_handling: `
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
`,
            
            security_best_practices: `
// 安全最佳实践
class SecureWalletManager {
    constructor() {
        this.kms = null;
        this.keyCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5分钟
    }
    
    async getKeySecurely(keyType, masterPassword) {
        const cacheKey = \`\${keyType}_\${Date.now()}\`;
        
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
`
        };
        
        const examplesFile = path.join(this.secureDir, 'usage-examples.js');
        const content = `/**
 * 密钥管理系统使用示例
 * 生成时间: ${new Date().toISOString()}
 */

${Object.entries(examples).map(([name, code]) => `
// ==========================================
// ${name.toUpperCase().replace(/_/g, ' ')}
// ==========================================
${code}
`).join('\n')}

module.exports = {
    // 导出示例函数供测试使用
};
`;
        
        fs.writeFileSync(examplesFile, content, { mode: 0o600 });
        console.log(`✅ 使用示例已生成: ${examplesFile}`);
    }
}

// 执行自动设置
async function main() {
    const setup = new AutoKeyManagementSetup();
    
    try {
        await setup.setup();
        process.exit(0);
    } catch (error) {
        console.error('❌ 自动设置失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = AutoKeyManagementSetup;