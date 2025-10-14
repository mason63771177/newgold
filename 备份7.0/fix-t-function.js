const fs = require('fs');
const path = require('path');

// 读取index.html文件
const indexPath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(indexPath, 'utf8');

console.log('开始修复t()函数调用...');

// 替换所有直接使用t()的地方为window.i18n.t()
// 匹配模式：t('xxx') 或 t("xxx")
const tFunctionRegex = /\bt\((['"][^'"]*['"])\)/g;

let matches = content.match(tFunctionRegex);
if (matches) {
    console.log(`找到 ${matches.length} 个t()函数调用需要修复`);
    
    // 替换为window.i18n.t()
    content = content.replace(tFunctionRegex, 'window.i18n.t($1)');
    
    console.log('已将所有t()替换为window.i18n.t()');
} else {
    console.log('未找到需要修复的t()函数调用');
}

// 写回文件
fs.writeFileSync(indexPath, content, 'utf8');
console.log('修复完成！');