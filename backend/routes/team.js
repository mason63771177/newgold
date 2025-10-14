const express = require('express');
const rateLimit = require('express-rate-limit');
const teamController = require('../controllers/teamController');

const router = express.Router();

// 限流配置
const teamLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 每分钟最多10次请求
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试',
    timestamp: Date.now()
  }
});

// API规范接口
router.get('/info', teamController.getTeamInfo.bind(teamController));
router.get('/invite', teamController.getInviteLink.bind(teamController));
router.post('/invite', teamLimiter, teamController.generateInviteLink.bind(teamController));
router.get('/members', teamController.getTeamMembers.bind(teamController));
router.post('/like', teamLimiter, teamController.likeMember.bind(teamController));

module.exports = router;