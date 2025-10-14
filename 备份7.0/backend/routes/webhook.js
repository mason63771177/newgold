const express = require('express');
const router = express.Router();
const WebhookController = require('../controllers/webhookController');

/**
 * Tatum Webhook路由
 * 处理区块链交易通知
 */

// Tatum充值通知webhook
router.post('/tatum', WebhookController.handleTatumWebhook);

// 测试webhook端点
router.get('/test', WebhookController.testWebhook);

module.exports = router;