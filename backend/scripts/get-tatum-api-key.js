/**
 * Tatum API 密钥获取指导脚本
 * 提供获取和配置Tatum API密钥的详细步骤
 */

const fs = require('fs');
const path = require('path');

/**
 * API密钥获取指导
 */
class TatumApiKeyGuide {
    constructor() {
        this.envPath = path.join(__dirname, '../.env');
    }

    /**
     * 显示获取API密钥的步骤
     */
    showApiKeySteps() {
        console.log('🔑 Tatum API 密钥获取指南\n');
        console.log('=' * 50 + '\n');

        console.log('📋 步骤 1: 注册Tatum账户');
        console.log('   1. 访问: https://dashboard.tatum.io/');
        console.log('   2. 点击 "Sign Up" 注册新账户');
        console.log('   3. 验证邮箱并完成注册\n');

        console.log('📋 步骤 2: 创建新项目');
        console.log('   1. 登录后点击 "Create New Project"');
        console.log('   2. 选择项目类型: "Blockchain Development"');
        console.log('   3. 输入项目名称: "Gold7-Wallet"');
        console.log('   4. 选择网络: "TRON" (测试网和主网都支持)\n');

        console.log('📋 步骤 3: 获取API密钥');
        console.log('   1. 进入项目仪表板');
        console.log('   2. 找到 "API Keys" 部分');
        console.log('   3. 复制 "API Key" (通常以 "t-" 开头)');
        console.log('   4. 注意区分测试网和主网密钥\n');

        console.log('📋 步骤 4: 配置到项目');
        console.log('   1. 复制获得的API密钥');
        console.log('   2. 运行: node scripts/get-tatum-api-key.js set <your_api_key>');
        console.log('   3. 或手动编辑 .env 文件\n');

        console.log('💡 免费额度信息:');
        console.log('   - 测试网: 完全免费');
        console.log('   - 主网: 每月有一定免费额度');
        console.log('   - 超出后按使用量计费\n');

        console.log('🔒 安全提示:');
        console.log('   - 不要将API密钥提交到版本控制');
        console.log('   - 定期轮换API密钥');
        console.log('   - 为不同环境使用不同密钥\n');
    }

    /**
     * 设置API密钥到.env文件
     */
    setApiKey(apiKey) {
        try {
            console.log('🔧 设置API密钥到 .env 文件...\n');

            // 验证API密钥格式
            if (!apiKey || apiKey.length < 10) {
                throw new Error('API密钥格式无效，请检查输入');
            }

            // 读取现有的.env文件
            let envContent = '';
            if (fs.existsSync(this.envPath)) {
                envContent = fs.readFileSync(this.envPath, 'utf8');
            }

            // 更新或添加TATUM_API_KEY
            const lines = envContent.split('\n');
            let updated = false;

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('TATUM_API_KEY=')) {
                    lines[i] = `TATUM_API_KEY=${apiKey}`;
                    updated = true;
                    break;
                }
            }

            if (!updated) {
                // 如果没找到，添加到Tatum配置部分
                const tatumSectionIndex = lines.findIndex(line => line.includes('# Tatum配置'));
                if (tatumSectionIndex !== -1) {
                    lines.splice(tatumSectionIndex + 1, 0, `TATUM_API_KEY=${apiKey}`);
                } else {
                    lines.push(`TATUM_API_KEY=${apiKey}`);
                }
            }

            // 写回文件
            fs.writeFileSync(this.envPath, lines.join('\n'));

            console.log('✅ API密钥设置成功！');
            console.log(`   密钥: ${apiKey.substring(0, 10)}...`);
            console.log(`   文件: ${this.envPath}\n`);

            console.log('🎯 下一步:');
            console.log('   运行测试: node scripts/test-tatum-connection.js\n');

            return true;

        } catch (error) {
            console.error('❌ 设置API密钥失败:', error.message);
            return false;
        }
    }

    /**
     * 验证API密钥格式
     */
    validateApiKey(apiKey) {
        console.log('🔍 验证API密钥格式...\n');

        const checks = [
            {
                name: '长度检查',
                test: apiKey && apiKey.length >= 10,
                message: 'API密钥长度应该至少10个字符'
            },
            {
                name: '格式检查',
                test: apiKey && (apiKey.startsWith('t-') || apiKey.startsWith('tatum-')),
                message: 'Tatum API密钥通常以 "t-" 或 "tatum-" 开头'
            },
            {
                name: '字符检查',
                test: apiKey && /^[a-zA-Z0-9\-_]+$/.test(apiKey),
                message: 'API密钥应该只包含字母、数字、连字符和下划线'
            }
        ];

        let allPassed = true;

        checks.forEach(check => {
            const status = check.test ? '✅' : '⚠️';
            console.log(`${status} ${check.name}`);
            if (!check.test) {
                console.log(`   ${check.message}`);
                allPassed = false;
            }
        });

        console.log('');
        return allPassed;
    }

    /**
     * 显示当前配置状态
     */
    showCurrentConfig() {
        console.log('📊 当前配置状态\n');

        try {
            if (!fs.existsSync(this.envPath)) {
                console.log('❌ .env 文件不存在');
                return;
            }

            const envContent = fs.readFileSync(this.envPath, 'utf8');
            const lines = envContent.split('\n');

            const tatumConfigs = lines.filter(line => 
                line.startsWith('TATUM_') && line.includes('=')
            );

            if (tatumConfigs.length === 0) {
                console.log('❌ 未找到Tatum配置');
                return;
            }

            console.log('Tatum配置项:');
            tatumConfigs.forEach(config => {
                const [key, value] = config.split('=');
                const displayValue = key.includes('API_KEY') || key.includes('MNEMONIC')
                    ? (value && value !== 'your_tatum_api_key_here' ? `${value.substring(0, 10)}...` : '未设置')
                    : value;
                
                const status = value && value !== 'your_tatum_api_key_here' ? '✅' : '❌';
                console.log(`   ${status} ${key}: ${displayValue}`);
            });

        } catch (error) {
            console.error('❌ 读取配置失败:', error.message);
        }
    }
}

/**
 * 主函数
 */
function main() {
    const guide = new TatumApiKeyGuide();
    const args = process.argv.slice(2);

    if (args.length === 0) {
        // 显示指南
        guide.showApiKeySteps();
        guide.showCurrentConfig();
        
        console.log('\n💡 使用方法:');
        console.log('   查看指南: node scripts/get-tatum-api-key.js');
        console.log('   设置密钥: node scripts/get-tatum-api-key.js set <your_api_key>');
        console.log('   验证密钥: node scripts/get-tatum-api-key.js validate <your_api_key>');
        console.log('   查看配置: node scripts/get-tatum-api-key.js status');

    } else if (args[0] === 'set' && args[1]) {
        // 设置API密钥
        const apiKey = args[1];
        if (guide.validateApiKey(apiKey)) {
            guide.setApiKey(apiKey);
        } else {
            console.log('❌ API密钥格式验证失败，请检查后重试');
        }

    } else if (args[0] === 'validate' && args[1]) {
        // 验证API密钥
        guide.validateApiKey(args[1]);

    } else if (args[0] === 'status') {
        // 显示配置状态
        guide.showCurrentConfig();

    } else {
        console.log('❌ 无效的参数');
        console.log('使用方法: node scripts/get-tatum-api-key.js [set|validate|status] [api_key]');
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = TatumApiKeyGuide;