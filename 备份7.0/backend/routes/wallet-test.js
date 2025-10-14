const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');

/**
 * 钱包测试路由 - 无需认证
 * 仅用于测试钱包功能
 */

// 获取钱包余额信息 - 测试版本
router.get('/balance', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    
    // 模拟用户对象
    const mockReq = {
      user: { id: userId === 'default' ? 5 : parseInt(userId) },
      query: req.query
    };
    
    await walletController.getWalletInfo(mockReq, res);
  } catch (error) {
    console.error('获取钱包余额错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 获取用户充值地址 - 测试版本
 */
router.get('/deposit-address', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    
    // 模拟用户对象
    const mockReq = {
      user: { id: userId === 'default' ? 5 : parseInt(userId) },
      query: { userId: userId === 'default' ? 5 : parseInt(userId) }
    };
    
    await walletController.getDepositAddress(mockReq, res);
  } catch (error) {
    console.error('获取充值地址错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 获取交易历史 - 测试版本
router.get('/transactions', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    
    console.log('🔍 测试路由 - 获取交易记录');
    console.log('原始查询参数:', req.query);
    
    // 模拟用户对象
    const mockReq = {
      user: { id: userId === 'default' ? 5 : parseInt(userId) },
      query: req.query
    };
    
    console.log('模拟请求对象:', {
      user: mockReq.user,
      query: mockReq.query
    });
    
    await walletController.getTransactions(mockReq, res);
  } catch (error) {
    console.error('获取交易记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// USDT提现 - 测试版本
router.post('/withdraw', async (req, res) => {
  try {
    const userId = req.body.userId || 'default';
    
    // 模拟用户对象
    const mockReq = {
      user: { id: userId === 'default' ? 5 : parseInt(userId) },
      body: req.body
    };
    
    await walletController.withdraw(mockReq, res);
  } catch (error) {
    console.error('提现错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;