const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // 存储客户端连接 userId -> WebSocket
    this.rooms = new Map(); // 存储房间信息 roomId -> Set<userId>
  }

  // 初始化WebSocket服务器
  initialize(server) {
    this.wss = new WebSocket.Server({
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    console.log('🔌 WebSocket服务器已启动');
  }

  // 验证客户端连接
  verifyClient(info) {
    try {
      const query = url.parse(info.req.url, true).query;
      const token = query.token;

      console.log('🔍 WebSocket验证 - 收到token:', token ? token.substring(0, 20) + '...' : 'null');
      console.log('🔍 WebSocket验证 - 使用JWT_SECRET:', process.env.JWT_SECRET ? 'loaded' : 'not loaded');

      if (!token) {
        console.log('❌ WebSocket连接被拒绝: 缺少token');
        return false;
      }

      // 测试模式：支持模拟token
      if (token.startsWith('mock-token-')) {
        const userId = token.replace('mock-token-', '');
        info.req.user = { 
          id: parseInt(userId) || userId,
          userId: parseInt(userId) || userId,
          username: `test_user_${userId}`,
          status: 1
        };
        console.log('✅ WebSocket验证成功 - Mock用户ID:', userId);
        return true;
      }

      // 验证JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log('✅ WebSocket验证成功 - 用户ID:', decoded.userId);
      info.req.user = decoded;
      return true;
    } catch (error) {
      console.log('❌ WebSocket连接被拒绝: token无效', error.message);
      return false;
    }
  }

  // 处理新连接
  handleConnection(ws, req) {
    const user = req.user;
    const userId = user.id;

    console.log(`✅ 用户 ${userId} 已连接WebSocket`);

    // 存储客户端连接
    this.clients.set(userId, ws);

    // 发送连接成功消息
    this.sendToUser(userId, {
      type: 'connection_success',
      data: {
        message: '连接成功',
        userId: userId,
        timestamp: Date.now()
      }
    });

    // 处理消息
    ws.on('message', (message) => {
      this.handleMessage(userId, message);
    });

    // 处理断开连接
    ws.on('close', () => {
      console.log(`❌ 用户 ${userId} 断开WebSocket连接`);
      this.clients.delete(userId);
      this.removeUserFromAllRooms(userId);
    });

    // 处理错误
    ws.on('error', (error) => {
      console.error(`WebSocket错误 (用户 ${userId}):`, error);
    });

    // 发送心跳包
    this.startHeartbeat(ws, userId);
  }

  // 处理客户端消息
  handleMessage(userId, message) {
    try {
      const data = JSON.parse(message);
      console.log(`📨 收到用户 ${userId} 消息:`, data);

      switch (data.type) {
        case 'ping':
          this.sendToUser(userId, { type: 'pong', timestamp: Date.now() });
          break;
        case 'join_room':
          this.joinRoom(userId, data.roomId);
          break;
        case 'leave_room':
          this.leaveRoom(userId, data.roomId);
          break;
        default:
          console.log(`未知消息类型: ${data.type}`);
      }
    } catch (error) {
      console.error('解析WebSocket消息失败:', error);
    }
  }

  // 发送消息给指定用户
  sendToUser(userId, message) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  // 广播消息给所有在线用户
  broadcast(message) {
    let sentCount = 0;
    this.clients.forEach((client, userId) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
        sentCount++;
      }
    });
    console.log(`📢 广播消息给 ${sentCount} 个用户`);
    return sentCount;
  }

  // 发送消息给房间内的所有用户
  sendToRoom(roomId, message) {
    const room = this.rooms.get(roomId);
    if (!room) return 0;

    let sentCount = 0;
    room.forEach(userId => {
      if (this.sendToUser(userId, message)) {
        sentCount++;
      }
    });
    console.log(`📢 发送消息给房间 ${roomId} 的 ${sentCount} 个用户`);
    return sentCount;
  }

  // 用户加入房间
  joinRoom(userId, roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(userId);
    console.log(`👥 用户 ${userId} 加入房间 ${roomId}`);

    // 通知用户加入成功
    this.sendToUser(userId, {
      type: 'room_joined',
      data: { roomId, timestamp: Date.now() }
    });
  }

  // 用户离开房间
  leaveRoom(userId, roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(userId);
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
      console.log(`👋 用户 ${userId} 离开房间 ${roomId}`);

      // 通知用户离开成功
      this.sendToUser(userId, {
        type: 'room_left',
        data: { roomId, timestamp: Date.now() }
      });
    }
  }

  // 从所有房间移除用户
  removeUserFromAllRooms(userId) {
    this.rooms.forEach((room, roomId) => {
      if (room.has(userId)) {
        room.delete(userId);
        if (room.size === 0) {
          this.rooms.delete(roomId);
        }
      }
    });
  }

  // 启动心跳检测
  startHeartbeat(ws, userId) {
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(interval);
      }
    }, 30000); // 30秒心跳

    ws.on('pong', () => {
      // 收到pong响应，连接正常
    });

    ws.on('close', () => {
      clearInterval(interval);
    });
  }

  // 发送倒计时更新
  sendCountdownUpdate(data) {
    return this.broadcast({
      type: 'countdown_update',
      data: {
        ...data,
        timestamp: Date.now()
      }
    });
  }

  // 发送红包开始通知
  sendRedpacketStart(data) {
    return this.broadcast({
      type: 'redpacket_start',
      data: {
        title: '红包活动开始',
        message: '快来抢红包！',
        ...data,
        timestamp: Date.now()
      }
    });
  }

  // 发送红包结束通知
  sendRedpacketEnd(data) {
    return this.broadcast({
      type: 'redpacket_end',
      data: {
        title: '红包活动结束',
        message: '红包活动已结束',
        ...data,
        timestamp: Date.now()
      }
    });
  }

  // 发送任务完成通知
  sendTaskComplete(userId, data) {
    return this.sendToUser(userId, {
      type: 'task_complete',
      data: {
        title: '任务完成',
        message: '恭喜您完成任务！',
        ...data,
        timestamp: Date.now()
      }
    });
  }

  // 发送系统通知
  sendNotification(userId, data) {
    const message = {
      type: 'notification',
      data: {
        ...data,
        timestamp: Date.now()
      }
    };

    if (userId) {
      return this.sendToUser(userId, message);
    } else {
      return this.broadcast(message);
    }
  }

  // 获取在线用户数量
  getOnlineUserCount() {
    return this.clients.size;
  }

  // 获取房间信息
  getRoomInfo(roomId) {
    const room = this.rooms.get(roomId);
    return {
      roomId,
      userCount: room ? room.size : 0,
      users: room ? Array.from(room) : []
    };
  }

  // 获取所有房间信息
  getAllRoomsInfo() {
    const roomsInfo = [];
    this.rooms.forEach((room, roomId) => {
      roomsInfo.push(this.getRoomInfo(roomId));
    });
    return roomsInfo;
  }

  // 关闭WebSocket服务器
  close() {
    if (this.wss) {
      this.wss.close();
      console.log('🔌 WebSocket服务器已关闭');
    }
  }
}

// 创建单例实例
const webSocketService = new WebSocketService();

module.exports = webSocketService;