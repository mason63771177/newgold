const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.testAccount = null;
    this.initializeTransporter();
  }

  // 初始化邮件传输器
  async initializeTransporter() {
    try {
      // 检查必要的环境变量
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️ 邮件服务配置不完整，使用Ethereal测试账号');
        await this.createEtherealTestAccount();
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      this.isConfigured = true;
      console.log('✅ 邮件服务初始化成功');
    } catch (error) {
      console.error('❌ 邮件服务初始化失败:', error);
      console.log('🔄 尝试创建Ethereal测试账号...');
      await this.createEtherealTestAccount();
    }
  }

  // 创建Ethereal测试账号
  async createEtherealTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      this.isConfigured = true;
      this.testAccount = testAccount;
      console.log('✅ Ethereal测试账号创建成功');
      console.log('📧 测试邮箱:', testAccount.user);
      console.log('🔗 邮箱管理: https://ethereal.email/login');
    } catch (error) {
      console.error('❌ 创建Ethereal测试账号失败:', error);
      this.isConfigured = false;
    }
  }

  // 验证邮件服务连接
  async verifyConnection() {
    if (!this.isConfigured) {
      throw new Error('邮件服务未配置');
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('邮件服务连接验证失败:', error);
      return false;
    }
  }

  // 生成验证token
  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // 发送邮箱验证邮件
  async sendVerificationEmail(email, verificationToken, userName = '') {
    if (!this.isConfigured) {
      console.warn('邮件服务未配置，跳过发送验证邮件');
      return { success: false, message: '邮件服务未配置' };
    }

    try {
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:8000'}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
      
      const mailOptions = {
        from: {
          name: process.env.FROM_NAME || 'Gold7 Game',
          address: process.env.FROM_EMAIL || process.env.SMTP_USER || this.testAccount?.user
        },
        to: email,
        subject: '验证您的邮箱地址 - Gold7 Game',
        html: this.getVerificationEmailTemplate(userName, verificationUrl, email)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ 验证邮件发送成功:', result.messageId);
      
      // 如果使用Ethereal测试账号，提供预览链接
      if (this.testAccount) {
        const previewUrl = nodemailer.getTestMessageUrl(result);
        console.log('📧 邮件预览链接:', previewUrl);
        return {
          success: true,
          messageId: result.messageId,
          message: '验证邮件发送成功',
          previewUrl: previewUrl
        };
      }
      
      return {
        success: true,
        messageId: result.messageId,
        message: '验证邮件发送成功'
      };
    } catch (error) {
      console.error('❌ 发送验证邮件失败:', error);
      return {
        success: false,
        message: '发送验证邮件失败',
        error: error.message
      };
    }
  }

  // 发送密码重置邮件
  async sendPasswordResetEmail(email, resetToken, userName = '') {
    if (!this.isConfigured) {
      console.warn('邮件服务未配置，跳过发送密码重置邮件');
      return { success: false, message: '邮件服务未配置' };
    }

    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
      
      const mailOptions = {
        from: {
          name: process.env.FROM_NAME || 'Gold7 Game',
          address: process.env.FROM_EMAIL || process.env.SMTP_USER
        },
        to: email,
        subject: '重置您的密码 - Gold7 Game',
        html: this.getPasswordResetEmailTemplate(userName, resetUrl, email)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ 密码重置邮件发送成功:', result.messageId);
      
      return {
        success: true,
        messageId: result.messageId,
        message: '密码重置邮件发送成功'
      };
    } catch (error) {
      console.error('❌ 发送密码重置邮件失败:', error);
      return {
        success: false,
        message: '发送密码重置邮件失败',
        error: error.message
      };
    }
  }

  // 邮箱验证邮件模板
  getVerificationEmailTemplate(userName, verificationUrl, email) {
    return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>验证您的邮箱地址</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background: white;
                border-radius: 10px;
                padding: 40px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #ff6b35;
                margin-bottom: 10px;
            }
            .title {
                font-size: 24px;
                color: #333;
                margin-bottom: 20px;
            }
            .content {
                font-size: 16px;
                line-height: 1.8;
                margin-bottom: 30px;
            }
            .verify-btn {
                display: inline-block;
                background: linear-gradient(135deg, #ff6b35, #f7931e);
                color: white;
                text-decoration: none;
                padding: 15px 30px;
                border-radius: 25px;
                font-weight: bold;
                text-align: center;
                margin: 20px 0;
                box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
            }
            .verify-btn:hover {
                background: linear-gradient(135deg, #e55a2b, #e8841a);
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                font-size: 14px;
                color: #666;
                text-align: center;
            }
            .warning {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 5px;
                padding: 15px;
                margin: 20px 0;
                color: #856404;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏆 Gold7 Game</div>
                <h1 class="title">验证您的邮箱地址</h1>
            </div>
            
            <div class="content">
                <p>您好${userName ? ` ${userName}` : ''}！</p>
                
                <p>感谢您注册 Gold7 Game！为了确保账户安全，请点击下方按钮验证您的邮箱地址：</p>
                
                <div style="text-align: center;">
                    <a href="${verificationUrl}" class="verify-btn">验证邮箱地址</a>
                </div>
                
                <p>如果按钮无法点击，请复制以下链接到浏览器地址栏：</p>
                <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">
                    ${verificationUrl}
                </p>
                
                <div class="warning">
                    <strong>⚠️ 安全提醒：</strong>
                    <ul>
                        <li>此验证链接将在24小时后失效</li>
                        <li>如果您没有注册 Gold7 Game，请忽略此邮件</li>
                        <li>请勿将此链接分享给他人</li>
                    </ul>
                </div>
            </div>
            
            <div class="footer">
                <p>此邮件由系统自动发送，请勿回复。</p>
                <p>如有疑问，请联系客服支持。</p>
                <p>&copy; 2024 Gold7 Game. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // 密码重置邮件模板
  getPasswordResetEmailTemplate(userName, resetUrl, email) {
    return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>重置您的密码</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background: white;
                border-radius: 10px;
                padding: 40px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #ff6b35;
                margin-bottom: 10px;
            }
            .title {
                font-size: 24px;
                color: #333;
                margin-bottom: 20px;
            }
            .content {
                font-size: 16px;
                line-height: 1.8;
                margin-bottom: 30px;
            }
            .reset-btn {
                display: inline-block;
                background: linear-gradient(135deg, #ff6b35, #f7931e);
                color: white;
                text-decoration: none;
                padding: 15px 30px;
                border-radius: 25px;
                font-weight: bold;
                text-align: center;
                margin: 20px 0;
                box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
            }
            .reset-btn:hover {
                background: linear-gradient(135deg, #e55a2b, #e8841a);
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                font-size: 14px;
                color: #666;
                text-align: center;
            }
            .warning {
                background: #f8d7da;
                border: 1px solid #f5c6cb;
                border-radius: 5px;
                padding: 15px;
                margin: 20px 0;
                color: #721c24;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏆 Gold7 Game</div>
                <h1 class="title">重置您的密码</h1>
            </div>
            
            <div class="content">
                <p>您好${userName ? ` ${userName}` : ''}！</p>
                
                <p>我们收到了您的密码重置请求。点击下方按钮设置新密码：</p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="reset-btn">重置密码</a>
                </div>
                
                <p>如果按钮无法点击，请复制以下链接到浏览器地址栏：</p>
                <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">
                    ${resetUrl}
                </p>
                
                <div class="warning">
                    <strong>🔒 安全提醒：</strong>
                    <ul>
                        <li>此重置链接将在1小时后失效</li>
                        <li>如果您没有请求重置密码，请忽略此邮件</li>
                        <li>为了账户安全，请设置强密码</li>
                        <li>请勿将此链接分享给他人</li>
                    </ul>
                </div>
            </div>
            
            <div class="footer">
                <p>此邮件由系统自动发送，请勿回复。</p>
                <p>如有疑问，请联系客服支持。</p>
                <p>&copy; 2024 Gold7 Game. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // 获取服务状态
  getStatus() {
    return {
      configured: this.isConfigured,
      host: process.env.SMTP_HOST || 'Not configured',
      port: process.env.SMTP_PORT || 'Not configured',
      user: process.env.SMTP_USER || 'Not configured'
    };
  }
}

// 创建单例实例
const emailService = new EmailService();

module.exports = emailService;