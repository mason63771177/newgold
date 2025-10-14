/**
 * API使用示例
 * 展示如何使用H5游戏化金融产品后端API的各种功能
 * @author H5游戏化金融产品开发团队
 * @version 1.0.0
 */

const axios = require('axios');

// 配置基础URL
const BASE_URL = 'http://localhost:3000/api';

/**
 * API客户端类
 * 封装了所有API调用的方法
 */
class APIClient {
  constructor(baseURL = BASE_URL) {
    this.baseURL = baseURL;
    this.token = null;
    
    // 创建axios实例
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // 请求拦截器 - 自动添加token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    
    // 响应拦截器 - 统一错误处理
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        console.error('API请求失败:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 用户登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<Object>} 登录结果
   */
  async login(username, password) {
    try {
      const response = await this.client.post('/auth/login', {
        username,
        password
      });
      
      if (response.success && response.token) {
        this.token = response.token;
        console.log('登录成功:', response.message);
        return response;
      }
      
      throw new Error(response.message || '登录失败');
    } catch (error) {
      console.error('登录失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取用户信息
   * @returns {Promise<Object>} 用户信息
   */
  async getUserInfo() {
    try {
      const response = await this.client.get('/user/info');
      console.log('用户信息:', response.data);
      return response;
    } catch (error) {
      console.error('获取用户信息失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取用户状态
   * @returns {Promise<Object>} 用户状态信息
   */
  async getUserStatus() {
    try {
      const response = await this.client.get('/user/status');
      console.log('用户状态:', response.data);
      return response;
    } catch (error) {
      console.error('获取用户状态失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取团队信息
   * @returns {Promise<Object>} 团队信息
   */
  async getTeamInfo() {
    try {
      const response = await this.client.get('/user/team');
      console.log('团队信息:', response.data);
      return response;
    } catch (error) {
      console.error('获取团队信息失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取钱包信息
   * @returns {Promise<Object>} 钱包信息
   */
  async getWalletInfo() {
    try {
      const response = await this.client.get('/wallet/info');
      console.log('钱包信息:', response.data);
      return response;
    } catch (error) {
      console.error('获取钱包信息失败:', error.message);
      throw error;
    }
  }

  /**
   * 申请提现
   * @param {number} amount - 提现金额
   * @param {string} toAddress - 提现地址
   * @param {string} network - 网络类型 (TRC20)
   * @returns {Promise<Object>} 提现申请结果
   */
  async withdraw(amount, toAddress, network = 'TRC20') {
    try {
      const response = await this.client.post('/wallet/withdraw', {
        amount,
        toAddress,
        network
      });
      console.log('提现申请成功:', response.message);
      return response;
    } catch (error) {
      console.error('提现申请失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取任务列表
   * @returns {Promise<Object>} 任务列表
   */
  async getTaskList() {
    try {
      const response = await this.client.get('/tasks/list');
      console.log('任务列表:', response.data);
      return response;
    } catch (error) {
      console.error('获取任务列表失败:', error.message);
      throw error;
    }
  }

  /**
   * 完成任务
   * @param {number} taskId - 任务ID
   * @returns {Promise<Object>} 任务完成结果
   */
  async completeTask(taskId) {
    try {
      const response = await this.client.post('/tasks/complete', {
        taskId
      });
      console.log('任务完成:', response.message);
      return response;
    } catch (error) {
      console.error('完成任务失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取红包状态
   * @returns {Promise<Object>} 红包状态
   */
  async getRedPacketStatus() {
    try {
      const response = await this.client.get('/redpacket/status');
      console.log('红包状态:', response.data);
      return response;
    } catch (error) {
      console.error('获取红包状态失败:', error.message);
      throw error;
    }
  }

  /**
   * 抢红包
   * @returns {Promise<Object>} 抢红包结果
   */
  async grabRedPacket() {
    try {
      const response = await this.client.post('/redpacket/grab');
      console.log('抢红包结果:', response.message);
      return response;
    } catch (error) {
      console.error('抢红包失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取排行榜
   * @returns {Promise<Object>} 排行榜数据
   */
  async getRanking() {
    try {
      const response = await this.client.get('/ranking/list');
      console.log('排行榜:', response.data);
      return response;
    } catch (error) {
      console.error('获取排行榜失败:', error.message);
      throw error;
    }
  }
}

/**
 * 使用示例
 */
async function runExamples() {
  const client = new APIClient();
  
  try {
    console.log('=== API使用示例开始 ===');
    
    // 1. 用户登录
    console.log('\n1. 用户登录');
    await client.login('testuser', 'password123');
    
    // 2. 获取用户信息
    console.log('\n2. 获取用户信息');
    await client.getUserInfo();
    
    // 3. 获取用户状态
    console.log('\n3. 获取用户状态');
    await client.getUserStatus();
    
    // 4. 获取团队信息
    console.log('\n4. 获取团队信息');
    await client.getTeamInfo();
    
    // 5. 获取钱包信息
    console.log('\n5. 获取钱包信息');
    await client.getWalletInfo();
    
    // 6. 获取任务列表
    console.log('\n6. 获取任务列表');
    await client.getTaskList();
    
    // 7. 获取红包状态
    console.log('\n7. 获取红包状态');
    await client.getRedPacketStatus();
    
    // 8. 获取排行榜
    console.log('\n8. 获取排行榜');
    await client.getRanking();
    
    console.log('\n=== API使用示例完成 ===');
    
  } catch (error) {
    console.error('示例执行失败:', error.message);
  }
}

// 导出API客户端类
module.exports = {
  APIClient,
  runExamples
};

// 如果直接运行此文件，则执行示例
if (require.main === module) {
  runExamples();
}