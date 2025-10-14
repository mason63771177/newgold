#!/usr/bin/env node

/**
 * 新语言添加自动化脚本
 * 使用方法：node add-new-language.js <language-code> <language-name>
 * 例如：node add-new-language.js fr-FR "Français"
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 配置
const CONFIG = {
  i18nDir: './i18n',
  templateLang: 'zh-CN',
  globalBackgroundFile: './js/global-background.js'
};

// 创建命令行接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 提示用户输入
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// 检查语言代码格式
function validateLanguageCode(langCode) {
  const pattern = /^[a-z]{2}-[A-Z]{2}$/;
  return pattern.test(langCode);
}

// 读取模板语言文件
function readTemplateFile() {
  const templatePath = path.join(CONFIG.i18nDir, `${CONFIG.templateLang}.json`);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`模板文件不存在: ${templatePath}`);
  }
  return JSON.parse(fs.readFileSync(templatePath, 'utf8'));
}

// 创建新语言文件
function createLanguageFile(langCode, template) {
  const newFilePath = path.join(CONFIG.i18nDir, `${langCode}.json`);
  
  if (fs.existsSync(newFilePath)) {
    throw new Error(`语言文件已存在: ${newFilePath}`);
  }
  
  // 创建空的翻译结构（保持相同的key结构，但值为空字符串）
  const emptyTranslations = createEmptyTranslations(template);
  
  fs.writeFileSync(newFilePath, JSON.stringify(emptyTranslations, null, 2), 'utf8');
  console.log(`✅ 已创建语言文件: ${newFilePath}`);
  
  return newFilePath;
}

// 递归创建空翻译结构
function createEmptyTranslations(obj) {
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      result[key] = createEmptyTranslations(value);
    } else {
      result[key] = ''; // 空字符串，等待翻译
    }
  }
  
  return result;
}

// 更新全局语言切换器
function updateGlobalLanguageSwitch(langCode, langName) {
  const filePath = CONFIG.globalBackgroundFile;
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`全局背景文件不存在: ${filePath}`);
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 查找语言菜单的位置
  const menuPattern = /menu\.innerHTML = `\s*([\s\S]*?)\s*`;/;
  const match = content.match(menuPattern);
  
  if (!match) {
    throw new Error('未找到语言菜单定义');
  }
  
  const currentMenu = match[1];
  const newLanguageItem = `      <button class="lang-item" data-lang="${langCode}">${langName}</button>`;
  
  // 添加新语言选项
  const updatedMenu = currentMenu + '\n' + newLanguageItem;
  const updatedContent = content.replace(menuPattern, `menu.innerHTML = \`\n${updatedMenu}\n    \`;`);
  
  // 更新按钮显示逻辑
  const buttonPattern = /btn\.innerHTML = `🌐 \${isEN \? 'EN' : '中文'}`;/;
  if (updatedContent.includes(buttonPattern)) {
    // 这里可能需要更复杂的逻辑来处理多语言按钮显示
    console.log('⚠️  注意：可能需要手动更新按钮显示逻辑以支持新语言');
  }
  
  fs.writeFileSync(filePath, updatedContent, 'utf8');
  console.log(`✅ 已更新全局语言切换器: ${filePath}`);
}

// 检查翻译完整性
function checkTranslationCompleteness(langCode) {
  const langFilePath = path.join(CONFIG.i18nDir, `${langCode}.json`);
  const templateFilePath = path.join(CONFIG.i18nDir, `${CONFIG.templateLang}.json`);
  
  const langData = JSON.parse(fs.readFileSync(langFilePath, 'utf8'));
  const templateData = JSON.parse(fs.readFileSync(templateFilePath, 'utf8'));
  
  const missingKeys = [];
  const emptyValues = [];
  
  function checkKeys(obj, template, path = '') {
    for (const [key, value] of Object.entries(template)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (!(key in obj)) {
        missingKeys.push(currentPath);
      } else if (typeof value === 'object' && value !== null) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          checkKeys(obj[key], value, currentPath);
        } else {
          missingKeys.push(currentPath);
        }
      } else if (obj[key] === '' || obj[key] === null || obj[key] === undefined) {
        emptyValues.push(currentPath);
      }
    }
  }
  
  checkKeys(langData, templateData);
  
  return { missingKeys, emptyValues };
}

// 生成翻译报告
function generateTranslationReport(langCode) {
  const { missingKeys, emptyValues } = checkTranslationCompleteness(langCode);
  
  console.log(`\n📊 ${langCode} 翻译完整性报告:`);
  console.log(`总计缺失的键: ${missingKeys.length}`);
  console.log(`总计空值: ${emptyValues.length}`);
  
  if (missingKeys.length > 0) {
    console.log('\n❌ 缺失的键:');
    missingKeys.forEach(key => console.log(`  - ${key}`));
  }
  
  if (emptyValues.length > 0) {
    console.log('\n⚠️  需要翻译的键:');
    emptyValues.slice(0, 10).forEach(key => console.log(`  - ${key}`));
    if (emptyValues.length > 10) {
      console.log(`  ... 还有 ${emptyValues.length - 10} 个`);
    }
  }
  
  if (missingKeys.length === 0 && emptyValues.length === 0) {
    console.log('✅ 翻译完整！');
  }
}

// 主函数
async function main() {
  try {
    console.log('🌍 新语言添加助手');
    console.log('==================');
    
    // 获取参数或提示输入
    let langCode = process.argv[2];
    let langName = process.argv[3];
    
    if (!langCode) {
      langCode = await prompt('请输入语言代码 (例如: fr-FR): ');
    }
    
    if (!validateLanguageCode(langCode)) {
      throw new Error('语言代码格式错误，应为 xx-XX 格式 (例如: fr-FR)');
    }
    
    if (!langName) {
      langName = await prompt('请输入语言显示名称 (例如: Français): ');
    }
    
    console.log(`\n准备添加语言: ${langCode} (${langName})`);
    
    // 确认操作
    const confirm = await prompt('是否继续? (y/N): ');
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('操作已取消');
      return;
    }
    
    // 执行添加流程
    console.log('\n🚀 开始添加新语言...');
    
    // 1. 读取模板
    console.log('📖 读取模板文件...');
    const template = readTemplateFile();
    
    // 2. 创建语言文件
    console.log('📝 创建语言文件...');
    const newFilePath = createLanguageFile(langCode, template);
    
    // 3. 更新语言切换器
    console.log('🔄 更新语言切换器...');
    updateGlobalLanguageSwitch(langCode, langName);
    
    // 4. 生成报告
    console.log('📊 生成翻译报告...');
    generateTranslationReport(langCode);
    
    console.log('\n✅ 新语言添加完成！');
    console.log('\n📋 后续步骤:');
    console.log(`1. 编辑 ${newFilePath} 文件，填写所有翻译内容`);
    console.log('2. 测试语言切换功能');
    console.log('3. 验证所有页面的显示效果');
    console.log(`4. 运行 node add-new-language.js --check ${langCode} 检查翻译完整性`);
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// 检查模式
function checkMode() {
  const langCode = process.argv[3];
  if (!langCode) {
    console.error('请指定要检查的语言代码');
    process.exit(1);
  }
  
  console.log(`🔍 检查 ${langCode} 翻译完整性...`);
  generateTranslationReport(langCode);
}

// 命令行参数处理
if (process.argv[2] === '--check') {
  checkMode();
} else {
  main();
}