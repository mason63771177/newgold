/**
 * 全局背景Logo初始化脚本
 * 自动在所有页面添加带光晕效果的背景logo
 */

(function() {
  'use strict';
  
  // 等待DOM加载完成
  function initGlobalBackground() {
    // 检查是否已经添加过背景
    if (document.querySelector('.global-background')) {
      return;
    }
    
    // 创建背景容器
    const backgroundContainer = document.createElement('div');
    backgroundContainer.className = 'global-background';
    
    // 创建logo容器
    const logoContainer = document.createElement('div');
    logoContainer.className = 'global-logo';
    
    // 创建logo图片
    const logoImage = document.createElement('img');
    logoImage.className = 'global-logo-image';
    logoImage.src = 'logo_gold7.png'; // 正确的logo文件路径
    logoImage.alt = 'Background Logo';
    logoImage.loading = 'lazy';
    
    // 图片加载成功后的回调
    logoImage.onload = function() {
        adjustLogoPosition();
    };
    
    // 如果logo图片加载失败，使用SVG作为备用
    logoImage.onerror = function() {
        console.warn('Logo图片加载失败，使用SVG备用方案');
      // 创建SVG logo作为备用
      const svgLogo = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgLogo.setAttribute('viewBox', '0 0 200 200');
      svgLogo.setAttribute('class', 'global-logo-image');
      svgLogo.innerHTML = `
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:var(--accent-color, #40E0D0);stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:var(--secondary-color, #FF6B6B);stop-opacity:0.6" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="80" fill="url(#logoGradient)" />
        <circle cx="100" cy="100" r="60" fill="none" stroke="var(--accent-color, #40E0D0)" stroke-width="2" opacity="0.6" />
        <circle cx="100" cy="100" r="40" fill="none" stroke="var(--accent-color, #40E0D0)" stroke-width="1" opacity="0.4" />
        <text x="100" y="110" text-anchor="middle" fill="var(--text-primary, #ffffff)" font-size="24" font-weight="bold" opacity="0.8">LOGO</text>
      `;
      
      // 替换失败的图片
      logoContainer.removeChild(logoImage);
      logoContainer.appendChild(svgLogo);
    };
    
    // 组装元素
    logoContainer.appendChild(logoImage);
    backgroundContainer.appendChild(logoContainer);
    
    // 添加到页面最前面（但z-index最低）
    document.body.insertBefore(backgroundContainer, document.body.firstChild);
    
    // 添加样式表（如果还没有加载）
    if (!document.querySelector('link[href*="global-background.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'public/css/global-background.css';
      document.head.appendChild(link);
    }
    
    // 监听主题变化，调整logo透明度
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          adjustLogoForTheme();
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
    
    // 初始调整
    adjustLogoPosition();
  }
  
  // 检查页面类型，调整logo位置
  function adjustLogoPosition() {
    const logo = document.querySelector('.global-logo');
    if (!logo) return;
    
    // 检查是否是特殊页面（如登录、注册页面）
    const isAuthPage = document.body.classList.contains('auth-page') || 
                      window.location.pathname.includes('login') ||
                      window.location.pathname.includes('register');
    
    if (isAuthPage) {
      // 认证页面logo位置稍微上移
      logo.style.transform = 'translate(-50%, -60%)';
    } else {
      // 普通页面居中
      logo.style.transform = 'translate(-50%, -50%)';
    }
  }
  
  // 性能优化：防抖函数
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // 监听窗口大小变化，调整logo
  const debouncedResize = debounce(() => {
    adjustLogoPosition();
  }, 250);
  
  // 初始化函数
  function init() {
    initGlobalBackground();
    adjustLogoPosition();
    
    // 监听窗口大小变化
    window.addEventListener('resize', debouncedResize);
    
    // 监听页面可见性变化，优化性能
    document.addEventListener('visibilitychange', function() {
      const logo = document.querySelector('.global-logo');
      if (!logo) return;
      
      if (document.hidden) {
        // 页面隐藏时暂停动画
        logo.style.animationPlayState = 'paused';
      } else {
        // 页面显示时恢复动画
        logo.style.animationPlayState = 'running';
      }
    });
  }
  
  // DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // 导出到全局，供其他脚本调用
  window.GlobalBackground = {
    init: init,
    adjustLogoPosition: adjustLogoPosition
  };
  
})();