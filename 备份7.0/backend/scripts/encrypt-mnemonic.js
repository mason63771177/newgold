const SecureStorageManager = require('../utils/secureStorage');
const path = require('path');
const fs = require('fs');

/**
 * 助记词加密脚本
 * 将现有的明文助记词加密存储，提升安全性
 */

async function encryptMasterWalletMnemonic() {
    console.log('🔐 开始助记词加密过程...');
    
    try {
        // 初始化安全存储管理器
        const secureStorage = new SecureStorageManager();
        
        // 当前的助记词 (从环境变量或数据库获取)
        const currentMnemonic = "ripple scan offer arctic rubber leave tired slender rice olive grab excite noble impose obvious decade achieve outside detect act extend melody help alert";
        
        console.log('📝 当前助记词长度:', currentMnemonic.split(' ').length, '个单词');
        
        // 生成安全的主密码
        const masterPassword = secureStorage.generateSecurePassword(64);
        console.log('🔑 生成主密码长度:', masterPassword.length, '字符');
        
        // 加密助记词
        console.log('🔒 正在加密助记词...');
        const encryptedData = secureStorage.encryptMnemonic(currentMnemonic, masterPassword);
        
        // 创建密码哈希 (用于验证)
        const passwordHash = secureStorage.createPasswordHash(masterPassword);
        
        // 准备完整的安全配置
        const secureConfig = {
            version: '1.0.0',
            created: new Date().toISOString(),
            description: '裂金7日项目 - 主钱包助记词安全存储',
            encryptedMnemonic: encryptedData,
            passwordHash: passwordHash,
            security: {
                algorithm: 'aes-256-gcm',
                keyDerivation: 'pbkdf2',
                iterations: 100000,
                keyLength: 256,
                notes: '使用AES-256-GCM加密，PBKDF2密钥派生，10万次迭代'
            }
        };
        
        // 保存加密配置到安全目录
        const secureDir = path.join(__dirname, '../../secure');
        const configPath = path.join(secureDir, 'master-wallet-encrypted.json');
        
        secureStorage.saveEncryptedData(secureConfig, configPath);
        
        // 保存主密码到单独的文件 (临时，用于测试)
        const passwordPath = path.join(secureDir, 'master-password.txt');
        fs.writeFileSync(passwordPath, masterPassword);
        fs.chmodSync(passwordPath, 0o600);
        
        console.log('✅ 助记词加密完成!');
        console.log('📁 加密配置文件:', configPath);
        console.log('🔑 主密码文件:', passwordPath);
        
        // 验证加密结果
        console.log('\n🔍 验证加密结果...');
        
        // 加载并解密
        const loadedConfig = secureStorage.loadEncryptedData(configPath);
        const decryptedMnemonic = secureStorage.decryptMnemonic(loadedConfig.encryptedMnemonic, masterPassword);
        
        // 验证解密结果
        if (decryptedMnemonic === currentMnemonic) {
            console.log('✅ 加密/解密验证成功!');
            console.log('📊 解密后助记词长度:', decryptedMnemonic.split(' ').length, '个单词');
        } else {
            console.error('❌ 加密/解密验证失败!');
            return false;
        }
        
        // 验证密码哈希
        const passwordValid = secureStorage.verifyPassword(masterPassword, passwordHash);
        if (passwordValid) {
            console.log('✅ 密码哈希验证成功!');
        } else {
            console.error('❌ 密码哈希验证失败!');
            return false;
        }
        
        console.log('\n📋 下一步操作建议:');
        console.log('1. 更新环境变量配置，使用加密存储');
        console.log('2. 更新相关服务，使用新的安全存储模块');
        console.log('3. 测试所有钱包功能确保正常工作');
        console.log('4. 清理明文助记词的残留引用');
        console.log('5. 安全备份主密码 (离线存储)');
        
        console.log('\n⚠️  安全提醒:');
        console.log('- 主密码文件仅用于测试，生产环境请安全存储');
        console.log('- 定期更换主密码并重新加密');
        console.log('- 建立多重备份机制');
        
        return true;
        
    } catch (error) {
        console.error('❌ 助记词加密过程失败:', error.message);
        console.error('错误详情:', error);
        return false;
    }
}

// 执行加密过程
if (require.main === module) {
    encryptMasterWalletMnemonic()
        .then(success => {
            if (success) {
                console.log('\n🎉 助记词加密脚本执行成功!');
                process.exit(0);
            } else {
                console.log('\n💥 助记词加密脚本执行失败!');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 脚本执行异常:', error);
            process.exit(1);
        });
}

module.exports = { encryptMasterWalletMnemonic };