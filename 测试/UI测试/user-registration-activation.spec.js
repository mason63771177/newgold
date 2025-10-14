const { test, expect } = require('@playwright/test');

/**
 * 用户注册和激活流程的端到端测试
 * 测试完整流程：注册 -> 邮箱验证 -> 登录 -> 激活账号 -> 入金模拟
 */
test.describe('用户注册和激活流程', () => {
    let testData;
    let verificationToken;
    let authToken;

    test.beforeEach(async ({ page }) => {
        // 生成测试数据
        testData = {
            email: `test${Date.now()}@example.com`,
            password: 'TestPass123!@#$%',
            username: `testuser${Date.now()}`,
            inviteCode: 'GOLD7DAY'
        };

        console.log('🧪 测试数据:', testData);
    });

    /**
     * 测试用户注册流程
     */
    test('用户注册流程', async ({ page }) => {
        console.log('🚀 开始测试用户注册流程...');

        // 访问登录页面
        await page.goto('/login.html');
        await expect(page).toHaveTitle(/裂金7日/);  // 修正标题匹配

        // 点击注册按钮切换到注册模式
        await page.click('button[data-form="register"]');
        
        // 等待一小段时间让JavaScript执行
        await page.waitForTimeout(500);
        
        // 等待注册表单显示
        await page.waitForSelector('#registerForm.active', { state: 'visible', timeout: 10000 });
        
        // 确保登录表单已隐藏
        await page.waitForSelector('#loginForm:not(.active)', { timeout: 5000 });

        // 填写注册表单
        await page.fill('#registerEmail', testData.email);
        await page.fill('#registerPassword', testData.password);
        await page.fill('#registerUsername', testData.username);
        await page.fill('#inviteCode', testData.inviteCode);

        // 提交注册表单
        await page.click('#registerSubmit');

        // 等待注册成功响应
        await page.waitForSelector('.success-message, .alert-success', { timeout: 10000 });
        
        // 验证注册成功消息
        const successMessage = await page.textContent('.success-message, .alert-success');
        expect(successMessage).toContain('注册成功');

        console.log('✅ 用户注册成功');
    });

    /**
     * 模拟邮箱验证流程
     */
    test('邮箱验证流程', async ({ page, request }) => {
        console.log('📧 开始模拟邮箱验证流程...');

        // 先完成注册
        await page.goto('/login.html');
        await page.click('button[data-form="register"]');
        await page.waitForSelector('#registerForm', { state: 'visible' });

        await page.fill('#registerEmail', testData.email);
        await page.fill('#registerPassword', testData.password);
        await page.fill('#registerUsername', testData.username);
        await page.fill('#inviteCode', testData.inviteCode);
        await page.click('#registerSubmit');

        await page.waitForSelector('.success-message, .alert-success', { timeout: 10000 });

        // 通过API获取验证token（模拟从邮件中获取）
        const response = await request.get(`http://localhost:3000/api/test/get-verification-token/${testData.email}`);
        const tokenData = await response.json();
        
        if (tokenData.success) {
            verificationToken = tokenData.token;
            console.log('📧 获取到验证token:', verificationToken);

            // 访问验证链接
            await page.goto(`/login.html?verify=${verificationToken}`);
            
            // 等待验证成功消息
            await page.waitForSelector('.verification-success, .alert-success', { timeout: 10000 });
            
            const verifyMessage = await page.textContent('.verification-success, .alert-success');
            expect(verifyMessage).toContain('验证成功');

            console.log('✅ 邮箱验证成功');
        } else {
            throw new Error('无法获取验证token');
        }
    });

    /**
     * 测试用户登录流程
     */
    test('用户登录流程', async ({ page, request }) => {
        console.log('🔐 开始测试用户登录流程...');

        // 先完成注册和验证
        await page.goto('/login.html');
        await page.click('button[data-form="register"]');
        await page.waitForSelector('#registerForm', { state: 'visible' });

        await page.fill('#registerEmail', testData.email);
        await page.fill('#registerPassword', testData.password);
        await page.fill('#registerUsername', testData.username);
        await page.fill('#inviteCode', testData.inviteCode);
        await page.click('#registerSubmit');

        await page.waitForSelector('.success-message, .alert-success', { timeout: 10000 });

        // 获取并使用验证token
        const tokenResponse = await request.get(`http://localhost:3000/api/test/get-verification-token/${testData.email}`);
        const tokenData = await tokenResponse.json();
        
        if (tokenData.success) {
            await page.goto(`/login.html?verify=${tokenData.token}`);
            await page.waitForSelector('.verification-success, .alert-success', { timeout: 10000 });
        }

        // 切换到登录模式
        await page.click('#loginBtn');
        await page.waitForSelector('#loginForm', { state: 'visible' });

        // 填写登录表单
        await page.fill('#loginEmail', testData.email);
        await page.fill('#loginPassword', testData.password);

        // 提交登录表单
        await page.click('#loginSubmit');

        // 等待跳转到主页
        await page.waitForURL('**/index.html', { timeout: 10000 });
        
        // 验证登录成功
        expect(page.url()).toContain('index.html');

        // 检查是否有用户信息显示
        await page.waitForSelector('.user-info, .welcome-message', { timeout: 5000 });

        console.log('✅ 用户登录成功');
    });

    /**
     * 测试账号激活流程
     */
    test('账号激活流程', async ({ page, request }) => {
        console.log('⚡ 开始测试账号激活流程...');

        // 完成前置步骤：注册、验证、登录
        await page.goto('/login.html');
        await page.click('button[data-form="register"]');
        await page.waitForSelector('#registerForm', { state: 'visible' });

        await page.fill('#registerEmail', testData.email);
        await page.fill('#registerPassword', testData.password);
        await page.fill('#registerUsername', testData.username);
        await page.fill('#inviteCode', testData.inviteCode);
        await page.click('#registerSubmit');

        await page.waitForSelector('.success-message, .alert-success', { timeout: 10000 });

        // 验证邮箱
        const tokenResponse = await request.get(`http://localhost:3000/api/test/get-verification-token/${testData.email}`);
        const tokenData = await tokenResponse.json();
        
        if (tokenData.success) {
            await page.goto(`/login.html?verify=${tokenData.token}`);
            await page.waitForSelector('.verification-success, .alert-success', { timeout: 10000 });
        }

        // 登录
        await page.click('#loginBtn');
        await page.waitForSelector('#loginForm', { state: 'visible' });
        await page.fill('#loginEmail', testData.email);
        await page.fill('#loginPassword', testData.password);
        await page.click('#loginSubmit');

        await page.waitForURL('**/index.html', { timeout: 10000 });

        // 查找并点击激活账号按钮
        await page.waitForSelector('.bottom-nav', { timeout: 10000 });
        
        // 检查是否有激活账号按钮
        const activateButton = page.locator('text=激活账号');
        await expect(activateButton).toBeVisible();
        
        // 点击激活账号按钮
        await activateButton.click();

        // 等待激活页面加载或弹窗出现
        await page.waitForTimeout(2000);

        // 检查是否显示了激活信息（钱包地址、金额、二维码等）
        const walletInfo = page.locator('.wallet-info, .activation-info, .qr-code');
        await expect(walletInfo.first()).toBeVisible({ timeout: 10000 });

        // 验证激活信息包含必要元素
        const pageContent = await page.textContent('body');
        expect(pageContent).toContain('100'); // 激活金额
        expect(pageContent).toMatch(/T[A-Za-z0-9]{33}/); // TRON地址格式

        console.log('✅ 账号激活流程成功，显示了入金信息');
    });

    /**
     * 测试完整的用户注册到激活流程
     */
    test('完整的注册激活流程', async ({ page, request }) => {
        console.log('🎯 开始测试完整的注册激活流程...');

        const startTime = Date.now();

        try {
            // 1. 用户注册
            console.log('步骤 1/4: 用户注册');
            await page.goto('/login.html');
            await page.click('button[data-form="register"]');
            await page.waitForSelector('#registerForm', { state: 'visible' });

            await page.fill('#registerEmail', testData.email);
            await page.fill('#registerPassword', testData.password);
            await page.fill('#registerUsername', testData.username);
            await page.fill('#inviteCode', testData.inviteCode);
            await page.click('#registerSubmit');

            await page.waitForSelector('.success-message, .alert-success', { timeout: 10000 });
            console.log('✅ 注册成功');

            // 2. 邮箱验证
            console.log('步骤 2/4: 邮箱验证');
            const tokenResponse = await request.get(`http://localhost:3000/api/test/get-verification-token/${testData.email}`);
            const tokenData = await tokenResponse.json();
            
            if (tokenData.success) {
                await page.goto(`/login.html?verify=${tokenData.token}`);
                await page.waitForSelector('.verification-success, .alert-success', { timeout: 10000 });
                console.log('✅ 邮箱验证成功');
            }

            // 3. 用户登录
            console.log('步骤 3/4: 用户登录');
            await page.click('#loginBtn');
            await page.waitForSelector('#loginForm', { state: 'visible' });
            await page.fill('#loginEmail', testData.email);
            await page.fill('#loginPassword', testData.password);
            await page.click('#loginSubmit');

            await page.waitForURL('**/index.html', { timeout: 10000 });
            console.log('✅ 登录成功');

            // 4. 账号激活
            console.log('步骤 4/4: 账号激活');
            await page.waitForSelector('.bottom-nav', { timeout: 10000 });
            
            const activateButton = page.locator('text=激活账号');
            await expect(activateButton).toBeVisible();
            await activateButton.click();

            await page.waitForTimeout(2000);
            const walletInfo = page.locator('.wallet-info, .activation-info, .qr-code');
            await expect(walletInfo.first()).toBeVisible({ timeout: 10000 });

            console.log('✅ 激活流程成功');

            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;

            console.log(`🎉 完整流程测试成功！耗时: ${duration}秒`);
            console.log(`📊 测试数据: ${JSON.stringify(testData, null, 2)}`);

        } catch (error) {
            console.error('❌ 测试失败:', error.message);
            
            // 截图保存错误状态
            await page.screenshot({ 
                path: `测试/报告/error-${Date.now()}.png`,
                fullPage: true 
            });
            
            throw error;
        }
    });

    /**
     * 模拟入金到账验证
     */
    test('模拟入金到账验证', async ({ page, request }) => {
        console.log('💰 开始模拟入金到账验证...');

        // 完成前置流程
        await page.goto('/login.html');
        await page.click('button[data-form="register"]');
        await page.waitForSelector('#registerForm', { state: 'visible' });

        await page.fill('#registerEmail', testData.email);
        await page.fill('#registerPassword', testData.password);
        await page.fill('#registerUsername', testData.username);
        await page.fill('#inviteCode', testData.inviteCode);
        await page.click('#registerSubmit');

        await page.waitForSelector('.success-message, .alert-success', { timeout: 10000 });

        // 验证和登录
        const tokenResponse = await request.get(`http://localhost:3000/api/test/get-verification-token/${testData.email}`);
        const tokenData = await tokenResponse.json();
        
        if (tokenData.success) {
            await page.goto(`/login.html?verify=${tokenData.token}`);
            await page.waitForSelector('.verification-success, .alert-success', { timeout: 10000 });
        }

        await page.click('#loginBtn');
        await page.waitForSelector('#loginForm', { state: 'visible' });
        await page.fill('#loginEmail', testData.email);
        await page.fill('#loginPassword', testData.password);
        await page.click('#loginSubmit');

        await page.waitForURL('**/index.html', { timeout: 10000 });

        // 激活账号获取钱包地址
        await page.waitForSelector('.bottom-nav', { timeout: 10000 });
        const activateButton = page.locator('text=激活账号');
        await activateButton.click();
        await page.waitForTimeout(2000);

        // 获取钱包地址
        const pageContent = await page.textContent('body');
        const walletAddressMatch = pageContent.match(/T[A-Za-z0-9]{33}/);
        
        if (walletAddressMatch) {
            const walletAddress = walletAddressMatch[0];
            console.log('💳 获取到钱包地址:', walletAddress);

            // 通过API模拟入金到账
            const depositResponse = await request.post('http://localhost:3000/api/test/simulate-deposit', {
                data: {
                    walletAddress: walletAddress,
                    amount: 100,
                    token: 'USDT'
                }
            });

            const depositResult = await depositResponse.json();
            
            if (depositResult.success) {
                console.log('✅ 模拟入金成功');
                
                // 刷新页面检查状态变化
                await page.reload();
                await page.waitForTimeout(3000);

                // 检查用户状态是否已激活
                const updatedContent = await page.textContent('body');
                
                // 验证激活后的状态变化
                expect(updatedContent).not.toContain('激活账号');
                console.log('✅ 账号激活状态验证成功');

            } else {
                console.log('⚠️ 模拟入金失败:', depositResult.message);
            }
        } else {
            throw new Error('无法获取钱包地址');
        }
    });
});