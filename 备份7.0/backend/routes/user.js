const express = require('express');
const { body } = require('express-validator');
const UserController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const activationController = require('../controllers/activationController');

const router = express.Router();

// 获取用户详细信息
router.get('/info', authenticateToken, UserController.getUserInfo);

// 获取用户状态详情
router.get('/status', authenticateToken, UserController.getUserStatus);

// 更新用户状态 - 支持POST和PUT方法
router.post('/status', 
  authenticateToken,
  [
    body('status')
      .isInt({ min: 1, max: 3 })
      .withMessage('状态必须是1-3之间的整数'),
    body('countdownEndTime')
      .optional()
      .isISO8601()
      .withMessage('倒计时结束时间格式不正确')
  ],
  UserController.updateUserStatus
);

router.put('/status', 
  authenticateToken,
  [
    body('status')
      .isInt({ min: 1, max: 3 })
      .withMessage('状态必须是1-3之间的整数'),
    body('countdownEndTime')
      .optional()
      .isISO8601()
      .withMessage('倒计时结束时间格式不正确')
  ],
  UserController.updateUserStatus
);

// 激活账号
router.post('/activate', authenticateToken, activationController.activateAccount);

// 获取用户团队信息
router.get('/team', authenticateToken, UserController.getUserTeam);

// 获取用户钱包信息
router.get('/wallet', authenticateToken, UserController.getUserWallet);

module.exports = router;