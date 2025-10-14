/**
 * 密钥管理系统设置脚本
 * 将现有的敏感信息迁移到统一的密钥管理系统
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const KeyManagementSystem = require('../utils/keyManagementSystem');

class KeyManagementSetup {
    constructor() {
        this.kms = new KeyManagementSystem();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.secureDir = '/Users/mason1236/0930/secure';
    }

    /**
     * 主设置流程
     */
    async setup() {
        try {
            console.log('🔐 密钥管理系统设置向导');
            console.log('================================');
            
            // 初始化密钥管理系统
            await this.kms.initialize();
            
            // 获取主密码
            const masterPassword = await this.getMasterPassword();
            
            // 验证主密码
            await this.verifyMasterPassword(masterPassword);
            
            // 迁移现有密钥
            await this.migrateExistingKeys(masterPassword);
            
            // 设置环境变量密钥
            await this.setupEnvironmentKeys(masterPassword);
            
            // 生成访问配置
            await this.generateAccessConfig();
            
            // 测试系统
            await this.testSystem(masterPassword);
            
            console.log('\n✅ 密钥管理系统设置完成！');
            console.log('🔒 所有敏感信息已安全存储');
            console.log('📋 请查看生成的访问配置文件');
            
        } catch (error) {
            console.error('❌ 设置失败:', error.message);
            throw error;
        } finally {
            this.rl.close();
        }
    }

    /**
     * 获取主密码
     */
    async getMasterPassword() {
        const passwordFile = path.join(this.secureDir, 'master-password.txt');
        
        if (fs.existsSync(passwordFile)) {
            console.log('📁 发现现有主密码文件');
            const useExisting = await this.askQuestion('是否使用现有主密码？(y/n): ');
            
            if (useExisting.toLowerCase() === 'y') {
                return fs.readFileSync(passwordFile, 'utf8').trim();
            }
        }
        
        const password = await this.askQuestion('请输入主密码: ', true);
        const confirmPassword = await this.askQuestion('请确认主密码: ', true);
        
        if (password !== confirmPassword) {
            throw new Error('密码确认不匹配');
        }
        
        return password;
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
        
        const migrations = [
            {
                type: this.kms.keyTypes.MASTER_MNEMONIC,
                description: '主钱包助记词',
                source: 'encrypted_file',
                migrated: true // 已经加密存储
            }
        ];
        
        for (const migration of migrations) {
            if (migration.migrated) {
                console.log(`✅ ${migration.description} - 已迁移`);
            } else {
                console.log(`🔄 迁移 ${migration.description}...`);
                // 这里可以添加具体的迁移逻辑
            }
        }
    }

    /**
     * 设置环境变量密钥
     */
    async setupEnvironmentKeys(masterPassword) {
        console.log('\n🔑 设置环境变量密钥...');
        
        const envKeys = [
            {
                type: this.kms.keyTypes.TATUM_API_KEY,
                description: 'Tatum API 密钥',
                envVar: 'TATUM_API_KEY'
            },
            {
                type: this.kms.keyTypes.DATABASE_PASSWORD,
                description: '数据库密码',
                envVar: 'DB_PASSWORD'
            },
            {
                type: this.kms.keyTypes.REDIS_PASSWORD,
                description: 'Redis 密码',
                envVar: 'REDIS_PASSWORD'
            },
            {
                type: this.kms.keyTypes.JWT_SECRET,
                description: 'JWT 密钥',
                envVar: 'JWT_SECRET'
            },
            {
                type: this.kms.keyTypes.WEBHOOK_SECRET,
                description: 'Webhook 密钥',
                envVar: 'WEBHOOK_SECRET'
            }
        ];
        
        for (const keyConfig of envKeys) {
            const envValue = process.env[keyConfig.envVar];
            
            if (envValue) {
                console.log(`🔄 存储 ${keyConfig.description}...`);
                await this.kms.storeKey(
                    keyConfig.type,
                    envValue,
                    masterPassword,
                    {
                        description: keyConfig.description,
                        source: 'environment_variable',
                        env_var: keyConfig.envVar
                    }
                );
                console.log(`✅ ${keyConfig.description} 已安全存储`);
            } else {
                console.log(`⚠️ ${keyConfig.description} 未在环境变量中找到`);
                
                const shouldAdd = await this.askQuestion(`是否手动添加 ${keyConfig.description}？(y/n): `);
                if (shouldAdd.toLowerCase() === 'y') {
                    const keyValue = await this.askQuestion(`请输入 ${keyConfig.description}: `, true);
                    await this.kms.storeKey(
                        keyConfig.type,
                        keyValue,
                        masterPassword,
                        {
                            description: keyConfig.description,
                            source: 'manual_input'
                        }
                    );
                    console.log(`✅ ${keyConfig.description} 已安全存储`);
                }
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
            usage: {
                initialization: 'const kms = new KeyManagementSystem(); await kms.initialize();',
                get_master_mnemonic: 'const mnemonic = await kms.getMasterMnemonic(masterPassword);',
                get_api_key: 'const apiKey = await kms.getKey(kms.keyTypes.TATUM_API_KEY, masterPassword);'
            },
            key_types: this.kms.keyTypes,
            security_notes: [
                '主密码必须安全保存，不得泄露',
                '密钥访问会被记录和审计',
                '建议定期轮换密钥',
                '生产环境中应使用硬件安全模块(HSM)'
            ],
            migration_guide: {
                from_env_vars: '使用 kms.getKey() 替代 process.env.VARIABLE_NAME',
                from_files: '使用 kms.getMasterMnemonic() 替代直接文件读取',
                caching: '系统自动缓存密钥5分钟，无需手动缓存'
            }
        };
        
        const configFile = path.join(this.secureDir, 'access-config.json');
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
            console.log('✅ 主助记词获取测试通过');
            
            // 测试密钥存储和获取
            const testKey = 'test_key_value_' + Date.now();
            const keyId = await this.kms.storeKey('TEST_KEY', testKey, masterPassword, {
                description: '测试密钥',
                test: true
            });
            
            const retrievedKey = await this.kms.getKey('TEST_KEY', masterPassword);
            
            if (retrievedKey === testKey) {
                console.log('✅ 密钥存储/获取测试通过');
            } else {
                throw new Error('密钥存储/获取测试失败');
            }
            
            // 清理测试密钥
            const testKeyFile = path.join(this.secureDir, `${keyId}.json`);
            if (fs.existsSync(testKeyFile)) {
                fs.unlinkSync(testKeyFile);
            }
            
            // 测试访问统计
            const stats = await this.kms.getAccessStats();
            console.log(`✅ 访问统计测试通过 (总访问: ${stats.total})`);
            
            console.log('✅ 所有测试通过');
            
        } catch (error) {
            console.error('❌ 系统测试失败:', error.message);
            throw error;
        }
    }

    /**
     * 询问用户输入
     */
    askQuestion(question, hidden = false) {
        return new Promise((resolve) => {
            if (hidden) {
                // 隐藏输入（简单实现）
                process.stdout.write(question);
                process.stdin.setRawMode(true);
                process.stdin.resume();
                process.stdin.setEncoding('utf8');
                
                let input = '';
                const onData = (char) => {
                    if (char === '\r' || char === '\n') {
                        process.stdin.setRawMode(false);
                        process.stdin.pause();
                        process.stdin.removeListener('data', onData);
                        process.stdout.write('\n');
                        resolve(input);
                    } else if (char === '\u0003') {
                        process.exit();
                    } else if (char === '\u007f') {
                        if (input.length > 0) {
                            input = input.slice(0, -1);
                            process.stdout.write('\b \b');
                        }
                    } else {
                        input += char;
                        process.stdout.write('*');
                    }
                };
                
                process.stdin.on('data', onData);
            } else {
                this.rl.question(question, resolve);
            }
        });
    }
}

// 执行设置
async function main() {
    const setup = new KeyManagementSetup();
    
    try {
        await setup.setup();
        process.exit(0);
    } catch (error) {
        console.error('❌ 设置失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = KeyManagementSetup;