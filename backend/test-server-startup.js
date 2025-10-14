// 测试服务器启动时WebSocketService的状态
console.log('🧪 测试服务器启动时WebSocketService的状态...');

// 加载WebSocketService
const webSocketService = require('./services/WebSocketService');

console.log('✅ WebSocketService加载成功');
console.log('类型:', typeof webSocketService);
console.log('构造函数:', webSocketService.constructor.name);

// 检查broadcast方法
if (webSocketService.broadcast) {
    console.log('✅ broadcast方法存在');
    console.log('broadcast方法源码前100个字符:');
    console.log(webSocketService.broadcast.toString().substring(0, 200));
} else {
    console.log('❌ broadcast方法不存在');
}

// 检查sendToRoom方法
if (webSocketService.sendToRoom) {
    console.log('✅ sendToRoom方法存在');
    console.log('sendToRoom方法源码前100个字符:');
    console.log(webSocketService.sendToRoom.toString().substring(0, 200));
} else {
    console.log('❌ sendToRoom方法不存在');
}

console.log('🧪 测试完成，准备启动服务器...');

// 现在启动服务器
require('./server.js');