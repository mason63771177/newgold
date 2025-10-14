// 测试broadcast方法是否会被调用
console.log('🧪 开始测试broadcast方法...');

const webSocketService = require('./services/WebSocketService');

console.log('webSocketService加载成功');

// 直接调用broadcast方法
try {
    console.log('准备调用broadcast方法...');
    webSocketService.broadcast({
        type: 'test',
        message: 'This is a test message'
    });
    console.log('broadcast方法调用完成（这行不应该被执行，因为应该process.exit）');
} catch (error) {
    console.error('调用broadcast方法时出错:', error.message);
}