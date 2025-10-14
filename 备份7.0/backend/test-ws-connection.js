const WebSocket = require('ws');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEwMiwiaWF0IjoxNzU5MzYwNTE3LCJleHAiOjE3NTk0NDY5MTd9.l9bNyjcffdRKuxBNtRccwWGfspgyfNYjy3Y57fuzeiQ';
const wsUrl = `ws://localhost:3000/ws?token=${token}`;

console.log('🔌 尝试连接WebSocket:', wsUrl);

const ws = new WebSocket(wsUrl);

ws.on('open', function open() {
  console.log('✅ WebSocket连接成功！');
  ws.close();
});

ws.on('error', function error(err) {
  console.log('❌ WebSocket连接错误:', err.message);
});

ws.on('close', function close(code, reason) {
  console.log('🔒 WebSocket连接关闭 - 代码:', code, '原因:', reason.toString());
});

// 5秒后强制退出
setTimeout(() => {
  if (ws.readyState === WebSocket.CONNECTING) {
    console.log('⏰ 连接超时');
    ws.terminate();
  }
  process.exit(0);
}, 5000);
