/**
 * 调试激活功能的测试脚本
 * 模拟前端的激活API调用过程
 */

const API_BASE_URL = 'https://backend-av1nfmkip-wongs-projects-7580d6a8.vercel.app';

// 模拟前端的getAuthToken函数
function getAuthToken() {
  // 使用已知的有效token
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEwMiwiaWF0IjoxNzU5MzYwNTE3LCJleHAiOjE3NTk0NDY5MTd9.l9bNyjcffdRKuxBNtRccwWGfspgyfNYjy3Y57fuzeiQ';
}

// 模拟前端的apiRequest函数
async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const url = `${API_BASE_URL}/api${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...options
  };
  
  console.log('发送请求到:', url);
  console.log('请求配置:', config);
  
  try {
    const response = await fetch(url, config);
    console.log('响应状态:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('响应数据:', data);
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
}

// 测试激活功能
async function testActivation() {
  console.log('开始测试激活功能...');
  
  try {
    console.log('正在调用激活API...');
    const response = await apiRequest('/activation/activate', {
      method: 'POST'
    });
    
    if (response.success && response.data) {
      console.log('✅ 激活API调用成功!');
      console.log('激活数据:', response.data);
      return response.data;
    } else {
      console.log('❌ 激活API返回失败:', response);
      throw new Error(response.message || '激活请求失败');
    }
    
  } catch (error) {
    console.error('❌ 激活API调用失败:', error);
    console.error('错误详情:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// 运行测试
testActivation()
  .then(result => {
    console.log('🎉 测试完成，激活功能正常工作');
    console.log('最终结果:', result);
  })
  .catch(error => {
    console.log('💥 测试失败，激活功能存在问题');
    console.error('最终错误:', error.message);
  });