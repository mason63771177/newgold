const express = require('express');
const router = express.Router();
const webSocketService = require('../services/WebSocketService');
const { authenticateToken } = require('../middleware/auth');

// 获取WebSocket连接状态
router.get('/status', authenticateToken, (req, res) => {
  try {
    const onlineCount = webSocketService.getOnlineUserCount();
    const roomsInfo = webSocketService.getAllRoomsInfo();

    res.json({
      code: 200,
      message: 'success',
      data: {
        onlineUsers: onlineCount,
        rooms: roomsInfo,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('获取WebSocket状态失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取连接状态失败',
      timestamp: Date.now()
    });
  }
});

// 发送系统通知
router.post('/notify', authenticateToken, (req, res) => {
  try {
    const { userId, title, message, type = 'notification' } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        code: 400,
        message: '标题和消息内容不能为空',
        timestamp: Date.now()
      });
    }

    const notificationData = {
      title,
      message,
      type
    };

    let sentCount = 0;
    if (userId) {
      // 发送给指定用户
      const sent = webSocketService.sendNotification(userId, notificationData);
      sentCount = sent ? 1 : 0;
    } else {
      // 广播给所有用户
      sentCount = webSocketService.sendNotification(null, notificationData);
    }

    res.json({
      code: 200,
      message: 'success',
      data: {
        sentCount,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('发送通知失败:', error);
    res.status(500).json({
      code: 500,
      message: '发送通知失败',
      timestamp: Date.now()
    });
  }
});

// 发送倒计时更新
router.post('/countdown', authenticateToken, (req, res) => {
  try {
    const { eventType, remainingTime, nextEventTime } = req.body;

    if (!eventType) {
      return res.status(400).json({
        code: 400,
        message: '事件类型不能为空',
        timestamp: Date.now()
      });
    }

    const countdownData = {
      eventType,
      remainingTime: remainingTime || 0,
      nextEventTime: nextEventTime || null
    };

    const sentCount = webSocketService.sendCountdownUpdate(countdownData);

    res.json({
      code: 200,
      message: 'success',
      data: {
        sentCount,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('发送倒计时更新失败:', error);
    res.status(500).json({
      code: 500,
      message: '发送倒计时更新失败',
      timestamp: Date.now()
    });
  }
});

// 发送红包开始通知
router.post('/redpacket/start', authenticateToken, (req, res) => {
  try {
    const { totalAmount, duration } = req.body;

    const redpacketData = {
      totalAmount: totalAmount || 0,
      duration: duration || 77,
      message: '红包活动开始，快来抢红包！'
    };

    const sentCount = webSocketService.sendRedpacketStart(redpacketData);

    res.json({
      code: 200,
      message: 'success',
      data: {
        sentCount,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('发送红包开始通知失败:', error);
    res.status(500).json({
      code: 500,
      message: '发送红包开始通知失败',
      timestamp: Date.now()
    });
  }
});

// 发送红包结束通知
router.post('/redpacket/end', authenticateToken, (req, res) => {
  try {
    const { totalAmount, participantCount, distributedAmount } = req.body;

    const redpacketData = {
      totalAmount: totalAmount || 0,
      participantCount: participantCount || 0,
      distributedAmount: distributedAmount || 0,
      message: '红包活动已结束'
    };

    const sentCount = webSocketService.sendRedpacketEnd(redpacketData);

    res.json({
      code: 200,
      message: 'success',
      data: {
        sentCount,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('发送红包结束通知失败:', error);
    res.status(500).json({
      code: 500,
      message: '发送红包结束通知失败',
      timestamp: Date.now()
    });
  }
});

// 发送任务完成通知
router.post('/task/complete', authenticateToken, (req, res) => {
  try {
    const { userId, taskName, reward } = req.body;

    if (!userId || !taskName) {
      return res.status(400).json({
        code: 400,
        message: '用户ID和任务名称不能为空',
        timestamp: Date.now()
      });
    }

    const taskData = {
      taskName,
      reward: reward || 0,
      message: `恭喜您完成任务：${taskName}`
    };

    const sent = webSocketService.sendTaskComplete(userId, taskData);

    res.json({
      code: 200,
      message: 'success',
      data: {
        sent,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('发送任务完成通知失败:', error);
    res.status(500).json({
      code: 500,
      message: '发送任务完成通知失败',
      timestamp: Date.now()
    });
  }
});

// 获取房间信息
router.get('/room/:roomId', authenticateToken, (req, res) => {
  try {
    const { roomId } = req.params;
    const roomInfo = webSocketService.getRoomInfo(roomId);

    res.json({
      code: 200,
      message: 'success',
      data: roomInfo
    });
  } catch (error) {
    console.error('获取房间信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取房间信息失败',
      timestamp: Date.now()
    });
  }
});

module.exports = router;