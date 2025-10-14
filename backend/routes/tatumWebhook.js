/**
 * Tatum Webhook回调处理路由
 * 接收Tatum Virtual Accounts的入金通知并处理
 */

const express = require('express');
const router = express.Router();
const tatumVirtualAccountService = require('../services/tatumVirtualAccountService');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');

/**
 * 验证Webhook签名（如果Tatum提供签名验证）
 * @param {Object} req - 请求对象
 * @param {string} signature - 签名
 * @returns {boolean} 验证结果
 */
function verifyWebhookSignature(req, signature) {
    try {
        // 如果Tatum提供Webhook签名验证，在这里实现
        // 目前Tatum可能不提供签名验证，所以暂时返回true
        return true;
    } catch (error) {
        console.error('Webhook签名验证失败:', error);
        return false;
    }
}

/**
 * Tatum入金回调接口
 * POST /api/tatum/webhook
 */
router.post('/webhook', [
    // 基础验证
    body('subscriptionType').notEmpty().withMessage('订阅类型不能为空'),
    body('accountId').optional().isString().withMessage('账户ID必须是字符串'),
    body('currency').optional().isString().withMessage('币种必须是字符串'),
    body('amount').optional().isNumeric().withMessage('金额必须是数字'),
    body('txId').optional().isString().withMessage('交易ID必须是字符串')
], async (req, res) => {
    try {
        console.log('📥 收到Tatum Webhook回调:', {
            headers: req.headers,
            body: req.body,
            timestamp: new Date().toISOString()
        });

        // 验证请求参数
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.error('❌ Webhook参数验证失败:', errors.array());
            return res.status(400).json({
                success: false,
                error: 'Invalid parameters',
                details: errors.array()
            });
        }

        // 验证签名（如果需要）
        const signature = req.headers['x-tatum-signature'];
        if (signature && !verifyWebhookSignature(req, signature)) {
            console.error('❌ Webhook签名验证失败');
            return res.status(401).json({
                success: false,
                error: 'Invalid signature'
            });
        }

        const webhookData = req.body;
        const { subscriptionType } = webhookData;

        // 处理不同类型的回调
        let result;
        switch (subscriptionType) {
            case 'ACCOUNT_INCOMING_BLOCKCHAIN_TRANSACTION':
                // 处理入金回调
                result = await tatumVirtualAccountService.processDepositCallback(webhookData);
                break;
                
            case 'ACCOUNT_OUTGOING_BLOCKCHAIN_TRANSACTION':
                // 处理出金回调（如果需要）
                console.log('📤 收到出金回调，暂不处理:', webhookData);
                result = { success: true, message: 'Outgoing transaction noted' };
                break;
                
            default:
                console.log(`⚠️ 未知的订阅类型: ${subscriptionType}`);
                result = { success: false, reason: 'Unknown subscription type' };
        }

        // 返回处理结果
        if (result.success) {
            console.log('✅ Webhook处理成功:', result);
            
            // 如果是成功的入金，发送通知到业务系统
            if (subscriptionType === 'ACCOUNT_INCOMING_BLOCKCHAIN_TRANSACTION' && result.success) {
                await sendDepositNotification(result);
            }
            
            res.status(200).json({
                success: true,
                message: 'Webhook processed successfully',
                data: result
            });
        } else {
            console.log('⚠️ Webhook处理失败:', result);
            res.status(200).json({
                success: false,
                message: result.reason || 'Processing failed',
                data: result
            });
        }

    } catch (error) {
        console.error('❌ Webhook处理异常:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * 发送充值成功通知到业务系统
 * @param {Object} depositResult - 充值处理结果
 */
async function sendDepositNotification(depositResult) {
    try {
        const {
            userId,
            accountId,
            amount,
            txHash,
            blockNumber,
            timestamp
        } = depositResult;

        // 构造通知数据
        const notificationData = {
            event: 'member_deposit',
            memberId: userId,
            amount: amount,
            currency: 'USDT_TRON',
            txHash: txHash,
            blockNumber: blockNumber,
            accountId: accountId,
            timestamp: timestamp,
            status: 'confirmed'
        };

        console.log('📢 发送充值通知:', notificationData);

        // 这里可以添加发送通知的逻辑，比如：
        // 1. 发送到消息队列
        // 2. 调用业务系统API
        // 3. 发送邮件/短信通知
        // 4. 更新前端实时状态

        // 示例：发送到Redis消息队列
        const { redisClient } = require('../config/database');
        if (redisClient) {
            await redisClient.publish('deposit_notifications', JSON.stringify(notificationData));
            console.log('✅ 充值通知已发送到Redis队列');
        }

        // 示例：调用业务系统回调接口
        const callbackUrl = process.env.BUSINESS_CALLBACK_URL;
        if (callbackUrl) {
            const axios = require('axios');
            try {
                await axios.post(callbackUrl, notificationData, {
                    timeout: 10000,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': process.env.BUSINESS_API_KEY || ''
                    }
                });
                console.log('✅ 业务系统回调通知发送成功');
            } catch (callbackError) {
                console.error('❌ 业务系统回调通知发送失败:', callbackError.message);
            }
        }

    } catch (error) {
        console.error('❌ 发送充值通知失败:', error);
    }
}

/**
 * 获取Webhook状态接口
 * GET /api/tatum/webhook/status
 */
router.get('/webhook/status', async (req, res) => {
    try {
        // 检查服务状态
        const isInitialized = tatumVirtualAccountService.isInitialized;
        
        res.json({
            success: true,
            status: {
                service: isInitialized ? 'running' : 'stopped',
                webhookUrl: process.env.WEBHOOK_CALLBACK_URL,
                network: process.env.TATUM_NETWORK,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 手动触发资金归集接口
 * POST /api/tatum/webhook/consolidate
 */
router.post('/consolidate', async (req, res) => {
    try {
        const { accountId } = req.body;

        let result;
        if (accountId) {
            // 归集指定账户
            result = await tatumVirtualAccountService.consolidateFunds(accountId);
        } else {
            // 批量归集所有账户
            result = await tatumVirtualAccountService.batchConsolidateAllFunds();
        }

        res.json({
            success: true,
            message: 'Fund consolidation completed',
            data: result
        });

    } catch (error) {
        console.error('❌ 手动归集失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 测试Webhook接口
 * POST /api/tatum/webhook/test
 */
router.post('/test', async (req, res) => {
    try {
        const testData = {
            subscriptionType: 'ACCOUNT_INCOMING_BLOCKCHAIN_TRANSACTION',
            accountId: 'test_account_id',
            currency: 'USDT_TRON',
            amount: '10.5',
            txId: 'test_tx_hash_' + Date.now(),
            blockNumber: 12345678,
            address: 'TTestAddress123456789'
        };

        console.log('🧪 测试Webhook数据:', testData);

        res.json({
            success: true,
            message: 'Test webhook data received',
            data: testData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;