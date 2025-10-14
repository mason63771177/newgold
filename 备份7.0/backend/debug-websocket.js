// 调试WebSocketService加载路径
console.log('🔍 开始调试WebSocketService加载路径...');

// 显示当前工作目录
console.log('当前工作目录:', process.cwd());

// 显示require.resolve的结果
try {
    const resolvedPath = require.resolve('./services/WebSocketService');
    console.log('WebSocketService解析路径:', resolvedPath);
} catch (error) {
    console.error('解析WebSocketService失败:', error.message);
}

// 加载WebSocketService并检查其内容
try {
    const webSocketService = require('./services/WebSocketService');
    console.log('WebSocketService加载成功');
    console.log('webSocketService类型:', typeof webSocketService);
    console.log('webSocketService构造函数:', webSocketService.constructor.name);
    
    // 检查broadcast方法的源码
    console.log('broadcast方法源码:');
    console.log(webSocketService.broadcast.toString());
    
} catch (error) {
    console.error('加载WebSocketService失败:', error.message);
}

// 显示require.cache中的相关条目
console.log('\nrequire.cache中的WebSocketService相关条目:');
Object.keys(require.cache).forEach(key => {
    if (key.includes('WebSocketService')) {
        console.log('缓存路径:', key);
    }
});