// 简单的测试API端点
export default function handler(req, res) {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // 返回测试数据
  res.status(200).json({
    message: 'CORS测试成功',
    timestamp: new Date().toISOString(),
    method: req.method,
    origin: req.headers.origin || 'no-origin'
  });
}