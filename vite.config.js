/**
 * Vite 构建配置
 * 基于 Toss Frontend Fundamentals 最佳实践
 * 实现模块打包和代码分离优化
 */

import { defineConfig } from 'vite';
import { resolve } from 'path';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import fs from 'fs';
import path from 'path';

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
    
    // 代码压缩
    minify: 'esbuild',
    
    // 构建配置
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        'forgot-password': resolve(__dirname, 'forgot-password.html'),
        'reset-password': resolve(__dirname, 'reset-password.html'),
        'verify-email': resolve(__dirname, 'verify-email.html'),
        activation: resolve(__dirname, 'activation.html'),
        invite: resolve(__dirname, 'invite.html'),
        wallet: resolve(__dirname, 'wallet.html'),
        withdraw: resolve(__dirname, 'withdraw.html'),
        transaction: resolve(__dirname, 'transaction.html'),
        tasks: resolve(__dirname, 'tasks.html'),
        quiz: resolve(__dirname, 'quiz.html'),
        ranking: resolve(__dirname, 'ranking.html'),
        'ranking_user': resolve(__dirname, 'ranking_user.html'),
        record: resolve(__dirname, 'record.html'),
        redpacket: resolve(__dirname, 'redpacket.html'),
        team: resolve(__dirname, 'team.html'),
        'team_member': resolve(__dirname, 'team_member.html'),
        admin: resolve(__dirname, 'admin.html'),
        'admin-login': resolve(__dirname, 'admin-login.html')
      },
      external: ['fsevents'],
      output: {
          // 手动代码分割
          manualChunks: {
            // 移除不存在的文件引用
            'vendor': ['vite']
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
    
    // CSS 预处理器选项
    preprocessorOptions: {
      // 移除不存在的scss配置
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
  
  // 路径解析
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '@css': resolve(__dirname, 'css'),
      '@js': resolve(__dirname, 'js'),
      '@assets': resolve(__dirname, 'assets')
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
    // 自定义插件：复制JavaScript文件
    {
      name: 'copy-js-files',
      generateBundle() {
        // 复制js目录下的所有文件
        const jsDir = path.resolve(process.cwd(), 'js');
        
        if (fs.existsSync(jsDir)) {
          const files = fs.readdirSync(jsDir);
          files.forEach(file => {
            if (file.endsWith('.js')) {
              const filePath = path.join(jsDir, file);
              const content = fs.readFileSync(filePath, 'utf-8');
              this.emitFile({
                type: 'asset',
                fileName: `js/${file}`,
                source: content
              });
            }
          });
        }
      }
    },
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