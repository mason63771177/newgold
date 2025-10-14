const express = require('express');
const router = express.Router();
const activationController = require('../controllers/activationController');
const { authenticateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// 激活操作限流
const activationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 5, // 每分钟最多5次请求
  message: {
    success: false,
    message: '操作过于频繁，请稍后再试'
  }
});

// 获取用户状态
router.get('/status', authenticateToken, activationController.getUserStatus);

// 激活账号
router.post('/activate', authenticateToken, activationLimiter, activationController.activateAccount);

// 检查支付状态（根据订单ID）
router.get('/status/:orderId', authenticateToken, activationController.checkPaymentStatus);

// 确认激活（管理员或系统调用）
router.post('/confirm', authenticateToken, activationController.confirmActivation);

// 获取激活历史
router.get('/history', authenticateToken, activationController.getActivationHistory);

module.exports = router;