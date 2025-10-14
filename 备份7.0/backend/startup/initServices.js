const trc20Service = require('../services/TRC20Service');
const transactionMonitor = require('../services/TransactionMonitor');

class ServiceInitializer {
  static async initialize() {
    try {
      console.log('正在初始化服务...');
      
      // 初始化TRC20服务
      await trc20Service.initialize();
      console.log('TRC20服务初始化完成');
      
      // 启动交易监听器
      transactionMonitor.start();
      console.log('交易监听器启动完成');
      
      console.log('所有服务初始化完成');
      
    } catch (error) {
      console.error('服务初始化失败:', error);
      throw error;
    }
  }

  static async shutdown() {
    try {
      console.log('正在关闭服务...');
      
      // 停止交易监听器
      transactionMonitor.stop();
      console.log('交易监听器已停止');
      
      console.log('所有服务已关闭');
      
    } catch (error) {
      console.error('服务关闭失败:', error);
    }
  }
}

module.exports = ServiceInitializer;