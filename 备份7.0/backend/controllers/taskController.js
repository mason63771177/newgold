const db = require('../config/database');
const webSocketService = require('../services/WebSocketService');

// 任务系统控制器
class TaskController {
  constructor() {
    // 模拟数据存储（实际项目中应使用数据库）
    this.users = new Map();
    this.initializeDefaultTasks();
  }

  // 初始化默认任务数据
  initializeDefaultTasks() {
    this.defaultNewbieTasks = [
      { 
        id: 1, 
        title: '教练启程：寻找你的第一位学员', 
        desc: '从今天起，你不再是推销员，而是一名教练。教练的使命是发现有潜力的学员，并帮助他们成长。找到那个愿意学习、渴望改变的人，成为他的引路人。记住：你不是在卖产品，而是在传授成功的方法。', 
        done: false, 
        reward: 10,
        titleReward: '结构初启者'
      },
      { 
        id: 2, 
        title: '教练赋能：培养你的第一位门徒', 
        desc: '优秀的教练不仅要会做，更要会教。现在是时候将你的经验、技巧和心得传授给你的学员了。手把手地教他如何邀请、如何沟通、如何建立信任。你的成功不在于你做了多少，而在于你教会了多少人。', 
        done: false, 
        reward: 10,
        titleReward: '裂变教官'
      },
      { 
        id: 3, 
        title: '教练传承：见证门徒的成长', 
        desc: '最高境界的教练，是培养出能够培养他人的教练。当你的门徒成功地教会了他的第一个学员时，你就完成了从推销员到教练的完美蜕变。这不是终点，而是一个更大传承体系的开始。', 
        done: false, 
        reward: 10,
        titleReward: '裂变教官'
      }
    ];

    this.defaultQuizTasks = [
      { id: 'quiz1', title: '教练资格认证', desc: '完成教练基础理论考试，掌握核心教学方法，正确率达到80%即可获得认证', done: false, reward: 20, feeReduction: 0.02 }
    ];

    this.defaultGodTasks = [
      { id: 1, title: '初级教练院长：培养6名合格教练', desc: '建立你的教练团队：直接培养2名教练，每名教练再培养2名，形成2层教练体系', done: false, reward: 50 },
      { id: 2, title: '中级教练院长：培养39名合格教练', desc: '扩大教练影响力：建立3层教练体系，每层3名教练，培养出39名优秀教练', done: false, reward: 250 },
      { id: 3, title: '高级教练院长：培养340名合格教练', desc: '成为教练界领袖：建立4层教练体系，每层4名教练，影响340名教练的成长', done: false, reward: 1250 },
      { id: 4, title: '资深教练院长：培养3905名合格教练', desc: '打造教练帝国：建立5层教练体系，每层5名教练，培养3905名教练精英', done: false, reward: 6250 },
      { id: 5, title: '传奇教练院长：培养55986名合格教练', desc: '成就教练传奇：建立6层教练体系，每层6名教练，影响55986名教练的职业生涯', done: false, reward: 31250 },
      { id: 6, title: '至尊教练院长：培养960799名合格教练', desc: '登顶教练巅峰：建立7层教练体系，每层7名教练，成为960799名教练的精神导师', done: false, reward: 156250 }
    ];
  }

  // 获取用户任务数据
  getUserTasks(userId = 88) {
    if (!this.users.has(userId)) {
      this.users.set(userId, {
        newbieTasks: JSON.parse(JSON.stringify(this.defaultNewbieTasks)),
        quizTasks: JSON.parse(JSON.stringify(this.defaultQuizTasks)),
        godTasks: JSON.parse(JSON.stringify(this.defaultGodTasks)),
        completedNewbieTasks: 0,
        quizCompleted: false,
        godTasksUnlocked: false,
        godTasksCompleted: 0,
        titles: [] // 用户获得的称号列表
      });
    }
    return this.users.get(userId);
  }

  // 获取任务列表（符合API规范）
  getTaskList = async (req, res) => {
    try {
      const userId = req.user?.id || 88;
      const userTasks = this.getUserTasks(userId);

      // 计算完成的新手任务数量
      const completedNewbieTasks = userTasks.newbieTasks.filter(task => task.done).length;
      
      // 检查答题任务是否完成
      const quizCompleted = userTasks.quizTasks.every(task => task.done);
      
      // 检查大神任务是否解锁（需要完成所有新手任务和答题任务）
      const godTasksUnlocked = completedNewbieTasks >= 3 && quizCompleted;
      
      // 计算完成的大神任务数量
      const godTasksCompleted = userTasks.godTasks.filter(task => task.done).length;

      // 更新用户数据
      userTasks.completedNewbieTasks = completedNewbieTasks;
      userTasks.quizCompleted = quizCompleted;
      userTasks.godTasksUnlocked = godTasksUnlocked;
      userTasks.godTasksCompleted = godTasksCompleted;

      // 转换为API规范格式
      const newbieTasks = userTasks.newbieTasks.map(task => ({
        taskId: task.id,
        taskName: task.title,
        description: task.desc,
        reward: task.reward,
        status: task.done ? 'completed' : 'pending',
        progress: task.done ? '1/1' : '0/1'
      }));

      const quizTasks = userTasks.quizTasks.map(task => ({
        taskId: task.id,
        question: task.title,
        options: ["A. 通过社交媒体分享", "B. 提供优质服务", "C. 诚信推荐", "D. 以上都是"],
        status: task.done ? 'completed' : (completedNewbieTasks >= 1 ? 'pending' : 'locked')
      }));

      const masterTasks = userTasks.godTasks.map(task => ({
        taskId: task.id,
        taskName: task.title,
        description: task.desc,
        targetCount: parseInt(task.desc.match(/(\d+)名/)?.[1] || '0'),
        currentCount: task.done ? parseInt(task.desc.match(/(\d+)名/)?.[1] || '0') : 0,
        reward: task.reward,
        status: task.done ? 'completed' : (godTasksUnlocked ? 'pending' : 'locked')
      }));

      res.json({
        code: 200,
        message: 'success',
        data: {
          newbieTasks,
          quizTasks,
          masterTasks
        },
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('获取任务列表失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取任务列表失败',
        timestamp: Date.now()
      });
    }
  }

  // 获取任务状态（保持兼容性）
  getTaskStatus = async (req, res) => {
    try {
      const userId = req.user?.id || 88;
      const userTasks = this.getUserTasks(userId);

      // 计算完成的新手任务数量
      const completedNewbieTasks = userTasks.newbieTasks.filter(task => task.done).length;
      
      // 检查答题任务是否完成
      const quizCompleted = userTasks.quizTasks.every(task => task.done);
      
      // 检查大神任务是否解锁（需要完成所有新手任务和答题任务）
      const godTasksUnlocked = completedNewbieTasks >= 3 && quizCompleted;
      
      // 计算完成的大神任务数量
      const godTasksCompleted = userTasks.godTasks.filter(task => task.done).length;

      // 更新用户数据
      userTasks.completedNewbieTasks = completedNewbieTasks;
      userTasks.quizCompleted = quizCompleted;
      userTasks.godTasksUnlocked = godTasksUnlocked;
      userTasks.godTasksCompleted = godTasksCompleted;

      res.json({
        success: true,
        data: {
          newbieTasks: userTasks.newbieTasks,
          quizTasks: userTasks.quizTasks,
          godTasks: userTasks.godTasks,
          completedNewbieTasks,
          quizCompleted,
          godTasksUnlocked,
          godTasksCompleted
        }
      });
    } catch (error) {
      console.error('获取任务状态失败:', error);
      res.status(500).json({
        success: false,
        message: '获取任务状态失败'
      });
    }
  }

  // 完成任务（符合API规范）
  completeTask = async (req, res) => {
    try {
      const { taskId, taskType } = req.body;
      const userId = req.user?.id || 88;
      
      if (!taskId || !taskType) {
        return res.status(400).json({
          code: 400,
          message: '任务ID和任务类型不能为空',
          timestamp: Date.now()
        });
      }

      const userTasks = this.getUserTasks(userId);
      let task = null;
      let reward = 0;

      if (taskType === 'newbie') {
        task = userTasks.newbieTasks.find(t => t.id === parseInt(taskId));
        
        if (!task) {
          return res.status(404).json({
            code: 404,
            message: '新手任务不存在',
            timestamp: Date.now()
          });
        }

        if (task.done) {
          return res.status(400).json({
            code: 400,
            message: '任务已完成',
            timestamp: Date.now()
          });
        }

        // 检查任务顺序（必须按0→1→2→3顺序完成）
        const completedCount = userTasks.newbieTasks.filter(t => t.done).length;
        if (task.id !== completedCount + 1) {
          return res.status(400).json({
            code: 400,
            message: '请按顺序完成任务',
            timestamp: Date.now()
          });
        }

        // 完成任务
        task.done = true;
        reward = task.reward;
        userTasks.completedNewbieTasks = userTasks.newbieTasks.filter(t => t.done).length;

        // 授予称号奖励
        if (task.titleReward && !userTasks.titles.includes(task.titleReward)) {
          userTasks.titles.push(task.titleReward);
        }

      } else if (taskType === 'god' || taskType === 'master') {
        task = userTasks.godTasks.find(t => t.id === parseInt(taskId));
        
        if (!task) {
          return res.status(404).json({
            code: 404,
            message: '大神任务不存在',
            timestamp: Date.now()
          });
        }

        if (task.done) {
          return res.status(400).json({
            code: 400,
            message: '任务已完成',
            timestamp: Date.now()
          });
        }

        // 检查是否已解锁大神任务
        if (userTasks.completedNewbieTasks < 3 || !userTasks.quizCompleted) {
          return res.status(400).json({
            code: 400,
            message: '请先完成所有新手任务和答题任务',
            timestamp: Date.now()
          });
        }

        // 完成任务
        task.done = true;
        reward = task.reward;
        userTasks.godTasksCompleted = userTasks.godTasks.filter(t => t.done).length;
      } else {
        return res.status(400).json({
          code: 400,
          message: '不支持的任务类型',
          timestamp: Date.now()
        });
      }

      // 模拟更新钱包余额
      const currentBalance = 150.50; // 这里应该从钱包系统获取
      const newBalance = currentBalance + reward;

      // 发送任务完成通知
      webSocketService.sendTaskComplete(userId, {
        taskName: task.title,
        reward,
        message: `恭喜您完成任务：${task.title}`
      });

      res.json({
        code: 200,
        message: '任务完成',
        data: {
          reward,
          newBalance,
          titleReward: task.titleReward || null,
          userTitles: userTasks.titles
        },
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('完成任务失败:', error);
      res.status(500).json({
        code: 500,
        message: '完成任务失败',
        timestamp: Date.now()
      });
    }
  }

  // 答题接口（符合API规范）
  answerQuiz = async (req, res) => {
    try {
      const { questionId, answer } = req.body;
      const userId = req.user?.id || 88;
      
      if (!questionId || !answer) {
        return res.status(400).json({
          code: 400,
          message: '问题ID和答案不能为空',
          timestamp: Date.now()
        });
      }

      const userTasks = this.getUserTasks(userId);
      
      // 检查是否已完成至少1个新手任务
      if (userTasks.completedNewbieTasks < 1) {
        return res.status(400).json({
          code: 400,
          message: '请先完成新手任务',
          timestamp: Date.now()
        });
      }

      const task = userTasks.quizTasks.find(t => t.id === questionId);
      
      if (!task) {
        return res.status(404).json({
          code: 404,
          message: '答题任务不存在',
          timestamp: Date.now()
        });
      }

      if (task.done) {
        return res.status(400).json({
          code: 400,
          message: '答题任务已完成',
          timestamp: Date.now()
        });
      }

      // 模拟答题逻辑（这里简化处理，实际应该有题库）
      const isCorrect = answer === 'D'; // 假设正确答案是D
      const currentFeeRate = 5.0 - (isCorrect ? task.feeReduction : 0);

      if (isCorrect) {
        task.done = true;
        userTasks.quizCompleted = userTasks.quizTasks.every(t => t.done);
      }

      res.json({
        code: 200,
        message: isCorrect ? '回答正确' : '回答错误',
        data: {
          correct: isCorrect,
          feeReduction: isCorrect ? task.feeReduction : 0,
          currentFeeRate
        },
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('答题失败:', error);
      res.status(500).json({
        code: 500,
        message: '答题失败',
        timestamp: Date.now()
      });
    }
  }

  /**
   * 验证教练行为逻辑
   * @param {string} userId - 用户ID
   * @param {number} taskId - 任务ID
   * @returns {boolean} - 是否满足任务完成条件
   */
  async validateCoachBehavior(userId, taskId) {
    const teamController = require('./teamController');
    const teamRelations = teamController.teamRelations;
    const userRelation = teamRelations.get(userId) || { children: [], descendants: [] };

    switch (taskId) {
      case 1: // 破晓之光：点燃燎原之火 - 完成首次直接推荐
        return userRelation.children.length >= 1;
      
      case 2: // 赋能之手：铸造你的门徒 - 帮助首位直推成员完成他的首次推荐
        if (userRelation.children.length === 0) return false;
        // 检查第一个直推成员是否有下级
        const firstChild = userRelation.children[0];
        const childRelation = teamRelations.get(firstChild) || { children: [] };
        return childRelation.children.length >= 1;
      
      case 3: // 裂变之核：传承燎原之火 - 门徒成功铸造了他的第一位门徒
        if (userRelation.children.length === 0) return false;
        // 检查是否有二级下线（孙子辈）
        for (const childId of userRelation.children) {
          const childRelation = teamRelations.get(childId) || { children: [] };
          if (childRelation.children.length >= 1) {
            return true;
          }
        }
        return false;
      
      default:
        return true;
    }
  }

  /**
   * 获取任务验证失败的提示信息
   * @param {number} taskId - 任务ID
   * @returns {string} - 提示信息
   */
  getTaskValidationMessage(taskId) {
    switch (taskId) {
      case 1:
        return '请先完成首次直接推荐才能完成此任务';
      case 2:
        return '请先帮助您的第一位门徒完成他的首次推荐';
      case 3:
        return '您的门徒还未成功铸造他的第一位门徒';
      default:
        return '任务条件未满足';
    }
  }

  // 完成新手任务（保持兼容性）
  completeNewbieTask = async (req, res) => {
    try {
      const { taskId } = req.body;
      const userId = req.user?.id || 88; // 使用实际存在的用户ID
      
      if (!taskId) {
        return res.status(400).json({
          success: false,
          message: '任务ID不能为空'
        });
      }

      const userTasks = this.getUserTasks(userId);
      const task = userTasks.newbieTasks.find(t => t.id === parseInt(taskId));
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      if (task.done) {
        return res.status(400).json({
          success: false,
          message: '任务已完成'
        });
      }

      // 检查任务顺序（必须按0→1→2→3顺序完成）
      const completedCount = userTasks.newbieTasks.filter(t => t.done).length;
      if (task.id !== completedCount + 1) {
        return res.status(400).json({
          success: false,
          message: '请按顺序完成任务'
        });
      }

      // 验证教练行为逻辑
      const isTaskValid = await this.validateCoachBehavior(userId, task.id);
      if (!isTaskValid) {
        return res.status(400).json({
          success: false,
          message: this.getTaskValidationMessage(task.id)
        });
      }

      // 完成任务
      task.done = true;
      userTasks.completedNewbieTasks = userTasks.newbieTasks.filter(t => t.done).length;

      // 授予称号奖励
      if (task.titleReward && !userTasks.titles.includes(task.titleReward)) {
        userTasks.titles.push(task.titleReward);
      }

      // 发放10 USDT任务奖励
      const rewardAmount = 10; // 每个新手任务奖励10 USDT
      let newBalance = 0;
      
      try {
        const User = require('../models/User');
        const user = await User.findById(userId);
        if (user) {
          await user.updateBalance(rewardAmount, 'add');
          newBalance = user.balance;
          
          // 记录交易
          const { pool } = require('../config/database');
          const connection = await pool.getConnection();
          try {
            await connection.execute(
              'INSERT INTO transactions (user_id, type, amount, status, description, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
              [userId, 'task_reward', rewardAmount, 'completed', `新手任务${taskId}奖励`]
            );
          } finally {
            connection.release();
          }
        }
      } catch (error) {
        console.error('发放任务奖励失败:', error);
        // 继续执行，不因为奖励发放失败而影响任务完成
      }

      // 检查是否解锁答题任务
      const shouldUnlockQuiz = userTasks.completedNewbieTasks >= 1 && !userTasks.quizCompleted;

      res.json({
        success: true,
        message: '任务完成成功',
        data: {
          taskId,
          reward: rewardAmount,
          titleReward: task.titleReward || null,
          userTitles: userTasks.titles,
          completedNewbieTasks: userTasks.completedNewbieTasks,
          shouldUnlockQuiz,
          newbieTasks: userTasks.newbieTasks,
          newBalance: newBalance
        }
      });
    } catch (error) {
      console.error('完成新手任务失败:', error);
      console.error('错误详情:', error.message);
      console.error('错误堆栈:', error.stack);
      res.status(500).json({
        success: false,
        message: '完成任务失败',
        error: error.message // 添加具体错误信息用于调试
      });
    }
  }

  // 完成答题任务
  completeQuizTask = async (req, res) => {
    try {
      const { taskId, score, correctRate } = req.body;
      const userId = req.user?.id || 88;
      
      if (!taskId) {
        return res.status(400).json({
          success: false,
          message: '任务ID不能为空'
        });
      }

      const userTasks = this.getUserTasks(userId);
      
      // 检查是否已完成至少1个新手任务
      if (userTasks.completedNewbieTasks < 1) {
        return res.status(400).json({
          success: false,
          message: '请先完成新手任务'
        });
      }

      const task = userTasks.quizTasks.find(t => t.id === taskId);
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: '答题任务不存在'
        });
      }

      if (task.done) {
        return res.status(400).json({
          success: false,
          message: '答题任务已完成'
        });
      }

      // 检查正确率（需要达到80%）
      if (correctRate < 0.8) {
        return res.status(400).json({
          success: false,
          message: '正确率不足80%，请重新答题'
        });
      }

      // 完成答题任务
      task.done = true;
      userTasks.quizCompleted = userTasks.quizTasks.every(t => t.done);

      // 发放10 USDT任务奖励
      const rewardAmount = 10; // 答题任务奖励10 USDT
      let newBalance = 0;
      
      try {
        const User = require('../models/User');
        const user = await User.findById(userId);
        if (user) {
          await user.updateBalance(rewardAmount, 'add');
          newBalance = user.balance;
          
          // 记录交易
          const { pool } = require('../config/database');
          const connection = await pool.getConnection();
          try {
            await connection.execute(
              'INSERT INTO transactions (user_id, type, amount, status, description, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
              [userId, 'task_reward', rewardAmount, 'completed', `答题任务${taskId}奖励`]
            );
          } finally {
            connection.release();
          }
        }
      } catch (error) {
        console.error('发放答题任务奖励失败:', error);
        // 继续执行，不因为奖励发放失败而影响任务完成
      }

      // 检查是否解锁大神任务
      const shouldUnlockGodTasks = userTasks.completedNewbieTasks >= 3 && userTasks.quizCompleted;

      res.json({
        success: true,
        message: '答题任务完成成功',
        data: {
          taskId,
          reward: rewardAmount,
          feeReduction: task.feeReduction,
          score,
          correctRate,
          quizCompleted: userTasks.quizCompleted,
          shouldUnlockGodTasks,
          quizTasks: userTasks.quizTasks,
          newBalance: newBalance
        }
      });
    } catch (error) {
      console.error('完成答题任务失败:', error);
      res.status(500).json({
        success: false,
        message: '完成答题任务失败'
      });
    }
  }

  // 完成大神任务
  completeGodTask = async (req, res) => {
    try {
      const { taskId } = req.body;
      const userId = req.user?.id || 88;
      
      if (!taskId) {
        return res.status(400).json({
          success: false,
          message: '任务ID不能为空'
        });
      }

      const userTasks = this.getUserTasks(userId);
      
      // 检查是否已解锁大神任务
      if (userTasks.completedNewbieTasks < 3 || !userTasks.quizCompleted) {
        return res.status(400).json({
          success: false,
          message: '请先完成所有新手任务和答题任务'
        });
      }

      const task = userTasks.godTasks.find(t => t.id === parseInt(taskId));
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: '大神任务不存在'
        });
      }

      if (task.done) {
        return res.status(400).json({
          success: false,
          message: '大神任务已完成'
        });
      }

      // 完成大神任务
      task.done = true;
      userTasks.godTasksCompleted = userTasks.godTasks.filter(t => t.done).length;

      // 发放10 USDT任务奖励
      const rewardAmount = 10; // 大神任务奖励10 USDT
      let newBalance = 0;
      
      try {
        const User = require('../models/User');
        const user = await User.findById(userId);
        if (user) {
          await user.updateBalance(rewardAmount, 'add');
          newBalance = user.balance;
          
          // 记录交易
          const { pool } = require('../config/database');
          const connection = await pool.getConnection();
          try {
            await connection.execute(
              'INSERT INTO transactions (user_id, type, amount, status, description, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
              [userId, 'task_reward', rewardAmount, 'completed', `大神任务${taskId}奖励`]
            );
          } finally {
            connection.release();
          }
        }
      } catch (error) {
        console.error('发放大神任务奖励失败:', error);
        // 继续执行，不因为奖励发放失败而影响任务完成
      }

      res.json({
        success: true,
        message: '大神任务完成成功',
        data: {
          taskId,
          reward: rewardAmount,
          godTasksCompleted: userTasks.godTasksCompleted,
          godTasks: userTasks.godTasks,
          newBalance: newBalance
        }
      });
    } catch (error) {
      console.error('完成大神任务失败:', error);
      res.status(500).json({
        success: false,
        message: '完成大神任务失败'
      });
    }
  }

  // 重置任务（用于测试）
  resetTasks = async (req, res) => {
    try {
      const userId = req.user?.id || 88;
      
      // 重置用户任务数据
      this.users.set(userId, {
        newbieTasks: JSON.parse(JSON.stringify(this.defaultNewbieTasks)),
        quizTasks: JSON.parse(JSON.stringify(this.defaultQuizTasks)),
        godTasks: JSON.parse(JSON.stringify(this.defaultGodTasks)),
        completedNewbieTasks: 0,
        quizCompleted: false,
        godTasksUnlocked: false,
        godTasksCompleted: 0
      });

      res.json({
        success: true,
        message: '任务重置成功'
      });
    } catch (error) {
      console.error('重置任务失败:', error);
      res.status(500).json({
        success: false,
        message: '重置任务失败'
      });
    }
  }
}

module.exports = new TaskController();