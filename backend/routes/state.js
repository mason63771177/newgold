const express = require('express');
const router = express.Router();
const { StateController, syncStateValidation, switchStateValidation } = require('../controllers/stateController');
const { authenticateToken, checkUserStatus } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// 状态操作限流
const stateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟
  max: 10, // 最多10次操作
  message: {
    success: false,
    message: '状态操作过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 激活操作限流（更严格）
const activationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 最多3次激活尝试
  message: {
    success: false,
    message: '激活操作过于频繁，请1小时后再试'
  }
});

/**
 * @route GET /api/state/status
 * @desc 获取用户当前状态
 * @access Public (临时)
 */
router.get('/status', StateController.getStatus);

/**
 * @route POST /api/state/activate
 * @desc 激活账号
 * @access Public (临时测试)
 */
router.post('/activate', 
  activationLimiter,
  StateController.activate
);

/**
 * @route POST /api/state/repurchase
 * @desc 复购激活
 * @access Public (临时测试)
 */
router.post('/repurchase', 
  activationLimiter,
  StateController.repurchase
);

/**
 * @route PUT /api/state/sync
 * @desc 同步本地状态与服务器状态
 * @access Private
 */
router.put('/sync', 
  authenticateToken, 
  stateLimiter,
  syncStateValidation,
  StateController.syncState
);

/**
 * @route POST /api/state/switch
 * @desc 手动切换状态（仅开发环境）
 * @access Private
 */
router.post('/switch', 
  authenticateToken, 
  stateLimiter,
  switchStateValidation,
  StateController.switchState
);

module.exports = router;