// 批量替换HTML文件中的硬编码中文文本为国际化标记
const fs = require('fs');
const path = require('path');

// 需要替换的文本映射
const replacements = [
  // 基本文本
  { search: '提示', replace: '<span data-i18n="common.tip">提示</span>' },
  { search: '确定', replace: '<span data-i18n="common.ok">确定</span>' },
  { search: $t('messages.cancel'), replace: '<span data-i18n="common.cancel">取消</span>' },
  { search: '返回', replace: '<span data-i18n="common.back">返回</span>' },
  { search: $t('messages.save'), replace: '<span data-i18n="common.save">保存</span>' },
  { search: $t('messages.deletion'), replace: '<span data-i18n="common.delete">删除</span>' },
  { search: $t('messages.edit'), replace: '<span data-i18n="common.edit">编辑</span>' },
  { search: $t('messages.copy'), replace: '<span data-i18n="common.copy">复制</span>' },
  { search: $t('messages.share'), replace: '<span data-i18n="common.share">分享</span>' },
  { search: $t('messages.refresh'), replace: '<span data-i18n="common.refresh">刷新</span>' },
  { search: '加载中', replace: '<span data-i18n="common.loading">加载中</span>' },
  { search: '暂无数据', replace: '<span data-i18n="common.noData">暂无数据</span>' },
  
  // 导航相关
  { search: '激活账号', replace: '<span data-i18n="nav.activateAccount">激活账号</span>' },
  { search: '邀请链接', replace: '<span data-i18n="nav.inviteLink">邀请链接</span>' },
  { search: $t('messages.task'), replace: '<span data-i18n="nav.tasks">任务</span>' },
  { search: $t('messages.team'), replace: '<span data-i18n="nav.team">团队</span>' },
  { search: $t('messages.grab'), replace: '<span data-i18n="nav.redPacket">抢红包</span>' },
  { search: $t('messages.wallet'), replace: '<span data-i18n="nav.wallet">钱包</span>' },
  { search: $t('messages.ranking'), replace: '<span data-i18n="nav.ranking">排行榜</span>' },
  { search: '再次激活', replace: '<span data-i18n="nav.reactivate">再次激活</span>' },
  { search: '大神任务', replace: '<span data-i18n="nav.masterTasks">大神任务</span>' },
  
  // 状态相关
  { search: '状态1', replace: '<span data-i18n="status.state1">状态1</span>' },
  { search: $t('messages.__2'), replace: '<span data-i18n="status.state2">状态2</span>' },
  { search: $t('messages.__3'), replace: '<span data-i18n="status.state3">状态3</span>' },
  { search: '新手未入金', replace: '<span data-i18n="status.newbieNotPaid">新手未入金</span>' },
  { search: '新手已入金', replace: '<span data-i18n="status.newbiePaid">新手已入金</span>' },
  { search: '本期挑战结束', replace: '<span data-i18n="status.challengeEnded">本期挑战结束</span>' },
  { search: $t('messages.168______'), replace: '<span data-i18n="status.countdownActive">168小时倒计时中</span>' },
  
  // 倒计时相关
  { search: '挑战剩余时间', replace: '<span data-i18n="countdown.remainingTime">挑战剩余时间</span>' },
  { search: $t('messages._'), replace: '<span data-i18n="countdown.days">天</span>' },
  { search: $t('messages.hour'), replace: '<span data-i18n="countdown.hours">小时</span>' },
  { search: $t('messages.minute'), replace: '<span data-i18n="countdown.minutes">分钟</span>' },
  { search: $t('messages.second'), replace: '<span data-i18n="countdown.seconds">秒</span>' },
  
  // 任务相关
  { search: '新手任务', replace: '<span data-i18n="tasks.newbieTasks">新手任务</span>' },
  { search: '答题任务', replace: '<span data-i18n="tasks.quizTasks">答题任务</span>' },
  { search: '大神任务', replace: '<span data-i18n="tasks.masterTasks">大神任务</span>' },
  { search: '任务完成', replace: '<span data-i18n="tasks.taskCompleted">任务完成</span>' },
  { search: '任务奖励', replace: '<span data-i18n="tasks.taskReward">任务奖励</span>' },
  { search: '完成任务', replace: '<span data-i18n="tasks.completeTask">完成任务</span>' },
  
  // 钱包相关
  { search: '我的钱包', replace: '<span data-i18n="wallet.myWallet">我的钱包</span>' },
  { search: '当前余额', replace: '<span data-i18n="wallet.currentBalance">当前余额</span>' },
  { search: '钱包地址', replace: '<span data-i18n="wallet.walletAddress">钱包地址</span>' },
  { search: '交易记录', replace: '<span data-i18n="wallet.transactionHistory">交易记录</span>' },
  { search: $t('messages.withdraw'), replace: '<span data-i18n="wallet.withdraw">提现</span>' },
  { search: '绑定地址', replace: '<span data-i18n="wallet.bindAddress">绑定地址</span>' },
  { search: '未绑定钱包地址', replace: '<span data-i18n="wallet.noAddressBound">未绑定钱包地址</span>' },
  
  // 团队相关
  { search: '我的团队', replace: '<span data-i18n="team.myTeam">我的团队</span>' },
  { search: '团队人数', replace: '<span data-i18n="team.teamSize">团队人数</span>' },
  { search: '团队收益', replace: '<span data-i18n="team.teamEarnings">团队收益</span>' },
  { search: '直推人数', replace: '<span data-i18n="team.directReferrals">直推人数</span>' },
  { search: '团队总人数', replace: '<span data-i18n="team.totalTeamSize">团队总人数</span>' },
  
  // 排行榜相关
  { search: '排行榜', replace: '<span data-i18n="ranking.leaderboard">排行榜</span>' },
  { search: '团队排行榜', replace: '<span data-i18n="ranking.teamRanking">团队排行榜</span>' },
  { search: '红包排行榜', replace: '<span data-i18n="ranking.redPacketRanking">红包排行榜</span>' },
  { search: '大神排行榜', replace: '<span data-i18n="ranking.masterRanking">大神排行榜</span>' },
  
  // 红包相关
  { search: '抢红包', replace: '<span data-i18n="redPacket.grabRedPacket">抢红包</span>' },
  { search: '红包池总额', replace: '<span data-i18n="redPacket.totalPool">红包池总额</span>' },
  { search: '等待红包开始', replace: '<span data-i18n="redPacket.waitingToStart">等待红包开始</span>' },
  { search: '红包进行中', replace: '<span data-i18n="redPacket.inProgress">红包进行中</span>' },
  { search: '立即抢红包', replace: '<span data-i18n="redPacket.grabNow">立即抢红包</span>' },
  { search: '已抢过本轮', replace: '<span data-i18n="redPacket.alreadyGrabbed">已抢过本轮</span>' },
  
  // 消息相关
  { search: '消息中心', replace: '<span data-i18n="messages.title">消息中心</span>' },
  { search: '官方公告', replace: '<span data-i18n="messages.official">官方公告</span>' },
  { search: '团队消息', replace: '<span data-i18n="messages.team">团队消息</span>' },
  { search: '暂无官方公告', replace: '<span data-i18n="messages.noOfficialMessages">暂无官方公告</span>' },
  { search: '暂无团队消息', replace: '<span data-i18n="messages.noTeamMessages">暂无团队消息</span>' },
  { search: '一键已读', replace: '<span data-i18n="messages.markAllRead">一键已读</span>' },
  
  // 设置相关
  { search: '设置中心', replace: '<span data-i18n="settings.title">设置中心</span>' },
  { search: '外观设置', replace: '<span data-i18n="settings.appearance">外观设置</span>' },
  { search: '主题风格', replace: '<span data-i18n="settings.theme">主题风格</span>' },
  { search: '语言', replace: '<span data-i18n="settings.language">语言</span>' },
  { search: '功能设置', replace: '<span data-i18n="settings.functions">功能设置</span>' },
  { search: '消息通知', replace: '<span data-i18n="settings.notifications">消息通知</span>' },
  { search: '音效', replace: '<span data-i18n="settings.sound">音效</span>' },
  { search: '数据管理', replace: '<span data-i18n="settings.dataManagement">数据管理</span>' },
  { search: '重置数据', replace: '<span data-i18n="settings.resetData">重置数据</span>' },
  { search: '状态切换', replace: '<span data-i18n="settings.stateSwitch">状态切换</span>' },
  { search: '主题演示', replace: '<span data-i18n="settings.themeDemo">主题演示</span>' },
  { search: '测试功能', replace: '<span data-i18n="settings.testFunctions">测试功能</span>' },
  { search: '帮助与支持', replace: '<span data-i18n="settings.helpSupport">帮助与支持</span>' },
  { search: '使用帮助', replace: '<span data-i18n="settings.userGuide">使用帮助</span>' },
  { search: '意见反馈', replace: '<span data-i18n="settings.feedback">意见反馈</span>' },
  { search: '关于我们', replace: '<span data-i18n="settings.aboutUs">关于我们</span>' },
  { search: '危险操作', replace: '<span data-i18n="settings.dangerZone">危险操作</span>' },
  { search: '退出登录', replace: '<span data-i18n="settings.logoutBtn">退出登录</span>' },
  { search: '返回主页', replace: '<span data-i18n="settings.backToHome">返回主页</span>' },
  
  // 错误和成功消息
  { search: '操作成功', replace: '<span data-i18n="success.operationSuccess">操作成功</span>' },
  { search: '操作失败', replace: '<span data-i18n="error.operationFailed">操作失败</span>' },
  { search: '网络错误', replace: '<span data-i18n="error.networkError">网络错误</span>' },
  { search: '数据加载失败', replace: '<span data-i18n="error.dataLoadFailed">数据加载失败</span>' },
  { search: '请稍后重试', replace: '<span data-i18n="error.pleaseTryAgain">请稍后重试</span>' },
  
  // 音频相关
  { search: '金币声效.mp3', replace: 'coin-sound.mp3' },
  
  // 调试相关
  { search: '时间已设置', replace: '<span data-i18n="debug.timeSet">时间已设置</span>' },
  { search: '倒计时已重置', replace: '<span data-i18n="debug.countdownReset">倒计时已重置</span>' },
  { search: '随机公告已发送', replace: '<span data-i18n="debug.randomAnnouncementSent">随机公告已发送</span>' }
];

// 读取HTML文件
const htmlFilePath = path.join(__dirname, 'index.html');
let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

// 执行替换
let replacedCount = 0;
replacements.forEach(({ search, replace }) => {
  const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const matches = htmlContent.match(regex);
  if (matches) {
    htmlContent = htmlContent.replace(regex, replace);
    replacedCount += matches.length;
    console.log(`替换 "${search}" -> "${replace}" (${matches.length} 次)`);
  }
});

// 写回文件
fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
console.log(`\n总共替换了 ${replacedCount} 处文本`);
console.log($t('messages.html_________'));