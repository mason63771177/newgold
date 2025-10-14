const fs = require('fs');

// 读取现有的中文语言包
const zhCN = JSON.parse(fs.readFileSync('./i18n/lang/zh-CN.json', 'utf8'));

// 读取现有的英文语言包
const enUS = JSON.parse(fs.readFileSync('./i18n/lang/en-US.json', 'utf8'));

console.log($t('messages.__________'));

// 添加缺失的翻译键值对到中文语言包
const zhCNUpdates = {
    "app": {
        "name": $t('content.__7__h5')
    },
    "header": {
        ...zhCN.header,
        "welcome": $t('content.______7_')
    },
    "settings": {
        ...zhCN.settings,
        "notLoggedIn": "未登录",
        "inviteCode": "邀请码",
        "themeDesc": "选择您喜欢的界面主题",
        "switch": "切换",
        "languageDesc": "选择界面显示语言",
        "functionalSettings": "功能设置",
        "messageNotification": "消息通知",
        "messageNotificationDesc": "接收重要消息提醒",
        "soundEffectDesc": "开启操作音效反馈",
        "dataManagementDesc": "重置本地测试数据",
        "resetDataBtn": "重置数据",
        "stateSwitchDesc": "切换用户状态进行测试",
        "selectState": "选择状态",
        "state1": $t('messages.__1'),
        "state2": $t('messages.__2'), 
        "state3": $t('messages.__3'),
        // 状态4已被移除，删除相关翻译
        "themeDemoDesc": "查看主题切换效果",
        "newbieTaskSim": "新手任务模拟",
        "newbieTaskSimDesc": $t('content.________1_2_3'),
        "task1": $t('content.__1'),
        "task2": $t('content.__2'),
        "task3": $t('content.__3'),
        "quizTaskSim": "答题任务模拟",
        "quizTaskSimDesc": "模拟完成答题任务",
        "completeAllQuiz": "完成全部答题",
        "godTaskSim": "大神任务模拟",
        "godTaskSimDesc": "模拟完成大神任务",
        "messageTest": "消息测试",
        "messageTestDesc": "发送测试消息",
        "sendRandomAnnouncement": "发送随机公告",
        "timeDebug": "时间调试",
        "timeDebugDesc": "调试时间相关功能",
        "setTime": "设置时间",
        "reset": $t('content.reset'),
        "userGuide": "使用帮助",
        "userGuideDesc": "查看使用说明",
        "feedback": "意见反馈",
        "feedbackDesc": "提交意见和建议",
        "aboutUs": "关于我们",
        "aboutUsDesc": $t('messages.______'),
        "dangerZone": "危险操作",
        "logoutBtn": "退出登录",
        "backToHome": "返回主页"
    },
    "status": {
        ...zhCN.status,
        "state1": $t('messages.__1'),
        "state2": $t('messages.__2'),
        "state3": $t('messages.__3'), 
        // 状态4已被移除，删除相关翻译
        "newbieNotPaid": "新手未入金",
        "newbiePaid": "新手已入金",
        "challengeEnded": "本期挑战结束",
        "countdownActive": $t('messages.168______')
    },
    "messages": {
        "title": "消息中心",
        "official": "官方公告",
        "team": "团队消息",
        "bugReport": "Bug报告",
        "noOfficialMessages": "暂无官方公告",
        "noTeamMessages": "暂无团队消息",
        "markAllRead": "一键已读",
        "noBugReports": $t('content.__bug__')
    },
    "bugReport": {
        "title": "Bug报告",
        "bugTitle": $t('messages.bug__'),
        "bugTitlePlaceholder": "请简要描述问题",
        "description": "详细描述",
        "descriptionPlaceholder": $t('placeholders.__________________'),
        "problemType": $t('messages.____'),
        "problemTypePlaceholder": "请选择问题类型",
        "functionalAbnormal": "功能异常",
        "interfaceDisplay": "界面显示",
        "performanceIssue": "性能问题",
        "other": "其他",
        "submitReport": "提交报告",
        "submittedReports": $t('content.____bug__')
    }
};

// 添加缺失的翻译键值对到英文语言包
const enUSUpdates = {
    "app": {
        ...enUS.app,
        "name": "Gold7 Game H5 Page"
    },
    "header": {
        "title": "Gold7 Game",
        "balance": "Balance",
        "level": "Level",
        "welcome": "Welcome to Gold7 Game"
    },
    "settings": {
        "title": "Settings Center",
        "language": "Language",
        "sound": "Sound Effects",
        "notification": "Notifications",
        "notLoggedIn": "Not Logged In",
        "inviteCode": "Invite Code",
        "appearance": "Appearance Settings",
        "theme": "Theme Style",
        "themeDesc": "Choose your preferred interface theme",
        "switch": "Switch",
        "languageDesc": "Select interface display language",
        "functions": "Functional Settings",
        "notifications": "Message Notifications",
        "notificationsDesc": "Receive important message alerts",
        "soundDesc": "Enable operation sound feedback",
        "dataManagement": "Data Management",
        "dataManagementDesc": "Reset local test data",
        "resetData": "Reset Data",
        "resetDataBtn": "Reset Data",
        "stateSwitch": "State Switch",
        "stateSwitchDesc": "Switch user state for testing",
        "selectState": "Select State",
        "state1": "State 1",
        "state2": "State 2",
        "state3": "State 3", 
        // 状态4已被移除，删除相关翻译
        "themeDemo": "Theme Demo",
        "themeDemoDesc": "View theme switching effects",
        "testFunctions": "Test Functions",
        "newbieTaskSim": "Newbie Task Simulation",
        "newbieTaskSimDesc": "Simulate completing newbie tasks 1/2/3",
        "task1": "Task 1",
        "task2": "Task 2",
        "task3": "Task 3",
        "quizTaskSim": "Quiz Task Simulation",
        "quizTaskSimDesc": "Simulate completing quiz tasks",
        "completeAllQuiz": "Complete All Quiz",
        "godTaskSim": "Master Task Simulation",
        "godTaskSimDesc": "Simulate completing master tasks",
        "messageTest": "Message Test",
        "messageTestDesc": "Send test messages",
        "sendRandomAnnouncement": "Send Random Announcement",
        "timeDebug": "Time Debug",
        "timeDebugDesc": "Debug time-related functions",
        "setTime": "Set Time",
        "reset": "Reset",
        "helpSupport": "Help & Support",
        "userGuide": "User Guide",
        "userGuideDesc": "View usage instructions",
        "feedback": "Feedback",
        "feedbackDesc": "Submit opinions and suggestions",
        "aboutUs": "About Us",
        "aboutUsDesc": "Learn more information",
        "dangerZone": "Danger Zone",
        "logoutBtn": "Logout",
        "backToHome": "Back to Home"
    },
    "status": {
        "active": "Active",
        "inactive": "Inactive",
        "pending": "Pending",
        "completed": "Completed",
        "failed": "Failed",
        "expired": "Expired",
        "locked": "Locked",
        "unlocked": "Unlocked",
        "available": "Available",
        "unavailable": "Unavailable",
        "online": "Online",
        "offline": "Offline",
        "state1": "State 1",
        "state2": "State 2",
        "state3": "State 3",
        // 状态4已被移除，删除相关翻译
        "newbieNotPaid": "Newbie Not Paid",
        "newbiePaid": "Newbie Paid",
        "challengeEnded": "Challenge Ended",
        "countdownActive": "168 Hour Countdown Active"
    },
    "messages": {
        "title": "Message Center",
        "official": "Official Announcements",
        "team": "Team Messages",
        "bugReport": "Bug Reports",
        "noOfficialMessages": "No official announcements",
        "noTeamMessages": "No team messages",
        "markAllRead": "Mark All Read",
        "noBugReports": "No bug reports"
    },
    "bugReport": {
        "title": "Bug Report",
        "bugTitle": "Bug Title",
        "bugTitlePlaceholder": "Please briefly describe the issue",
        "description": "Detailed Description",
        "descriptionPlaceholder": "Please describe the specific situation, reproduction steps, etc.",
        "problemType": "Problem Type",
        "problemTypePlaceholder": "Please select problem type",
        "functionalAbnormal": "Functional Abnormal",
        "interfaceDisplay": "Interface Display",
        "performanceIssue": "Performance Issue",
        "other": "Other",
        "submitReport": "Submit Report",
        "submittedReports": "Submitted Bug Reports"
    }
};

// 合并更新
const updatedZhCN = { ...zhCN, ...zhCNUpdates };
const updatedEnUS = { ...enUS, ...enUSUpdates };

// 写回文件
fs.writeFileSync('./i18n/lang/zh-CN.json', JSON.stringify(updatedZhCN, null, 2), 'utf8');
fs.writeFileSync('./i18n/lang/en-US.json', JSON.stringify(updatedEnUS, null, 2), 'utf8');

console.log($t('messages._______'));
console.log('中文语言包已更新');
console.log($t('messages.________'));