#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import http.server
import socketserver
import os
import mimetypes

class UTF8HTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 为HTML文件设置正确的Content-Type和编码
        if self.path.endswith('.html') or self.path == '/':
            self.send_header('Content-Type', 'text/html; charset=utf-8')
        elif self.path.endswith('.css'):
            self.send_header('Content-Type', 'text/css; charset=utf-8')
        elif self.path.endswith('.js'):
            self.send_header('Content-Type', 'application/javascript; charset=utf-8')
        
        # 添加CORS头部
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
        super().end_headers()

    def guess_type(self, path):
        """重写guess_type方法以确保正确的MIME类型"""
        mimetype, encoding = mimetypes.guess_type(path)
        
        # 为HTML文件设置正确的MIME类型和编码
        if path.endswith('.html'):
            return 'text/html; charset=utf-8'
        elif path.endswith('.css'):
            return 'text/css; charset=utf-8'
        elif path.endswith('.js'):
            return 'application/javascript; charset=utf-8'
        
        return mimetype

    def do_GET(self):
        """
        覆盖 GET 处理逻辑（恢复旧流程）：
        - 当请求根路径 '/' 时，直接返回 '/index.html'（不再重定向到 /frontend/index.html）
        - 其他路径保持默认行为
        """
        if self.path == '/':
            self.path = '/index.html'
            return http.server.SimpleHTTPRequestHandler.do_GET(self)
        
        # 其他请求按默认静态文件处理
        return super().do_GET()

if __name__ == "__main__":
    PORT = 8000
    
    # 确保在正确的目录中运行
    os.chdir('/Users/mason1236/0930')
    
    with socketserver.TCPServer(("", PORT), UTF8HTTPRequestHandler) as httpd:
        print(f"🚀 HTTP服务器启动在端口 {PORT}")
        print(f"📂 服务目录: {os.getcwd()}")
        print(f"🌐 访问地址: http://localhost:{PORT}")
        print("✅ 支持UTF-8编码")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 服务器已停止")