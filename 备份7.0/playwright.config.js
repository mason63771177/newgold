import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置文件
 * 用于端到端测试配置
 */
export default defineConfig({
  testDir: './tests',
  /* 并行运行测试 */
  fullyParallel: true,
  /* 失败时不重试 */
  retries: 0,
  /* 并发worker数量 */
  workers: process.env.CI ? 1 : undefined,
  /* 报告配置 */
  reporter: 'html',
  /* 全局测试配置 */
  use: {
    /* 基础URL */
    baseURL: 'http://localhost:8080',
    /* 截图配置 */
    screenshot: 'only-on-failure',
    /* 视频录制 */
    video: 'retain-on-failure',
    /* 追踪配置 */
    trace: 'on-first-retry',
  },

  /* 配置不同浏览器的测试项目 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* 移动端测试 */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* 启动本地开发服务器 */
  webServer: [
    {
      command: 'python3 -m http.server 8080',
      cwd: './frontend',
      port: 8080,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'node server.js',
      cwd: './backend',
      port: 3000,
      reuseExistingServer: !process.env.CI,
    }
  ],
});