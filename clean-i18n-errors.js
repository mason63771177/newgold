const fs = require('fs');

// 读取HTML文件
let content = fs.readFileSync('index.html', 'utf8');

console.log($t('messages._______________'));

// 清理CSS注释中的错误标记
const cssCommentFixes = [
    // CSS注释中的错误标记
    { search: /\/\* 未读消息<span data-i18n="common\.tip">提示<\/span>点 \*\//g, replace: '/* 未读消息提示点 */' },
    { search: /\/\* <span data-i18n="nav\.tasks">任务<\/span>列表样式 \*\//g, replace: '/* 任务列表样式 */' },
    { search: /\/\* <span data-i18n="nav\.reactivate">再次激活<\/span>突出样式 \*\//g, replace: '/* 再次激活突出样式 */' },
    { search: /\/\* 游戏化按钮 - 更有活力和<span data-i18n="nav\.tasks">任务<\/span>感 \*\//g, replace: '/* 游戏化按钮 - 更有活力和任务感 */' },
    { search: /\/\* 移动端状态<span data-i18n="common\.tip">提示<\/span>调整 \*\//g, replace: '/* 移动端状态提示调整 */' },
    { search: /\/\* 主要突出按钮样式 - <span data-i18n="nav\.activateAccount">激活账号<\/span>专用 \*\//g, replace: '/* 主要突出按钮样式 - 激活账号专用 */' },
    { search: /\/\* <span data-i18n="settings\.dangerZone">危险操作<\/span>区域 \*\//g, replace: '/* 危险操作区域 */' },
    { search: /\/\* <span data-i18n="nav\.tasks">任务<\/span>完成弹窗特殊样式 \*\//g, replace: '/* 任务完成弹窗特殊样式 */' },
    { search: /\/\* <span data-i18n="common\.copy">复制<\/span>按钮字体优化 \*\//g, replace: '/* 复制按钮字体优化 */' },
    { search: /\/\* <span data-i18n="nav\.tasks">任务<\/span>相关字体优化 \*\//g, replace: '/* 任务相关字体优化 */' },
    { search: /\/\* <span data-i18n="status\.state2">状态2<\/span>倒计时区域特殊字体优化 \*\//g, replace: '/* 状态2倒计时区域特殊字体优化 */' },
    { search: /font-size: 12px !important; \/\* 168<span data-i18n="countdown\.hours">小时<\/span>挑战标签从9px增加到12px \*\//g, replace: 'font-size: 12px !important; /* 168小时挑战标签从9px增加到12px */' },
    { search: /font-size: 13px !important; \/\* 剩余<span data-i18n="countdown\.days">天<\/span>数从10px增加到13px \*\//g, replace: 'font-size: 13px !important; /* 剩余天数从10px增加到13px */' },
    { search: /\/\* <span data-i18n="nav\.inviteLink">邀请链接<\/span>区域字体优化 \*\//g, replace: '/* 邀请链接区域字体优化 */' },
    { search: /div\[style\*="font-size: 12px"\]\[style\*="🔗 <span data-i18n="nav\.inviteLink">邀请链接<\/span>"\] \{/g, replace: 'div[style*="font-size: 12px"][style*="🔗 邀请链接"] {' },
    { search: /font-size: 15px !important; \/\* <span data-i18n="nav\.inviteLink">邀请链接<\/span>标题从12px增加到15px \*\//g, replace: 'font-size: 15px !important; /* 邀请链接标题从12px增加到15px */' },
    { search: /\/\* 消息按钮未读<span data-i18n="common\.tip">提示<\/span>小红点 \*\//g, replace: '/* 消息按钮未读提示小红点 */' }
];

// 清理HTML注释中的错误标记
const htmlCommentFixes = [
    { search: /<!-- <span data-i18n="settings\.appearance">外观设置<\/span> -->/g, replace: '<!-- 外观设置 -->' },
    { search: /<!-- <span data-i18n="settings\.functions">功能设置<\/span> -->/g, replace: '<!-- 功能设置 -->' },
    { search: /<!-- <span data-i18n="settings\.helpSupport">帮助与支持<\/span> -->/g, replace: '<!-- 帮助与支持 -->' },
    { search: /<!-- <span data-i18n="settings\.testFunctions">测试功能<\/span>区域 -->/g, replace: '<!-- 测试功能区域 -->' }
];

// 清理嵌套的span标签
const nestedSpanFixes = [
    // 清理嵌套的span标签，保留外层的data-i18n属性
    { search: /<span class="setting-title" data-i18n="settings\.theme"><span data-i18n="settings\.theme">主题风格<\/span><\/span>/g, replace: '<span class="setting-title" data-i18n="settings.theme">主题风格</span>' },
    { search: /<span class="setting-title" data-i18n="settings\.language">🌐 <span data-i18n="settings\.language">语言<\/span><\/span>/g, replace: '<span class="setting-title" data-i18n="settings.language">🌐 语言</span>' },
    { search: /<span class="setting-desc" data-i18n="settings\.languageDesc$t('messages.________span_data_i18n_')settings\.language">语言<\/span><\/span>/g, replace: '<span class="setting-desc" data-i18n="settings.languageDesc">选择界面显示语言</span>' },
    { search: /<span class="setting-title" data-i18n="settings\.notifications">🔔 <span data-i18n="settings\.notifications">消息通知<\/span><\/span>/g, replace: '<span class="setting-title" data-i18n="settings.notifications">🔔 消息通知</span>' },
    { search: /<span class="setting-title" data-i18n="settings\.sound">🔊 <span data-i18n="settings\.sound">音效<\/span><\/span>/g, replace: '<span class="setting-title" data-i18n="settings.sound">🔊 音效</span>' },
    { search: /<span class="setting-desc" data-i18n="settings\.soundDesc$t('messages.______span_data_i18n_')settings\.sound">音效<\/span>反馈<\/span>/g, replace: '<span class="setting-desc" data-i18n="settings.soundDesc">开启操作音效反馈</span>' }
];

// 应用所有修复
let fixCount = 0;

cssCommentFixes.forEach(fix => {
    const matches = content.match(fix.search);
    if (matches) {
        content = content.replace(fix.search, fix.replace);
        fixCount += matches.length;
    }
});

htmlCommentFixes.forEach(fix => {
    const matches = content.match(fix.search);
    if (matches) {
        content = content.replace(fix.search, fix.replace);
        fixCount += matches.length;
    }
});

nestedSpanFixes.forEach(fix => {
    const matches = content.match(fix.search);
    if (matches) {
        content = content.replace(fix.search, fix.replace);
        fixCount += matches.length;
    }
});

// 写回文件
fs.writeFileSync('index.html', content, 'utf8');

console.log(`清理完成！共修复了 ${fixCount} 处错误的国际化标记。`);