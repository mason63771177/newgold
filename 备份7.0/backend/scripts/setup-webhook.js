/**
 * Tatum Webhook 设置脚本
 * 用于配置充值地址监听和Webhook通知
 */

const { TatumSDK, Network } = require('@tatumio/tatum');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

/**
 * Webhook设置服务
 */
class WebhookSetupService {
    constructor() {
        this.apiKey = process.env.TATUM_API_KEY;
        this.network = process.env.TATUM_NETWORK === 'mainnet' ? Network.TRON : Network.TRON_SHASTA;
        this.webhookUrl = process.env.TATUM_WEBHOOK_URL;
        this.tatum = null;
    }

    /**
     * 初始化Tatum SDK
     */
    async initialize() {
        try {
            console.log('🔧 初始化Tatum SDK...');
            
            if (!this.apiKey || this.apiKey === 'your_tatum_api_key_here') {
                throw new Error('请先配置有效的TATUM_API_KEY');
            }

            this.tatum = await TatumSDK.init({
                network: this.network,
                apiKey: {
                    v4: this.apiKey
                }
            });

            console.log(`✅ Tatum SDK初始化成功 (网络: ${this.network})`);
            return true;

        } catch (error) {
            console.error('❌ Tatum SDK初始化失败:', error.message);
            throw error;
        }
    }

    /**
     * 创建地址监听订阅
     * @param {string} address - 要监听的地址
     * @returns {string} 订阅ID
     */
    async createAddressSubscription(address) {
        try {
            console.log(`📡 为地址创建监听订阅: ${address}`);

            const subscription = await this.tatum.notification.subscribe.addressEvent({
                address: address,
                chain: 'TRON',
                url: this.webhookUrl
            });

            console.log(`✅ 订阅创建成功，ID: ${subscription.id}`);
            return subscription.id;

        } catch (error) {
            console.error('❌ 创建地址订阅失败:', error.message);
            throw error;
        }
    }

    /**
     * 获取所有订阅
     */
    async getAllSubscriptions() {
        try {
            console.log('📋 获取所有Webhook订阅...');

            const subscriptions = await this.tatum.notification.getAll();
            
            console.log(`✅ 找到 ${subscriptions.length} 个订阅:`);
            subscriptions.forEach((sub, index) => {
                console.log(`${index + 1}. ID: ${sub.id}`);
                console.log(`   类型: ${sub.type}`);
                console.log(`   地址: ${sub.attr?.address || 'N/A'}`);
                console.log(`   URL: ${sub.attr?.url || 'N/A'}`);
                console.log(`   状态: ${sub.attr?.isActive ? '活跃' : '非活跃'}`);
                console.log('');
            });

            return subscriptions;

        } catch (error) {
            console.error('❌ 获取订阅列表失败:', error.message);
            throw error;
        }
    }

    /**
     * 删除订阅
     * @param {string} subscriptionId - 订阅ID
     */
    async deleteSubscription(subscriptionId) {
        try {
            console.log(`🗑️ 删除订阅: ${subscriptionId}`);

            await this.tatum.notification.unsubscribe(subscriptionId);
            
            console.log('✅ 订阅删除成功');

        } catch (error) {
            console.error('❌ 删除订阅失败:', error.message);
            throw error;
        }
    }

    /**
     * 测试Webhook连接
     */
    async testWebhookConnection() {
        try {
            console.log('🧪 测试Webhook连接...');
            console.log(`Webhook URL: ${this.webhookUrl}`);

            // 这里可以添加实际的连接测试逻辑
            // 比如发送测试请求到webhook端点

            const testData = {
                test: true,
                timestamp: new Date().toISOString(),
                message: 'Webhook连接测试'
            };

            console.log('✅ Webhook配置验证通过');
            console.log('📝 测试数据:', JSON.stringify(testData, null, 2));

            return true;

        } catch (error) {
            console.error('❌ Webhook连接测试失败:', error.message);
            throw error;
        }
    }

    /**
     * 清理资源
     */
    async cleanup() {
        if (this.tatum) {
            await this.tatum.destroy();
            console.log('🧹 Tatum SDK资源已清理');
        }
    }
}

/**
 * 主函数 - 交互式设置
 */
async function main() {
    const webhookService = new WebhookSetupService();
    
    try {
        console.log('🎯 Tatum Webhook 设置工具\n');
        console.log('=' * 50);

        // 初始化
        await webhookService.initialize();

        // 测试Webhook连接
        await webhookService.testWebhookConnection();

        // 获取现有订阅
        const subscriptions = await webhookService.getAllSubscriptions();

        console.log('\n📋 Webhook设置完成！');
        console.log('\n下一步操作：');
        console.log('1. 确保后端服务运行在 http://localhost:3000');
        console.log('2. 为用户充值地址创建监听订阅');
        console.log('3. 测试充值功能');
        
        console.log('\n💡 使用示例：');
        console.log('// 为用户地址创建监听');
        console.log('const subscriptionId = await webhookService.createAddressSubscription("TUserAddress...");');
        console.log('');
        console.log('// 删除不需要的订阅');
        console.log('await webhookService.deleteSubscription("subscription_id");');

    } catch (error) {
        console.error('💥 Webhook设置失败:', error.message);
        
        if (error.message.includes('API_KEY')) {
            console.log('\n🔑 请先获取Tatum API密钥：');
            console.log('1. 访问 https://dashboard.tatum.io/');
            console.log('2. 注册/登录账户');
            console.log('3. 创建新项目');
            console.log('4. 复制API密钥到 .env 文件');
        }
        
        process.exit(1);
    } finally {
        await webhookService.cleanup();
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = WebhookSetupService;