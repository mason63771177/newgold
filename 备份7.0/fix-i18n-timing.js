const fs = require('fs');
const path = require('path');

// 读取index.html文件
const indexPath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(indexPath, 'utf8');

console.log($t('messages.__________________'));

// 创建一个安全的国际化函数调用包装器
const safeI18nWrapper = `
// 安全的国际化函数调用包装器
function safeT(key, params = {}) {
  if (window.i18n && typeof window.i18n.t === 'function') {
    return window.i18n.t(key, params);
  }
  // 如果i18n还未加载，返回键本身作为后备
  return key;
}
`;

// 在页面头部添加安全包装器
const headEndIndex = content.indexOf('</head>');
if (headEndIndex !== -1) {
  content = content.slice(0, headEndIndex) + 
    '<script>' + safeI18nWrapper + '</script>\n' + 
    content.slice(headEndIndex);
  console.log($t('messages.______________'));
}

// 替换所有window.i18n.t()调用为safeT()
content = content.replace(/window\.i18n\.t\(/g, 'safeT(');
console.log('已将所有window.i18n.t()替换为safeT()');

// 写回文件
fs.writeFileSync(indexPath, content, 'utf8');
console.log('修复完成！');