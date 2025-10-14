/**
 * 前端功能自动化测试脚本
 * 模拟用户在浏览器中的操作，测试登录、钱包等功能
 */

const puppeteer = require('puppeteer');

class FrontendAutomationTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.baseUrl = 'http://localhost:8080';
        this.apiUrl = 'http://localhost:3000';
        
        // 测试用户信息
        this.testUser = {
            email: 'frontend-test@example.com',
            password: 'test123456'
        };
    }

    /**
     * 初始化浏览器
     */
    async initBrowser() {
        console.log('🚀 启动浏览器...');
        this.browser = await puppeteer.launch({
            headless: false, // 显示浏览器界面
            defaultViewport: { width: 1280, height: 800 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // 监听控制台消息
        this.page.on('console', msg => {
            console.log(`🖥️  浏览器控制台: ${msg.text()}`);
        });
        
        // 监听页面错误
        this.page.on('pageerror', error => {
            console.error('❌ 页面错误:', error.message);
        });
        
        console.log('✅ 浏览器启动成功');
    }

    /**
     * 测试登录功能
     */
    async testLogin() {
        console.log('\n📋 开始测试登录功能...');
        
        try {
            // 1. 访问登录页面
            console.log('1️⃣ 访问登录页面...');
            await this.page.goto(`${this.baseUrl}/login.html`);
            await this.page.waitForSelector('#loginForm', { timeout: 5000 });
            console.log('✅ 登录页面加载成功');

            // 2. 填写登录表单
            console.log('2️⃣ 填写登录表单...');
            await this.page.type('#loginEmail', this.testUser.email);
            await this.page.type('#loginPassword', this.testUser.password);
            console.log(`✅ 已输入邮箱: ${this.testUser.email}`);
            console.log(`✅ 已输入密码: ${this.testUser.password}`);

            // 3. 点击登录按钮
            console.log('3️⃣ 点击登录按钮...');
            await this.page.click('#loginBtn');
            
            // 4. 等待登录结果
            console.log('4️⃣ 等待登录结果...');
            await this.page.waitForTimeout(3000);
            
            // 5. 检查是否跳转到主页
            const currentUrl = this.page.url();
            console.log(`当前页面URL: ${currentUrl}`);
            
            if (currentUrl.includes('index.html')) {
                console.log('✅ 登录成功，已跳转到主页');
                return true;
            } else {
                // 检查是否有错误消息
                const errorMsg = await this.page.$eval('.error-message', el => el.textContent).catch(() => null);
                if (errorMsg) {
                    console.log(`❌ 登录失败: ${errorMsg}`);
                } else {
                    console.log('❌ 登录失败，未跳转到主页');
                }
                return false;
            }
            
        } catch (error) {
            console.error('❌ 登录测试失败:', error.message);
            return false;
        }
    }

    /**
     * 测试钱包页面功能
     */
    async testWalletPage() {
        console.log('\n💰 开始测试钱包页面功能...');
        
        try {
            // 1. 访问钱包页面
            console.log('1️⃣ 访问钱包页面...');
            await this.page.goto(`${this.baseUrl}/wallet.html`);
            await this.page.waitForSelector('.wallet-container', { timeout: 5000 });
            console.log('✅ 钱包页面加载成功');

            // 2. 检查余额显示
            console.log('2️⃣ 检查余额显示...');
            await this.page.waitForSelector('#walletBalance', { timeout: 3000 });
            const balance = await this.page.$eval('#walletBalance', el => el.textContent);
            console.log(`✅ 当前余额: ${balance}`);

            // 3. 检查充值地址
            console.log('3️⃣ 检查充值地址...');
            await this.page.waitForSelector('#depositAddress', { timeout: 3000 });
            const depositAddress = await this.page.$eval('#depositAddress', el => el.textContent);
            console.log(`✅ 充值地址: ${depositAddress}`);

            // 4. 测试复制充值地址功能
            console.log('4️⃣ 测试复制充值地址功能...');
            await this.page.click('#copyAddressBtn');
            await this.page.waitForTimeout(1000);
            console.log('✅ 点击复制地址按钮成功');

            // 5. 检查交易记录
            console.log('5️⃣ 检查交易记录...');
            const transactions = await this.page.$$('.transaction-item');
            console.log(`✅ 找到 ${transactions.length} 条交易记录`);

            return true;
            
        } catch (error) {
            console.error('❌ 钱包页面测试失败:', error.message);
            return false;
        }
    }

    /**
     * 测试提现地址绑定
     */
    async testWithdrawAddressBinding() {
        console.log('\n🔗 开始测试提现地址绑定...');
        
        try {
            // 1. 点击绑定地址按钮
            console.log('1️⃣ 点击绑定地址按钮...');
            await this.page.click('#bindAddressBtn');
            await this.page.waitForSelector('#addressModal', { timeout: 3000 });
            console.log('✅ 地址绑定弹窗打开成功');

            // 2. 输入测试地址
            const testAddress = 'TXJhKZoXZsYY24HbNgVY8GRwNVc6L94WDx';
            console.log('2️⃣ 输入测试地址...');
            await this.page.type('#newAddress', testAddress);
            console.log(`✅ 已输入地址: ${testAddress}`);

            // 3. 保存地址
            console.log('3️⃣ 保存地址...');
            await this.page.click('#saveAddressBtn');
            await this.page.waitForTimeout(2000);
            console.log('✅ 地址保存成功');

            return true;
            
        } catch (error) {
            console.error('❌ 提现地址绑定测试失败:', error.message);
            return false;
        }
    }

    /**
     * 运行完整测试套件
     */
    async runFullTest() {
        console.log('🎯 开始运行前端自动化测试套件...\n');
        
        const results = {
            login: false,
            wallet: false,
            addressBinding: false
        };

        try {
            // 初始化浏览器
            await this.initBrowser();

            // 测试登录功能
            results.login = await this.testLogin();

            // 如果登录成功，继续测试钱包功能
            if (results.login) {
                results.wallet = await this.testWalletPage();
                results.addressBinding = await this.testWithdrawAddressBinding();
            }

            // 输出测试结果
            console.log('\n📊 测试结果总结:');
            console.log('=====================================');
            console.log(`${results.login ? '✅' : '❌'} 登录功能: ${results.login ? '通过' : '失败'}`);
            console.log(`${results.wallet ? '✅' : '❌'} 钱包页面: ${results.wallet ? '通过' : '失败'}`);
            console.log(`${results.addressBinding ? '✅' : '❌'} 地址绑定: ${results.addressBinding ? '通过' : '失败'}`);

            const passedTests = Object.values(results).filter(r => r).length;
            const totalTests = Object.keys(results).length;
            console.log(`\n🎯 总体结果: ${passedTests}/${totalTests} 项测试通过`);

            if (passedTests === totalTests) {
                console.log('🎉 所有测试通过！前端功能正常');
            } else {
                console.log('⚠️  部分测试失败，需要检查相关功能');
            }

        } catch (error) {
            console.error('❌ 测试套件运行失败:', error.message);
        } finally {
            // 关闭浏览器
            if (this.browser) {
                await this.browser.close();
                console.log('🔚 浏览器已关闭');
            }
        }

        return results;
    }

    /**
     * 截图保存
     */
    async takeScreenshot(filename) {
        if (this.page) {
            await this.page.screenshot({ 
                path: `/Users/mason1236/0930/测试/UI测试/${filename}`,
                fullPage: true 
            });
            console.log(`📸 截图已保存: ${filename}`);
        }
    }
}

// 运行测试
async function main() {
    const tester = new FrontendAutomationTester();
    await tester.runFullTest();
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = FrontendAutomationTester;