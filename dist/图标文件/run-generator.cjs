// 运行图标生成器
const { generateAllIcons, generateSplashScreens } = require('./generate-icons.cjs');

console.log('🚀 开始生成PWA图标和启动画面...');

// 生成所有图标
generateAllIcons();

// 生成启动画面
generateSplashScreens();

console.log('🎉 所有图标和启动画面生成完成！');