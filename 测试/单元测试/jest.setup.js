/**
 * Jest测试环境配置
 * 设置全局测试环境和模拟对象
 */

import '@testing-library/jest-dom';

// 模拟localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// 模拟sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// 模拟WebSocket
global.WebSocket = jest.fn(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// 模拟fetch API
global.fetch = jest.fn();

// 模拟window.location
delete window.location;
window.location = {
  href: 'http://localhost:3001/',
  origin: 'http://localhost:3001',
  pathname: '/',
  search: '',
  hash: '',
  reload: jest.fn(),
  assign: jest.fn(),
};

// 模拟console方法以减少测试输出噪音
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// 模拟音频播放
global.Audio = jest.fn(() => ({
  play: jest.fn(),
  pause: jest.fn(),
  load: jest.fn(),
}));

// 模拟navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    language: 'zh-CN',
    clipboard: {
      writeText: jest.fn(),
    },
  },
  writable: true,
});

// 设置测试超时时间
jest.setTimeout(10000);