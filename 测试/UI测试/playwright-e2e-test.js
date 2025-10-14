const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * Playwright端到端浏览器测试脚本
 * 测试完整的用户流程：注册 -> 邮箱验证 -> 登录 -> 入金
 */
class PlaywrightE2ETest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testData = {
            email: `test${Date.now()}@example.com`,
            password: 'TestPass123!@#$%',
            username: `testuser${Date.now()}`,
            inviteCode: 'GOLD7DAY'
        };
        this.baseUrl = 'http://localhost:3000'; // 使用真实的后端服务器
        this.apiUrl = 'http://localhost:3000';
        this.verificationToken = null; // 存储真实的验证 token
        this.authToken = null; // 存储登录后的认证token
    }

    /**
     * 初始化浏览器
     */
    async init() {
        console.log('🚀 启动Playwright浏览器...');
        try {
            this.browser = await chromium.launch({
                headless: false,
                slowMo: 1000,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                ]
            });
            
            this.page = await this.browser.newPage();
            
            // 设置视口
            await this.page.setViewportSize({ width: 1280, height: 720 });
            
            // 监听控制台输出
            this.page.on('console', msg => {
                console.log(`🖥️  浏览器控制台: ${msg.text()}`);
            });
            
            console.log('✅ Playwright浏览器启动成功');
            return true;
        } catch (error) {
            console.error('❌ 浏览器启动失败:', error.message);
            return false;
        }
    }

    /**
     * 等待元素并点击
     */
    async waitAndClick(selector, timeout = 10000) {
        try {
            console.log(`🖱️  等待并点击元素: ${selector}`);
            await this.page.waitForSelector(selector, { timeout, state: 'visible' });
            await this.page.click(selector);
            await this.page.waitForTimeout(1000);
            return true;
        } catch (error) {
            console.log(`❌ 点击元素失败: ${selector} - ${error.message}`);
            return false;
        }
    }

    /**
     * 等待元素并输入文本
     */
    async waitAndFill(selector, text, timeout = 10000) {
        try {
            console.log(`⌨️  等待并输入文本到: ${selector}`);
            await this.page.waitForSelector(selector, { timeout, state: 'visible' });
            await this.page.fill(selector, text);
            await this.page.waitForTimeout(500);
            return true;
        } catch (error) {
            console.log(`❌ 输入文本失败: ${selector} - ${error.message}`);
            return false;
        }
    }

    /**
     * 测试用户注册
     */
    async testUserRegistration() {
        try {
            console.log('📝 开始测试用户注册...');
            
            // 访问HTTP服务器上的登录页面
            console.log('📄 访问页面: http://localhost:8080/login.html');
            await this.page.goto('http://localhost:8080/login.html');
            await this.page.waitForLoadState('networkidle');
            
            // 点击注册标签切换到注册表单
            console.log('🔄 切换到注册表单...');
            await this.page.click('[data-form="register"]');
            await this.page.waitForTimeout(1000);
            
            console.log('📝 填写注册表单...');
            
            // 填写注册表单 - 使用真实的ID
            await this.waitAndFill('#registerEmail', this.testData.email);
            await this.waitAndFill('#registerPassword', this.testData.password);
            await this.waitAndFill('#inviteCode', 'TEST123'); // 添加邀请码
            
            // 提交注册表单
            console.log('📤 提交注册表单...');
            await this.page.click('#registerBtn');
            
            // 等待响应并检查结果
            await this.page.waitForTimeout(3000);
            
            // 检查是否有成功消息或错误消息
            try {
                // 检查页面上是否有成功提示
                const successMessage = await this.page.textContent('.success-message, .alert-success, [class*="success"]', { timeout: 2000 });
                if (successMessage && successMessage.includes('成功')) {
                    console.log('✅ 注册成功:', successMessage);
                    return true;
                }
            } catch (e) {
                // 没有找到成功消息，继续检查错误消息
            }
            
            try {
                // 检查是否有错误消息
                const errorMessage = await this.page.textContent('.error-message, .alert-error, [class*="error"]', { timeout: 2000 });
                if (errorMessage) {
                    console.log('❌ 注册失败:', errorMessage);
                    return false;
                }
            } catch (e) {
                // 没有找到错误消息
            }
            
            // 检查浏览器控制台是否有CORS错误
            const logs = await this.page.evaluate(() => {
                return window.console.logs || [];
            });
            
            for (const log of logs) {
                if (log.includes('CORS') || log.includes('Failed to fetch')) {
                    console.log('❌ 注册失败: CORS错误或网络错误');
                    return false;
                }
            }
            
            console.log('⚠️ 注册状态不明确，假设失败');
            return false;
            
        } catch (error) {
            console.log('❌ 用户注册测试失败:', error.message);
            return false;
        }
    }

    /**
     * 模拟邮箱验证
     */
    async simulateEmailVerification() {
        console.log('\n📧 模拟邮箱验证...');
        
        try {
            // 首先通过 API 获取用户的真实 verification token
            const fetch = (await import('node-fetch')).default;
            
            // 获取用户的验证 token
            const getTokenUrl = `${this.apiUrl}/api/test/get-verification-token`;
            const tokenResponse = await fetch(getTokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: this.testData.email
                })
            });
            
            if (!tokenResponse.ok) {
                console.log('❌ 无法获取验证 token');
                return false;
            }
            
            const tokenData = await tokenResponse.json();
            if (!tokenData.success || !tokenData.data.verificationToken) {
                console.log('❌ 验证 token 不存在或已过期');
                return false;
            }
            
            this.verificationToken = tokenData.data.verificationToken;
            console.log('📋 获取到验证 token:', this.verificationToken.substring(0, 10) + '...');
            
            // 使用真实的 token 进行邮箱验证
            const verifyUrl = `${this.apiUrl}/api/auth/verify-email?token=${encodeURIComponent(this.verificationToken)}&email=${encodeURIComponent(this.testData.email)}`;
            
            const response = await fetch(verifyUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ 邮箱验证成功:', result.message);
                return true;
            } else {
                const errorText = await response.text();
                console.log('❌ 邮箱验证失败:', errorText);
                return false;
            }
        } catch (error) {
            console.log('⚠️  邮箱验证API调用失败:', error.message);
            return false;
        }
    }

    /**
     * 测试用户登录功能
     */
    async testUserLogin() {
        console.log('🔄 开始测试用户登录...');
        
        try {
            // 导航到登录页面 - 使用HTTP服务器
            await this.page.goto('http://localhost:8080/login.html');
            console.log('✅ 成功导航到登录页面');
            
            // 等待页面加载
            await this.page.waitForTimeout(2000);
            
            // 确保在登录表单
            await this.page.waitForSelector('#loginForm', { visible: true });
            
            // 等待邮箱输入框可见
            await this.page.waitForSelector('#loginEmail', { visible: true });
            
            // 填写登录信息
            await this.page.fill('#loginEmail', this.testData.email);
            await this.page.fill('#loginPassword', this.testData.password);
            
            console.log(`✅ 填写登录信息: ${this.testData.email}`);
            
            // 提交登录表单
            await this.page.click('#loginBtn');
            console.log('✅ 提交登录表单');
            
            // 等待响应
            await this.page.waitForTimeout(3000);
            
            // 检查是否登录成功（可能跳转到其他页面或显示成功消息）
            const currentUrl = this.page.url();
            if (currentUrl.includes('wallet.html') || currentUrl.includes('dashboard')) {
                console.log('✅ 登录成功 - 已跳转到钱包页面');
                
                // 从localStorage获取token
                const token = await this.page.evaluate(() => {
                    return localStorage.getItem('token');
                });
                
                if (token) {
                    console.log('✅ 成功获取认证token');
                    // 存储token供后续API调用使用
                    this.authToken = token;
                    return true;
                } else {
                    console.log('❌ 未能获取认证token');
                    return false;
                }
            } else {
                // 检查成功或错误消息
                const successMessage = await this.page.textContent('.message.success').catch(() => null);
                const errorMessage = await this.page.textContent('.message.error').catch(() => null);
                
                if (successMessage) {
                    console.log('✅ 登录成功:', successMessage);
                    
                    // 等待页面跳转或token设置
                    await this.page.waitForTimeout(2000);
                    
                    // 从localStorage获取token
                    const token = await this.page.evaluate(() => {
                        return localStorage.getItem('token');
                    });
                    
                    if (token) {
                        console.log('✅ 成功获取认证token');
                        this.authToken = token;
                        return true;
                    } else {
                        console.log('❌ 未能获取认证token');
                        return false;
                    }
                } else if (errorMessage) {
                    console.log('❌ 登录失败:', errorMessage);
                    return false;
                } else {
                    console.log('❓ 登录状态未知');
                    return false;
                }
            }
            
        } catch (error) {
            console.error('❌ 登录测试失败:', error.message);
            return false;
        }
    }

    /**
     * 测试钱包页面访问
     */
    async testWalletAccess() {
        console.log('\n💰 测试钱包页面访问...');
        
        try {
            // 访问HTTP服务器上的钱包页面
            const walletUrl = 'http://localhost:8080/wallet.html';
            console.log(`📄 访问页面: ${walletUrl}`);
            await this.page.goto(walletUrl, { waitUntil: 'networkidle' });
            
            // 等待页面加载
            await this.page.waitForTimeout(3000);
            
            // 检查钱包页面元素
            const balanceElement = await this.page.$('#balance').catch(() => null);
            const depositAddressElement = await this.page.$('#depositAddress').catch(() => null);
            
            if (balanceElement && depositAddressElement) {
                console.log('✅ 钱包页面加载成功 - 找到余额和充值地址元素');
                return true;
            } else {
                console.log('❌ 钱包页面元素不完整');
                console.log(`余额元素: ${balanceElement ? '✅' : '❌'}`);
                console.log(`充值地址元素: ${depositAddressElement ? '✅' : '❌'}`);
                return false;
            }
            
        } catch (error) {
            console.log(`❌ 钱包页面访问测试失败: ${error.message}`);
            return false;
        }
    }

    /**
     * 测试入金100 USDT
     */
    async testDeposit100USDT() {
        console.log('\n💸 开始测试激活账号（入金100 USDT）...');
        
        try {
            // 访问状态1页面（index.html）
            const indexUrl = 'http://localhost:8080/index.html';
            console.log(`📄 访问状态1页面: ${indexUrl}`);
            await this.page.goto(indexUrl, { waitUntil: 'networkidle' });
            await this.page.waitForTimeout(2000);
            
            // 查找激活账号按钮（可能的选择器）
            const activateSelectors = [
                'button:has-text("激活账号")',
                '.activate-btn',
                '#activateBtn',
                'button[onclick*="activate"]',
                '.btn:has-text("激活")'
            ];
            
            let activateButton = null;
            for (const selector of activateSelectors) {
                try {
                    activateButton = await this.page.locator(selector).first();
                    if (await activateButton.count() > 0) {
                        console.log(`✅ 找到激活按钮: ${selector}`);
                        break;
                    }
                } catch (e) {
                    // 继续尝试下一个选择器
                }
            }
            
            if (!activateButton || await activateButton.count() === 0) {
                console.log('⚠️ 未找到激活账号按钮，直接调用激活API');
            } else {
                // 点击激活账号按钮
                console.log('🔄 点击激活账号按钮...');
                await activateButton.click();
                await this.page.waitForTimeout(2000);
            }
            
            // 调用激活API
            console.log('🔗 调用激活API...');
            const fetch = (await import('node-fetch')).default;
            
            // 获取认证token
            const token = this.authToken || await this.page.evaluate(() => {
                return localStorage.getItem('authToken') || localStorage.getItem('token');
            });
            
            if (!token) {
                console.log('❌ 未找到用户认证token');
                return false;
            }
            
            // 调用激活API - 使用 /api/activation/activate
            const activateResponse = await fetch(`${this.apiUrl}/api/activation/activate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (activateResponse.ok) {
                const activateResult = await activateResponse.json();
                console.log('✅ 激活API调用成功:', activateResult);
                
                // 如果激活成功，获取钱包地址并模拟转账确认
                if (activateResult.success && activateResult.data.walletAddress) {
                    const walletAddress = activateResult.data.walletAddress;
                    const orderId = activateResult.data.orderId;
                    
                    console.log(`📍 获取到激活地址: ${walletAddress}`);
                    console.log(`📋 订单ID: ${orderId}`);
                    
                    // 模拟转账确认
                    console.log('🔗 模拟转账确认...');
                    const confirmResponse = await fetch(`${this.apiUrl}/api/activation/confirm`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            orderId: orderId,
                            txHash: `0x${Date.now().toString(16)}${Math.random().toString(16).substr(2, 8)}`
                        })
                    });
                    
                    if (confirmResponse.ok) {
                        const confirmResult = await confirmResponse.json();
                        console.log('✅ 激活确认成功:', confirmResult);
                        
                        // 等待状态更新
                        await this.page.waitForTimeout(3000);
                        
                        return true;
                    } else {
                        const errorText = await confirmResponse.text();
                        console.log('❌ 激活确认失败:', errorText);
                        return false;
                    }
                } else {
                    console.log('❌ 激活API返回数据异常:', activateResult);
                    return false;
                }
            } else {
                const errorText = await activateResponse.text();
                console.log('❌ 激活API调用失败:', errorText);
                return false;
            }
            
        } catch (error) {
            console.log('❌ 激活测试失败:', error.message);
            return false;
        }
    }

    /**
     * 验证余额更新
     */
    async verifyBalanceUpdate() {
        console.log('\n🔍 验证余额更新...');
        
        try {
            await this.page.waitForSelector('#balance', { timeout: 5000 });
            const balance = await this.page.textContent('#balance');
            
            console.log(`💵 最终余额: ${balance}`);
            
            // 检查余额是否包含100或更多
            const balanceValue = parseFloat(balance.replace(/[^\d.]/g, ''));
            if (balanceValue >= 100) {
                console.log('✅ 余额更新验证成功');
                return true;
            } else {
                console.log('⚠️  余额未达到预期值');
                return false;
            }
        } catch (error) {
            console.log('❌ 余额验证失败:', error.message);
            return false;
        }
    }

    /**
     * 运行完整测试流程
     */
    async runFullTest() {
        console.log('🎯 开始Playwright端到端浏览器测试');
        console.log(`📧 测试邮箱: ${this.testData.email}`);
        console.log(`👤 测试用户名: ${this.testData.username}`);
        console.log(`🔑 测试密码: ${this.testData.password}`);
        
        const results = {
            initialization: false,
            registration: false,
            emailVerification: false,
            login: false,
            walletAccess: false,
            deposit: false,
            balanceUpdate: false
        };
        
        try {
            // 初始化浏览器
            results.initialization = await this.init();
            if (!results.initialization) {
                throw new Error('浏览器初始化失败');
            }
            
            // 1. 测试注册
            results.registration = await this.testUserRegistration();
            if (!results.registration) {
                console.log('❌ 注册失败，停止后续测试');
                throw new Error('用户注册失败，无法继续测试');
            }
            
            // 2. 模拟邮箱验证（允许跳过）
            results.emailVerification = await this.simulateEmailVerification();
            if (!results.emailVerification) {
                console.log('⚠️  邮箱验证失败，但允许跳过，继续后续测试');
            }
            
            // 3. 测试登录
            results.login = await this.testUserLogin();
            if (!results.login) {
                console.log('❌ 登录失败，停止后续测试');
                throw new Error('用户登录失败，无法继续测试');
            }
            
            // 4. 测试钱包访问
            results.walletAccess = await this.testWalletAccess();
            if (!results.walletAccess) {
                console.log('❌ 钱包访问失败，停止后续测试');
                throw new Error('钱包访问失败，无法继续测试');
            }
            
            // 5. 测试入金
            results.deposit = await this.testDeposit100USDT();
            if (!results.deposit) {
                console.log('❌ 入金测试失败，停止后续测试');
                throw new Error('入金测试失败，无法继续测试');
            }
            
            // 6. 验证余额更新
            results.balanceUpdate = await this.verifyBalanceUpdate();
            
        } catch (error) {
            console.error('❌ 测试过程中发生错误:', error.message);
        } finally {
            // 生成测试报告
            this.generateTestReport(results);
            
            // 保持浏览器打开一段时间以便查看结果
            console.log('\n⏳ 保持浏览器打开15秒以便查看结果...');
            if (this.page) {
                await this.page.waitForTimeout(15000);
            }
            
            if (this.browser) {
                await this.browser.close();
                console.log('🔒 浏览器已关闭');
            }
        }
    }

    /**
     * 生成测试报告
     */
    generateTestReport(results) {
        console.log('\n📊 测试报告');
        console.log('='.repeat(50));
        
        const testItems = [
            { name: '浏览器初始化', key: 'initialization' },
            { name: '用户注册', key: 'registration' },
            { name: '邮箱验证', key: 'emailVerification' },
            { name: '用户登录', key: 'login' },
            { name: '钱包访问', key: 'walletAccess' },
            { name: '入金测试', key: 'deposit' },
            { name: '余额更新', key: 'balanceUpdate' }
        ];
        
        let passedCount = 0;
        testItems.forEach(item => {
            const status = results[item.key] ? '✅ 通过' : '❌ 失败';
            console.log(`${item.name}: ${status}`);
            if (results[item.key]) passedCount++;
        });
        
        console.log('='.repeat(50));
        console.log(`总体结果: ${passedCount}/${testItems.length} 项测试通过`);
        
        if (passedCount === testItems.length) {
            console.log('🎉 所有测试都通过了！');
        } else {
            console.log('⚠️  部分测试失败，请检查日志');
        }
        
        // 保存测试结果到文件
        const reportPath = path.join(__dirname, `playwright-test-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            testData: this.testData,
            results: results,
            summary: {
                total: testItems.length,
                passed: passedCount,
                failed: testItems.length - passedCount
            }
        }, null, 2));
        
        console.log(`📄 测试报告已保存到: ${reportPath}`);
    }
}

// 运行测试
if (require.main === module) {
    const test = new PlaywrightE2ETest();
    test.runFullTest().catch(console.error);
}

module.exports = PlaywrightE2ETest;