const webSocketService = require('./WebSocketService');

class CountdownService {
  constructor() {
    this.intervals = new Map();
    this.redpacketSchedule = [
      { hour: 9, minute: 0 },   // 9:00
      { hour: 12, minute: 0 },  // 12:00
      { hour: 20, minute: 0 }   // 20:00
    ];
    this.eventDuration = 77; // 77秒
    this.initialized = false;
  }

  init() {
    if (this.initialized) {
      console.log('倒计时服务已经初始化过了');
      return;
    }
    
    // 启动倒计时服务
    this.startCountdownTimer();
    this.initialized = true;
    console.log('倒计时服务已启动');
  }

  // 获取下一个红包活动时间
  getNextRedpacketTime() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    for (const schedule of this.redpacketSchedule) {
      const eventTime = new Date(today.getTime() + schedule.hour * 60 * 60 * 1000 + schedule.minute * 60 * 1000);
      
      if (eventTime > now) {
        return eventTime;
      }
    }
    
    // 如果今天的活动都结束了，返回明天第一个活动时间
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    return new Date(tomorrow.getTime() + this.redpacketSchedule[0].hour * 60 * 60 * 1000 + this.redpacketSchedule[0].minute * 60 * 1000);
  }

  // 检查当前是否在红包活动时间窗口内
  isRedpacketActive() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();
    
    for (const schedule of this.redpacketSchedule) {
      if (currentHour === schedule.hour && currentMinute === schedule.minute) {
        // 在活动开始的那一分钟内，检查是否在77秒窗口内
        if (currentSecond <= this.eventDuration) {
          return true;
        }
      }
    }
    
    return false;
  }

  // 获取当前红包活动剩余时间
  getCurrentRedpacketRemainingTime() {
    if (!this.isRedpacketActive()) {
      return 0;
    }
    
    const now = new Date();
    const currentSecond = now.getSeconds();
    return Math.max(0, this.eventDuration - currentSecond);
  }

  // 启动倒计时定时器
  startCountdownTimer() {
    // 每秒更新一次倒计时
    const countdownInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
    
    this.intervals.set('countdown', countdownInterval);
  }

  // 更新倒计时
  updateCountdown() {
    const now = new Date();
    const nextEventTime = this.getNextRedpacketTime();
    const remainingTime = Math.max(0, Math.floor((nextEventTime - now) / 1000));
    
    // 检查是否在红包活动时间
    const isActive = this.isRedpacketActive();
    const activeRemainingTime = this.getCurrentRedpacketRemainingTime();
    
    // 发送倒计时更新
    const countdownData = {
      eventType: 'redpacket',
      remainingTime: isActive ? activeRemainingTime : remainingTime,
      nextEventTime: nextEventTime.getTime(),
      isActive,
      activeRemainingTime
    };
    
    webSocketService.sendCountdownUpdate(countdownData);
    
    // 检查红包活动开始
    if (isActive && activeRemainingTime === this.eventDuration) {
      this.onRedpacketStart();
    }
    
    // 检查红包活动结束
    if (isActive && activeRemainingTime === 0) {
      this.onRedpacketEnd();
    }
  }

  // 红包活动开始事件
  onRedpacketStart() {
    console.log('红包活动开始');
    webSocketService.sendRedpacketStart({
      totalAmount: 1000,
      duration: this.eventDuration,
      message: '红包活动开始，快来抢红包！'
    });
  }

  // 红包活动结束事件
  onRedpacketEnd() {
    console.log('红包活动结束');
    webSocketService.sendRedpacketEnd({
      totalAmount: 1000,
      participantCount: 0, // 这里应该从数据库获取实际数据
      distributedAmount: 0, // 这里应该从数据库获取实际数据
      message: '红包活动已结束'
    });
  }

  // 手动触发红包活动（用于测试）
  triggerRedpacketEvent(duration = 77) {
    console.log('手动触发红包活动');
    
    // 发送开始通知
    webSocketService.sendRedpacketStart({
      totalAmount: 1000,
      duration,
      message: '红包活动开始，快来抢红包！'
    });
    
    // 设置结束定时器
    setTimeout(() => {
      webSocketService.sendRedpacketEnd({
        totalAmount: 1000,
        participantCount: 0,
        distributedAmount: 0,
        message: '红包活动已结束'
      });
    }, duration * 1000);
  }

  // 获取倒计时状态
  getCountdownStatus() {
    const now = new Date();
    const nextEventTime = this.getNextRedpacketTime();
    const remainingTime = Math.max(0, Math.floor((nextEventTime - now) / 1000));
    const isActive = this.isRedpacketActive();
    const activeRemainingTime = this.getCurrentRedpacketRemainingTime();
    
    return {
      eventType: 'redpacket',
      remainingTime: isActive ? activeRemainingTime : remainingTime,
      nextEventTime: nextEventTime.getTime(),
      isActive,
      activeRemainingTime,
      schedule: this.redpacketSchedule,
      eventDuration: this.eventDuration
    };
  }

  // 停止倒计时服务
  stop() {
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
      console.log(`已停止${name}定时器`);
    }
    this.intervals.clear();
  }

  // 重启倒计时服务
  restart() {
    this.stop();
    this.init();
  }
}

module.exports = new CountdownService();