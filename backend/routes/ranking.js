const express = require('express');
const rateLimit = require('express-rate-limit');
const RankingController = require('../controllers/rankingController');

const router = express.Router();
const rankingController = new RankingController();

// 限流配置
const rankingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 20, // 每分钟最多20次请求
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试',
    timestamp: Date.now()
  }
});

// API规范接口
router.get('/team', rankingLimiter, rankingController.getTeamRanking);
router.get('/redpacket', rankingLimiter, rankingController.getRedpacketRanking);
router.get('/master', rankingLimiter, rankingController.getMasterRanking);

// 排行榜统计信息
router.get('/stats', rankingLimiter, rankingController.getRankingStats);

// 清除缓存接口（管理员使用）
router.post('/clear-cache', (req, res) => {
  const { type = 'all' } = req.body;
  rankingController.clearRankingCache(type);
  res.json({
    code: 200,
    message: '缓存清除成功',
    timestamp: Date.now()
  });
});

module.exports = router;