/**
 * 前端自动化测试脚本
 * 使用 Puppeteer 模拟用户在浏览器中的操作
 * 测试登录、钱包功能等
 */

const puppeteer = require('puppeteer');

// 测试配置
const TEST_CONFIG = {
  baseUrl: 'http://localhost:8080',
  testUser: {
    email: 'frontend-test@example.com',
    password: 'test123456'
  },
  timeout: 30000
};

/**
 * 等待指定时间
 * @param {number} ms 毫秒数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 测试用户登录功能
 * @param {Object} page Puppeteer页面对象
 */
async function testUserLogin(page) {
  console.log('\n=== 开始测试用户登录功能 ===');
  
  try {
    // 导航到登录页面
    console.log('1. 导航到登录页面...');
    await page.goto(`${TEST_CONFIG.baseUrl}/login.html`, { 
      waitUntil: 'networkidle2',
      timeout: TEST_CONFIG.timeout 
    });
    
    // 等待页面加载完成
    await page.waitForSelector('#loginEmail', { timeout: 10000 });
    console.log('登录页面加载完成');
    
    // 检查页面标题
    const title = await page.title();
    console.log(`页面标题: ${title}`);
    
    // 填写登录信息
    await page.type('#loginEmail', 'testuser@example.com');
    await page.type('#loginPassword', 'testpass123');
    
    // 点击登录按钮
    console.log('3. 点击登录按钮...');
    const loginButton = await page.$('#loginBtn');
    if (!loginButton) {
      throw new Error('找不到登录按钮');
    }
    
    await loginButton.click();
    
    // 等待登录响应
    console.log('4. 等待登录响应...');
    await sleep(3000);
    
    // 检查是否跳转到钱包页面
    const currentUrl = page.url();
    console.log(`当前页面URL: ${currentUrl}`);
    
    if (currentUrl.includes('wallet.html')) {
      console.log('✅ 登录成功，已跳转到钱包页面');
      return true;
    } else {
      // 检查是否有错误消息
      const errorMessage = await page.$eval('#message', el => el.textContent).catch(() => null);
      if (errorMessage) {
        console.log(`❌ 登录失败，错误信息: ${errorMessage}`);
      } else {
        console.log('❌ 登录失败，未跳转到钱包页面');
      }
      return false;
    }
    
  } catch (error) {
    console.error(`❌ 登录测试失败: ${error.message}`);
    return false;
  }
}

/**
 * 测试钱包页面功能
 * @param {Object} page Puppeteer页面对象
 */
async function testWalletFunctions(page) {
  console.log('\n=== 开始测试钱包页面功能 ===');
  
  try {
    // 等待钱包页面加载
    await page.waitForSelector('#balance', { timeout: 10000 });
    console.log('钱包页面已加载');
    
    // 测试余额显示
    console.log('1. 检查余额显示...');
    const balance = await page.$eval('#balance', el => el.textContent).catch(() => '未找到');
    console.log(`当前余额: ${balance}`);
    
    // 测试充值地址显示
    console.log('2. 检查充值地址显示...');
    const depositAddress = await page.$eval('#depositAddress', el => el.textContent).catch(() => '未找到');
    console.log(`充值地址: ${depositAddress}`);
    
    // 测试复制充值地址功能
    console.log('3. 测试复制充值地址功能...');
    const copyButton = await page.$('#copyAddressBtn');
    if (copyButton) {
      await copyButton.click();
      await sleep(1000);
      console.log('✅ 复制按钮点击成功');
    } else {
      console.log('❌ 找不到复制按钮');
    }
    
    // 测试交易记录查询
    console.log('4. 测试交易记录查询...');
    const transactionList = await page.$('#transactionList');
    if (transactionList) {
      const transactions = await page.$$('#transactionList .transaction-item');
      console.log(`✅ 找到交易记录列表，共 ${transactions.length} 条记录`);
    } else {
      console.log('❌ 找不到交易记录列表');
    }
    
    // 测试提现地址绑定
    console.log('5. 测试提现地址绑定...');
    const withdrawAddressInput = await page.$('#withdrawAddress');
    if (withdrawAddressInput) {
      console.log('✅ 找到提现地址输入框');
      
      // 输入测试地址
      const testAddress = 'TTest123456789TestAddress';
      await withdrawAddressInput.click();
      await withdrawAddressInput.clear();
      await withdrawAddressInput.type(testAddress);
      console.log(`已输入测试地址: ${testAddress}`);
      
      // 点击绑定按钮
      const bindButton = await page.$('#bindAddressBtn');
      if (bindButton) {
        await bindButton.click();
        await sleep(2000);
        console.log('✅ 绑定按钮点击成功');
      }
    } else {
      console.log('❌ 找不到提现地址输入框');
    }
    
    // 测试提现功能
    console.log('6. 测试提现功能...');
    const withdrawAmountInput = await page.$('#withdrawAmount');
    if (withdrawAmountInput) {
      console.log('✅ 找到提现金额输入框');
      
      // 输入测试金额
      await withdrawAmountInput.click();
      await withdrawAmountInput.clear();
      await withdrawAmountInput.type('10');
      console.log('已输入测试金额: 10 USDT');
      
      // 点击提现按钮
      const withdrawButton = await page.$('#withdrawBtn');
      if (withdrawButton) {
        await withdrawButton.click();
        await sleep(2000);
        console.log('✅ 提现按钮点击成功');
      }
    } else {
      console.log('❌ 找不到提现金额输入框');
    }
    
    return true;
    
  } catch (error) {
    console.error(`❌ 钱包功能测试失败: ${error.message}`);
    return false;
  }
}

/**
 * 截取页面截图
 * @param {Object} page Puppeteer页面对象
 * @param {string} filename 文件名
 */
async function takeScreenshot(page, filename) {
  try {
    await page.screenshot({ 
      path: `/Users/mason1236/0930/${filename}`,
      fullPage: true 
    });
    console.log(`📸 截图已保存: ${filename}`);
  } catch (error) {
    console.error(`截图失败: ${error.message}`);
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 开始前端自动化测试...');
  
  let browser;
  let page;
  
  try {
    // 启动浏览器
    console.log('启动浏览器...');
    browser = await puppeteer.launch({
      headless: false, // 显示浏览器界面
      defaultViewport: { width: 1280, height: 800 },
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--disable-features=VizDisplayCompositor']
    });
    
    page = await browser.newPage();
    
    // 设置用户代理
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    
    // 监听控制台输出
    page.on('console', msg => {
      console.log(`浏览器控制台: ${msg.text()}`);
    });
    
    // 监听网络请求
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`📡 API响应: ${response.status()} ${response.url()}`);
      }
    });
    
    // 监听页面错误
    page.on('pageerror', error => {
      console.error(`页面错误: ${error.message}`);
    });
    
    // 监听网络请求错误
    page.on('requestfailed', request => {
      console.log('❌ 网络请求失败:', request.url(), request.failure().errorText);
    });
    
    // 测试登录功能
    const loginSuccess = await testUserLogin(page);
    await takeScreenshot(page, 'login-test-result.png');
    
    if (loginSuccess) {
      // 测试钱包功能
      await testWalletFunctions(page);
      await takeScreenshot(page, 'wallet-test-result.png');
    }
    
    console.log('\n=== 测试完成 ===');
    console.log(`登录测试: ${loginSuccess ? '✅ 通过' : '❌ 失败'}`);
    
    // 保持浏览器打开一段时间以便观察
    console.log('浏览器将在10秒后关闭...');
    await sleep(10000);
    
  } catch (error) {
    console.error(`测试执行失败: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
      console.log('浏览器已关闭');
    }
  }
}

// 运行测试
runTests().catch(console.error);