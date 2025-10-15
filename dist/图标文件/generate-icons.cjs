/**
 * PWA图标生成脚本
 * 基于SVG图标生成各种尺寸的PNG图标
 */

// 需要生成的图标尺寸
const ICON_SIZES = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

// 快捷方式图标
const SHORTCUT_ICONS = [
  { size: 96, name: 'wallet-icon-96x96.png', color: '#56ccf2' },
  { size: 96, name: 'tasks-icon-96x96.png', color: '#2f80ed' },
  { size: 96, name: 'team-icon-96x96.png', color: '#6dd5ed' }
];

/**
 * 生成SVG图标内容
 * @param {number} size - 图标尺寸
 * @param {string} color - 主色调
 * @param {string} type - 图标类型
 */
function generateSVGIcon(size, color = '#56ccf2', type = 'main') {
  const icons = {
    main: `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
            <stop offset="100%" style="stop-color:#2f80ed;stop-opacity:1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <!-- 背景圆形 -->
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" fill="url(#grad1)" filter="url(#glow)"/>
        
        <!-- 主图标 - 金币符号 -->
        <g transform="translate(${size/2}, ${size/2})">
          <!-- 外圆环 -->
          <circle cx="0" cy="0" r="${size/4}" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.9"/>
          
          <!-- 内部符号 -->
          <text x="0" y="${size/12}" text-anchor="middle" font-family="Arial, sans-serif" 
                font-size="${size/6}" font-weight="bold" fill="#ffffff">¥</text>
          
          <!-- 装饰线条 -->
          <line x1="-${size/6}" y1="-${size/8}" x2="${size/6}" y2="-${size/8}" 
                stroke="#ffffff" stroke-width="2" opacity="0.7"/>
          <line x1="-${size/6}" y1="${size/8}" x2="${size/6}" y2="${size/8}" 
                stroke="#ffffff" stroke-width="2" opacity="0.7"/>
        </g>
      </svg>
    `,
    
    wallet: `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="walletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
            <stop offset="100%" style="stop-color:#2f80ed;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" fill="url(#walletGrad)"/>
        
        <!-- 钱包图标 -->
        <g transform="translate(${size/2}, ${size/2})">
          <rect x="-${size/4}" y="-${size/6}" width="${size/2}" height="${size/3}" 
                rx="4" fill="#ffffff" opacity="0.9"/>
          <rect x="-${size/5}" y="-${size/8}" width="${size/8}" height="${size/12}" 
                rx="2" fill="${color}"/>
        </g>
      </svg>
    `,
    
    tasks: `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="tasksGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
            <stop offset="100%" style="stop-color:#2f80ed;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" fill="url(#tasksGrad)"/>
        
        <!-- 任务列表图标 -->
        <g transform="translate(${size/2}, ${size/2})">
          <rect x="-${size/4}" y="-${size/4}" width="${size/2}" height="${size/2}" 
                rx="4" fill="#ffffff" opacity="0.9"/>
          <line x1="-${size/6}" y1="-${size/8}" x2="${size/6}" y2="-${size/8}" 
                stroke="${color}" stroke-width="2"/>
          <line x1="-${size/6}" y1="0" x2="${size/6}" y2="0" 
                stroke="${color}" stroke-width="2"/>
          <line x1="-${size/6}" y1="${size/8}" x2="${size/6}" y2="${size/8}" 
                stroke="${color}" stroke-width="2"/>
        </g>
      </svg>
    `,
    
    team: `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="teamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
            <stop offset="100%" style="stop-color:#2f80ed;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" fill="url(#teamGrad)"/>
        
        <!-- 团队图标 -->
        <g transform="translate(${size/2}, ${size/2})">
          <circle cx="-${size/8}" cy="-${size/12}" r="${size/12}" fill="#ffffff" opacity="0.9"/>
          <circle cx="${size/8}" cy="-${size/12}" r="${size/12}" fill="#ffffff" opacity="0.9"/>
          <circle cx="0" cy="${size/8}" r="${size/12}" fill="#ffffff" opacity="0.9"/>
        </g>
      </svg>
    `
  };
  
  return icons[type] || icons.main;
}

/**
 * 创建图标文件
 * @param {string} filename - 文件名
 * @param {string} svgContent - SVG内容
 */
function createIconFile(filename, svgContent) {
  // 在实际项目中，这里应该使用适当的SVG到PNG转换库
  // 比如 sharp、canvas 或者 puppeteer
  console.log(`生成图标: ${filename}`);
  console.log(`SVG内容: ${svgContent}`);
  
  // 这里创建一个占位符文件，实际使用时需要替换为真实的图片生成逻辑
  return svgContent;
}

/**
 * 生成所有PWA图标
 */
function generateAllIcons() {
  console.log('🎨 开始生成PWA图标...');
  
  // 生成主应用图标
  ICON_SIZES.forEach(({ size, name }) => {
    const svgContent = generateSVGIcon(size, '#56ccf2', 'main');
    createIconFile(name, svgContent);
  });
  
  // 生成快捷方式图标
  const shortcutTypes = ['wallet', 'tasks', 'team'];
  SHORTCUT_ICONS.forEach(({ size, name, color }, index) => {
    const type = shortcutTypes[index];
    const svgContent = generateSVGIcon(size, color, type);
    createIconFile(name, svgContent);
  });
  
  console.log('✅ PWA图标生成完成！');
}

/**
 * 生成启动画面
 */
function generateSplashScreens() {
  const splashScreens = [
    { width: 390, height: 844, name: 'splash-390x844.png' },
    { width: 414, height: 896, name: 'splash-414x896.png' },
    { width: 375, height: 812, name: 'splash-375x812.png' },
    { width: 428, height: 926, name: 'splash-428x926.png' }
  ];
  
  splashScreens.forEach(({ width, height, name }) => {
    const splashSVG = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="splashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0b0f14;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#111823;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0e141d;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- 背景 -->
        <rect width="${width}" height="${height}" fill="url(#splashGrad)"/>
        
        <!-- 中心图标 -->
        <g transform="translate(${width/2}, ${height/2})">
          ${generateSVGIcon(120, '#56ccf2', 'main').replace(/<svg[^>]*>|<\/svg>/g, '')}
        </g>
        
        <!-- 应用名称 -->
        <text x="${width/2}" y="${height/2 + 100}" text-anchor="middle" 
              font-family="-apple-system, BlinkMacSystemFont, sans-serif" 
              font-size="24" font-weight="600" fill="#e6efff">
          裂金7日
        </text>
        
        <!-- 加载指示器 -->
        <g transform="translate(${width/2}, ${height/2 + 150})">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#56ccf2" stroke-width="3" opacity="0.3"/>
          <circle cx="0" cy="0" r="20" fill="none" stroke="#56ccf2" stroke-width="3" 
                  stroke-dasharray="31.416" stroke-dashoffset="31.416">
            <animate attributeName="stroke-dashoffset" dur="2s" values="31.416;0;31.416" repeatCount="indefinite"/>
          </circle>
        </g>
      </svg>
    `;
    
    createIconFile(name, splashSVG);
  });
  
  console.log('✅ 启动画面生成完成！');
}

// 如果在Node.js环境中运行
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateAllIcons,
    generateSplashScreens,
    generateSVGIcon
  };
}

// 如果在浏览器中运行
if (typeof window !== 'undefined') {
  window.IconGenerator = {
    generateAllIcons,
    generateSplashScreens,
    generateSVGIcon
  };
}

// 自动执行
if (typeof require !== 'undefined') {
  // Node.js环境
  generateAllIcons();
  generateSplashScreens();
} else {
  // 浏览器环境
  console.log('图标生成器已加载，请调用 IconGenerator.generateAllIcons() 生成图标');
}