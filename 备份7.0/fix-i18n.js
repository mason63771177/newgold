// 修复国际化替换脚本 - 撤销JavaScript代码中的错误替换
const fs = require('fs');
const path = require('path');

// 读取HTML文件
const htmlFilePath = path.join(__dirname, 'index.html');
let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

// 修复JavaScript代码中的错误替换
const jsFixReplacements = [
  // 修复JavaScript中的错误替换
  { search: '<span data-i18n="nav.tasks">任务</span>', replace: $t('messages.task') },
  { search: '<span data-i18n="wallet.withdraw">提现</span>', replace: $t('messages.withdraw') },
  { search: '<span data-i18n="settings.sound">音效</span>', replace: '音效' },
  { search: '<span data-i18n="common.tip">提示</span>', replace: '提示' },
  { search: '<span data-i18n="settings.dataManagement">数据管理</span>', replace: '数据管理' },
  { search: '<span data-i18n="common.save">保存</span>', replace: $t('messages.save') },
  { search: '<span data-i18n="common.delete">删除</span>', replace: $t('messages.deletion') },
  { search: '<span data-i18n="common.edit">编辑</span>', replace: $t('messages.edit') },
  { search: '<span data-i18n="common.copy">复制</span>', replace: $t('messages.copy') },
  { search: '<span data-i18n="common.share">分享</span>', replace: $t('messages.share') },
  { search: '<span data-i18n="common.refresh">刷新</span>', replace: $t('messages.refresh') },
  { search: '<span data-i18n="common.loading">加载中</span>', replace: '加载中' },
  { search: '<span data-i18n="common.noData">暂无数据</span>', replace: '暂无数据' },
  { search: '<span data-i18n="common.ok">确定</span>', replace: '确定' },
  { search: '<span data-i18n="common.cancel">取消</span>', replace: $t('messages.cancel') },
  { search: '<span data-i18n="common.back">返回</span>', replace: '返回' },
  { search: '<span data-i18n="nav.activateAccount">激活账号</span>', replace: '激活账号' },
  { search: '<span data-i18n="nav.inviteLink">邀请链接</span>', replace: '邀请链接' },
  { search: '<span data-i18n="nav.team">团队</span>', replace: $t('messages.team') },
  { search: '<span data-i18n="nav.redPacket">抢红包</span>', replace: $t('messages.grab') },
  { search: '<span data-i18n="nav.wallet">钱包</span>', replace: $t('messages.wallet') },
  { search: '<span data-i18n="nav.ranking">排行榜</span>', replace: $t('messages.ranking') },
  { search: '<span data-i18n="nav.reactivate">再次激活</span>', replace: '再次激活' },
  { search: '<span data-i18n="nav.masterTasks">大神任务</span>', replace: '大神任务' },
  { search: '<span data-i18n="status.state1">状态1</span>', replace: $t('messages.__1') },
  { search: '<span data-i18n="status.state2">状态2</span>', replace: $t('messages.__2') },
  { search: '<span data-i18n="status.state3">状态3</span>', replace: $t('messages.__3') },
  { search: '<span data-i18n="status.newbieNotPaid">新手未入金</span>', replace: '新手未入金' },
  { search: '<span data-i18n="status.newbiePaid">新手已入金</span>', replace: '新手已入金' },
  { search: '<span data-i18n="status.challengeEnded">本期挑战结束</span>', replace: '本期挑战结束' },
  { search: '<span data-i18n="status.countdownActive">168小时倒计时中</span>', replace: $t('messages.168______') },
  { search: '<span data-i18n="countdown.remainingTime">挑战剩余时间</span>', replace: '挑战剩余时间' },
  { search: '<span data-i18n="countdown.days">天</span>', replace: $t('messages._') },
  { search: '<span data-i18n="countdown.hours">小时</span>', replace: $t('messages.hour') },
  { search: '<span data-i18n="countdown.minutes">分钟</span>', replace: $t('messages.minute') },
  { search: '<span data-i18n="countdown.seconds">秒</span>', replace: $t('messages.second') },
  { search: '<span data-i18n="tasks.newbieTasks">新手任务</span>', replace: '新手任务' },
  { search: '<span data-i18n="tasks.quizTasks">答题任务</span>', replace: '答题任务' },
  { search: '<span data-i18n="tasks.masterTasks">大神任务</span>', replace: '大神任务' },
  { search: '<span data-i18n="tasks.taskCompleted">任务完成</span>', replace: '任务完成' },
  { search: '<span data-i18n="tasks.taskReward">任务奖励</span>', replace: '任务奖励' },
  { search: '<span data-i18n="tasks.completeTask">完成任务</span>', replace: '完成任务' },
  { search: '<span data-i18n="wallet.myWallet">我的钱包</span>', replace: '我的钱包' },
  { search: '<span data-i18n="wallet.currentBalance">当前余额</span>', replace: '当前余额' },
  { search: '<span data-i18n="wallet.walletAddress">钱包地址</span>', replace: '钱包地址' },
  { search: '<span data-i18n="wallet.transactionHistory">交易记录</span>', replace: '交易记录' },
  { search: '<span data-i18n="wallet.bindAddress">绑定地址</span>', replace: '绑定地址' },
  { search: '<span data-i18n="wallet.noAddressBound">未绑定钱包地址</span>', replace: '未绑定钱包地址' },
  { search: '<span data-i18n="team.myTeam">我的团队</span>', replace: '我的团队' },
  { search: '<span data-i18n="team.teamSize">团队人数</span>', replace: '团队人数' },
  { search: '<span data-i18n="team.teamEarnings">团队收益</span>', replace: '团队收益' },
  { search: '<span data-i18n="team.directReferrals">直推人数</span>', replace: '直推人数' },
  { search: '<span data-i18n="team.totalTeamSize">团队总人数</span>', replace: '团队总人数' },
  { search: '<span data-i18n="ranking.leaderboard">排行榜</span>', replace: $t('messages.ranking') },
  { search: '<span data-i18n="ranking.teamRanking">团队排行榜</span>', replace: '团队排行榜' },
  { search: '<span data-i18n="ranking.redPacketRanking">红包排行榜</span>', replace: '红包排行榜' },
  { search: '<span data-i18n="ranking.masterRanking">大神排行榜</span>', replace: '大神排行榜' },
  { search: '<span data-i18n="redPacket.grabRedPacket">抢红包</span>', replace: $t('messages.grab') },
  { search: '<span data-i18n="redPacket.totalPool">红包池总额</span>', replace: '红包池总额' },
  { search: '<span data-i18n="redPacket.waitingToStart">等待红包开始</span>', replace: '等待红包开始' },
  { search: '<span data-i18n="redPacket.inProgress">红包进行中</span>', replace: '红包进行中' },
  { search: '<span data-i18n="redPacket.grabNow">立即抢红包</span>', replace: '立即抢红包' },
  { search: '<span data-i18n="redPacket.alreadyGrabbed">已抢过本轮</span>', replace: '已抢过本轮' },
  { search: '<span data-i18n="messages.title">消息中心</span>', replace: '消息中心' },
  { search: '<span data-i18n="messages.official">官方公告</span>', replace: '官方公告' },
  { search: '<span data-i18n="messages.team">团队消息</span>', replace: '团队消息' },
  { search: '<span data-i18n="messages.noOfficialMessages">暂无官方公告</span>', replace: '暂无官方公告' },
  { search: '<span data-i18n="messages.noTeamMessages">暂无团队消息</span>', replace: '暂无团队消息' },
  { search: '<span data-i18n="messages.markAllRead">一键已读</span>', replace: '一键已读' },
  { search: '<span data-i18n="settings.title">设置中心</span>', replace: '设置中心' },
  { search: '<span data-i18n="settings.appearance">外观设置</span>', replace: '外观设置' },
  { search: '<span data-i18n="settings.theme">主题风格</span>', replace: '主题风格' },
  { search: '<span data-i18n="settings.language">语言</span>', replace: '语言' },
  { search: '<span data-i18n="settings.functions">功能设置</span>', replace: '功能设置' },
  { search: '<span data-i18n="settings.notifications">消息通知</span>', replace: '消息通知' },
  { search: '<span data-i18n="settings.resetData">重置数据</span>', replace: '重置数据' },
  { search: '<span data-i18n="settings.stateSwitch">状态切换</span>', replace: '状态切换' },
  { search: '<span data-i18n="settings.themeDemo">主题演示</span>', replace: '主题演示' },
  { search: '<span data-i18n="settings.testFunctions">测试功能</span>', replace: '测试功能' },
  { search: '<span data-i18n="settings.helpSupport">帮助与支持</span>', replace: '帮助与支持' },
  { search: '<span data-i18n="settings.userGuide">使用帮助</span>', replace: '使用帮助' },
  { search: '<span data-i18n="settings.feedback">意见反馈</span>', replace: '意见反馈' },
  { search: '<span data-i18n="settings.aboutUs">关于我们</span>', replace: '关于我们' },
  { search: '<span data-i18n="settings.dangerZone">危险操作</span>', replace: '危险操作' },
  { search: '<span data-i18n="settings.logoutBtn">退出登录</span>', replace: '退出登录' },
  { search: '<span data-i18n="settings.backToHome">返回主页</span>', replace: '返回主页' },
  { search: '<span data-i18n="success.operationSuccess">操作成功</span>', replace: '操作成功' },
  { search: '<span data-i18n="error.operationFailed">操作失败</span>', replace: '操作失败' },
  { search: '<span data-i18n="error.networkError">网络错误</span>', replace: '网络错误' },
  { search: '<span data-i18n="error.dataLoadFailed">数据加载失败</span>', replace: '数据加载失败' },
  { search: '<span data-i18n="error.pleaseTryAgain">请稍后重试</span>', replace: '请稍后重试' },
  { search: '<span data-i18n="debug.timeSet">时间已设置</span>', replace: '时间已设置' },
  { search: '<span data-i18n="debug.countdownReset">倒计时已重置</span>', replace: '倒计时已重置' },
  { search: '<span data-i18n="debug.randomAnnouncementSent">随机公告已发送</span>', replace: '随机公告已发送' }
];

// 在JavaScript代码区域内执行修复替换
let fixedCount = 0;
jsFixReplacements.forEach(({ search, replace }) => {
  const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  
  // 只在JavaScript代码区域内进行替换（在<script>标签内或JavaScript字符串中）
  const scriptSections = htmlContent.match(/<script[\s\S]*?<\/script>/gi) || [];
  
  scriptSections.forEach(scriptSection => {
    const matches = scriptSection.match(regex);
    if (matches) {
      const fixedSection = scriptSection.replace(regex, replace);
      htmlContent = htmlContent.replace(scriptSection, fixedSection);
      fixedCount += matches.length;
      console.log(`修复JavaScript中的 "${search}" -> "${replace}" (${matches.length} 次)`);
    }
  });
});

// 写回文件
fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
console.log(`\n总共修复了 ${fixedCount} 处JavaScript代码中的错误替换`);
console.log($t('messages.javascript______'));