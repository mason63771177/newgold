const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// 任务操作限流
const taskLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 每分钟最多10次操作
  message: {
    success: false,
    message: '操作过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 获取任务列表（符合API规范）
router.get('/list', authenticateToken, taskController.getTaskList);

// 获取任务列表（兼容性路由）
router.get('/', authenticateToken, taskController.getTaskList);

// 获取任务状态（保持兼容性）
router.get('/status', authenticateToken, taskController.getTaskStatus);

// 完成任务（符合API规范）
router.post('/complete', authenticateToken, taskLimiter, taskController.completeTask);

// 答题（符合API规范）
router.post('/quiz/answer', authenticateToken, taskLimiter, taskController.answerQuiz);

// 完成新手任务（保持兼容性）
router.post('/newbie/complete', authenticateToken, taskLimiter, taskController.completeNewbieTask);

// 完成答题任务（保持兼容性）
router.post('/quiz/complete', authenticateToken, taskLimiter, taskController.completeQuizTask);

// 完成大神任务（保持兼容性）
router.post('/god/complete', authenticateToken, taskLimiter, taskController.completeGodTask);

// 重置任务（测试用）
router.post('/reset', authenticateToken, taskController.resetTasks);

module.exports = router;