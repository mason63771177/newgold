const User = require('../models/User');
const Transaction = require('../models/Transaction');

/**
 * 空结构检测服务
 * 负责检测用户的上级链条是否完整，处理空结构资金分配
 */
class EmptyStructureService {
  
  /**
   * 获取用户的上级链条（最多7层）
   * @param {number} userId - 用户ID
   * @returns {Array} 上级链条数组，按层级排序（直接上级在前）
   */
  static async getAncestorChain(userId) {
    try {
      const ancestors = [];
      let currentUserId = userId;
      
      // 向上追溯最多7层
      for (let level = 0; level < 7; level++) {
        const user = await User.findById(currentUserId);
        if (!user || !user.inviter_id) {
          break; // 没有更多上级了
        }
        
        ancestors.push({
          userId: user.inviter_id,
          level: level + 1, // 第1层是直接上级
          user: await User.findById(user.inviter_id)
        });
        
        currentUserId = user.inviter_id;
      }
      
      return ancestors;
    } catch (error) {
      console.error('获取上级链条失败:', error);
      return [];
    }
  }

  /**
   * 检测空结构并计算资金分配
   * @param {number} userId - 新激活用户的ID
   * @returns {Object} 包含分配方案和空结构资金的对象
   */
  static async detectEmptyStructure(userId) {
    try {
      const ancestors = await this.getAncestorChain(userId);
      const totalRewardAmount = 70; // 总共70 USDT用于团队分佣
      const rewardPerLevel = 10; // 每层10 USDT
      const maxLevels = 7; // 最多7层
      
      // 计算实际可分配的层数
      const actualLevels = ancestors.length;
      const allocatedAmount = actualLevels * rewardPerLevel;
      const emptyStructureAmount = totalRewardAmount - allocatedAmount;
      
      const result = {
        userId: userId,
        totalRewardAmount: totalRewardAmount,
        actualLevels: actualLevels,
        maxLevels: maxLevels,
        allocatedAmount: allocatedAmount,
        emptyStructureAmount: emptyStructureAmount,
        rewardDistribution: ancestors.map(ancestor => ({
          userId: ancestor.userId,
          level: ancestor.level,
          amount: rewardPerLevel,
          username: ancestor.user ? ancestor.user.username : 'Unknown'
        })),
        hasEmptyStructure: emptyStructureAmount > 0
      };
      
      console.log(`空结构检测结果 - 用户${userId}:`, {
        实际上级层数: actualLevels,
        可分配金额: allocatedAmount,
        空结构金额: emptyStructureAmount
      });
      
      return result;
    } catch (error) {
      console.error('检测空结构失败:', error);
      throw error;
    }
  }

  /**
   * 分配多层级奖励
   * @param {Object} distributionPlan - 分配方案
   * @param {number} newUserId - 新用户ID
   * @returns {Array} 成功分配的交易记录
   */
  static async distributeMultiLevelRewards(distributionPlan, newUserId) {
    const successfulTransactions = [];
    
    try {
      for (const reward of distributionPlan.rewardDistribution) {
        try {
          // 给上级增加余额
          const ancestor = await User.findById(reward.userId);
          if (ancestor) {
            await ancestor.updateBalance(reward.amount, 'add');
            
            // 记录奖励交易
            const transaction = await Transaction.create({
              userId: reward.userId,
              type: 'multi_level_reward',
              amount: reward.amount,
              status: 'completed',
              description: `第${reward.level}层邀请奖励 - 用户${newUserId}激活`,
              relatedUserId: newUserId,
              metadata: {
                level: reward.level,
                rewardType: 'multi_level',
                sourceUserId: newUserId
              }
            });
            
            successfulTransactions.push(transaction);
            console.log(`第${reward.level}层奖励分配成功: 用户${reward.userId} 获得 ${reward.amount} USDT`);
          }
        } catch (error) {
          console.error(`分配第${reward.level}层奖励失败:`, error);
        }
      }
      
      return successfulTransactions;
    } catch (error) {
      console.error('分配多层级奖励失败:', error);
      throw error;
    }
  }

  /**
   * 处理空结构资金
   * @param {Object} distributionPlan - 分配方案
   * @param {number} newUserId - 新用户ID
   * @returns {Object} 空结构资金处理结果
   */
  static async handleEmptyStructureFunds(distributionPlan, newUserId) {
    try {
      if (!distributionPlan.hasEmptyStructure || distributionPlan.emptyStructureAmount <= 0) {
        return {
          success: true,
          amount: 0,
          message: '无空结构资金需要处理'
        };
      }
      
      // 获取项目方系统账户ID（这里需要根据实际情况配置）
      const SYSTEM_ACCOUNT_ID = 1; // 假设系统账户ID为1
      
      // 将空结构资金转入项目方账户
      const systemUser = await User.findById(SYSTEM_ACCOUNT_ID);
      if (systemUser) {
        await systemUser.updateBalance(distributionPlan.emptyStructureAmount, 'add');
      }
      
      // 记录空结构资金交易
      const emptyStructureTransaction = await Transaction.create({
        userId: SYSTEM_ACCOUNT_ID,
        type: 'empty_structure_fund',
        amount: distributionPlan.emptyStructureAmount,
        status: 'completed',
        description: `空结构资金 - 用户${newUserId}激活，缺失${7 - distributionPlan.actualLevels}层上级`,
        relatedUserId: newUserId,
        metadata: {
          actualLevels: distributionPlan.actualLevels,
          missingLevels: 7 - distributionPlan.actualLevels,
          sourceUserId: newUserId,
          fundType: 'empty_structure'
        }
      });
      
      console.log(`空结构资金处理成功: ${distributionPlan.emptyStructureAmount} USDT 转入项目方账户`);
      
      return {
        success: true,
        amount: distributionPlan.emptyStructureAmount,
        transaction: emptyStructureTransaction,
        message: `空结构资金 ${distributionPlan.emptyStructureAmount} USDT 已转入项目方账户`
      };
      
    } catch (error) {
      console.error('处理空结构资金失败:', error);
      throw error;
    }
  }

  /**
   * 完整的空结构处理流程
   * @param {number} newUserId - 新激活用户的ID
   * @returns {Object} 完整的处理结果
   */
  static async processEmptyStructure(newUserId) {
    try {
      console.log(`开始处理用户${newUserId}的空结构...`);
      
      // 1. 检测空结构
      const distributionPlan = await this.detectEmptyStructure(newUserId);
      
      // 2. 分配多层级奖励
      const rewardTransactions = await this.distributeMultiLevelRewards(distributionPlan, newUserId);
      
      // 3. 处理空结构资金
      const emptyStructureResult = await this.handleEmptyStructureFunds(distributionPlan, newUserId);
      
      const result = {
        success: true,
        distributionPlan: distributionPlan,
        rewardTransactions: rewardTransactions,
        emptyStructureResult: emptyStructureResult,
        summary: {
          totalProcessed: distributionPlan.totalRewardAmount,
          rewardsDistributed: distributionPlan.allocatedAmount,
          emptyStructureFunds: distributionPlan.emptyStructureAmount,
          levelsProcessed: distributionPlan.actualLevels,
          transactionsCreated: rewardTransactions.length + (emptyStructureResult.transaction ? 1 : 0)
        }
      };
      
      console.log(`用户${newUserId}空结构处理完成:`, result.summary);
      return result;
      
    } catch (error) {
      console.error(`处理用户${newUserId}空结构失败:`, error);
      throw error;
    }
  }
}

module.exports = EmptyStructureService;