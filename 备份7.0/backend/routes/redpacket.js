const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const RedpacketController = require('../controllers/redpacketController');

// 创建控制器实例
const redpacketController = new RedpacketController();

// 抢红包限流：每分钟最多5次
const grabLimit = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 5,
  message: { success: false, message: '抢红包过于频繁，请稍后再试' }
});

// API规范接口
router.get('/status', redpacketController.getRedpacketStatus);
router.post('/grab', grabLimit, redpacketController.grabRedpacket);

// 兼容性接口
router.get('/records', redpacketController.getRecords);
router.get('/status-legacy', RedpacketController.getRedpacketStatus);
router.post('/grab-legacy', grabLimit, RedpacketController.grabRedpacket);
router.get('/records-legacy', RedpacketController.getRecords);
router.post('/reset', RedpacketController.resetRecords);

module.exports = router;