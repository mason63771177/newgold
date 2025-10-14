/**
 * Vite 构建配置
 * 基于 Toss Frontend Fundamentals 最佳实践
 * 实现模块打包和代码分离优化
 */

import { defineConfig } from 'vite';
import { resolve } from 'path';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

export default defineConfig({
  // 根目录
  root: '.',
  
  // 公共基础路径 - GitHub Pages需要使用仓库名作为base
  base: process.env.NODE_ENV === 'production' ? '/newgold/' : './',
  
  // 开发服务器配置
  server: {
    port: 3000,
    host: true,
    open: true,
    cors: true,
    // 代理配置（用于开发环境API调用）
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  // 预览服务器配置
  preview: {
    port: 8080,
    host: true,
    cors: true
  },
  
  // 构建配置
  build: {
    // 输出目录
    outDir: 'dist',
    
    // 静态资源目录
    assetsDir: 'assets',
    
    // 生成源码映射
    sourcemap: true,
    
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        // 移除console
        drop_console: true,
        // 移除debugger
        drop_debugger: true
      }
    },
    
    // 代码分割配置
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        // 手动代码分割
        manualChunks: {
          // 核心模块
          'core': [
            './src/core/app.js',
            './src/state/state-manager.js'
          ],
          
          // 服务模块
          'services': [
            './src/services/api-client.js'
          ],
          
          // 业务模块
          'business': [
            './src/core/countdown.js',
            './src/core/wallet.js',
            './src/core/task-manager.js'
          ],
          
          // UI组件
          'components': [
            './src/components/ui-components.js'
          ],
          
          // 工具模块
          'utils': [
            './src/utils/dom-helpers.js',
            './src/utils/i18n.js'
          ]
        },
        
        // 文件命名规则
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
            return `assets/media/[name]-[hash].${ext}`;
          }
          
          if (/\.(png|jpe?g|gif|svg|webp|avif)(\?.*)?$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash].${ext}`;
          }
          
          if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash].${ext}`;
          }
          
          return `assets/[ext]/[name]-[hash].${ext}`;
        }
      }
    },
    
    // 资源内联阈值
    assetsInlineLimit: 4096,
    
    // CSS 代码分割
    cssCodeSplit: true,
    
    // 报告压缩详情
    reportCompressedSize: false,
    
    // chunk 大小警告限制
    chunkSizeWarningLimit: 500
  },
  
  // CSS 配置
  css: {
    // CSS 模块化
    modules: {
      localsConvention: 'camelCase'
    },
    
    // CSS 预处理器配置
    preprocessorOptions: {
      scss: {
        additionalData: '@import "./src/styles/variables.scss";'
      }
    },
    
    // PostCSS 配置
    postcss: {
      plugins: [
        // 自动添加浏览器前缀
        autoprefixer,
        
        // CSS 压缩
        cssnano({
          preset: 'default'
        })
      ]
    }
  },
  
  // 路径解析配置
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
      '@components': resolve(__dirname, 'src/components'),
      '@services': resolve(__dirname, 'src/services'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@assets': resolve(__dirname, 'src/assets')
    },
    
    // 文件扩展名
    extensions: ['.js', '.ts', '.json', '.css', '.scss']
  },
  
  // 优化配置
  optimizeDeps: {
    // 预构建包含的依赖
    include: [],
    
    // 预构建排除的依赖
    exclude: []
  },
  
  // 环境变量配置
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  
  // 插件配置
  plugins: [
    // 自定义插件：生成构建信息
    {
      name: 'build-info',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'build-info.json',
          source: JSON.stringify({
            version: process.env.npm_package_version,
            buildTime: new Date().toISOString(),
            nodeVersion: process.version,
            platform: process.platform
          }, null, 2)
        });
      }
    }
  ],
  
  // 实验性功能
  experimental: {
    // 启用构建优化
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        return { js: `/${filename}` };
      } else {
        return { relative: true };
      }
    }
  }
});