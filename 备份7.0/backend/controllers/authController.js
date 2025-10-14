const User = require('../models/User');
const UserService = require('../services/userService');
const { generateToken, blacklistToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const emailService = require('../services/EmailService');

class AuthController {
  // 用户注册
  static async register(req, res) {
    try {
      // 验证输入
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
      }

      const { email, password, inviterCode } = req.body;

      // 检查邮箱是否已注册
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '该邮箱已注册'
        });
      }

      // 验证邀请码（临时允许空邀请码用于测试）
      if (inviterCode) {
        const inviter = await User.findByInviteCode(inviterCode);
        if (!inviter) {
          return res.status(400).json({
            success: false,
            message: '邀请码无效'
          });
        }
      }

      // 创建用户并生成TRC20地址
      const userService = new UserService();
      const result = await userService.createUserWithTRC20Address({
        email,
        password,
        inviterCode
      });
      
      const user = result.user;

      // 生成验证token并发送验证邮件
      const verificationToken = emailService.generateVerificationToken();
      await user.setVerificationToken(verificationToken);
      
      const emailResult = await emailService.sendVerificationEmail(
        email, 
        verificationToken, 
        email.split('@')[0] // 使用邮箱前缀作为用户名
      );

      // 生成登录token
      const token = generateToken(user.id);

      res.status(201).json({
        success: true,
        message: '注册成功，请检查邮箱完成验证',
        data: {
          user: user.toSafeObject(),
          token,
          emailSent: emailResult.success,
          emailMessage: emailResult.message
        }
      });

    } catch (error) {
      console.error('注册错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '注册失败'
      });
    }
  }

  // 用户登录
  static async login(req, res) {
    try {
      // 验证输入
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // 查找用户
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '邮箱或密码错误'
        });
      }

      // 验证密码
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: '邮箱或密码错误'
        });
      }

      // 检查邮箱是否已验证
      if (!user.email_verified) {
        return res.status(403).json({
          success: false,
          message: '请先验证邮箱后再登录',
          needEmailVerification: true,
          email: user.email
        });
      }

      // 检查用户状态，如果倒计时结束且状态为2，自动转为状态3
      if (user.status === 2 && user.isCountdownExpired()) {
        await user.updateStatus(3);
      }

      // 生成token
      const token = generateToken(user.id);

      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: user.toSafeObject(),
          token
        }
      });

    } catch (error) {
      console.error('登录错误:', error);
      res.status(500).json({
        success: false,
        message: '登录失败'
      });
    }
  }

  // 用户登出
  static async logout(req, res) {
    try {
      // 将当前token加入黑名单
      if (req.token) {
        await blacklistToken(req.token);
      }

      res.json({
        success: true,
        message: '登出成功'
      });

    } catch (error) {
      console.error('登出错误:', error);
      res.status(500).json({
        success: false,
        message: '登出失败'
      });
    }
  }

  // 获取当前用户信息
  static async getProfile(req, res) {
    try {
      const user = req.user;

      // 检查用户状态，如果倒计时结束且状态为2，自动转为状态3
      if (user.status === 2 && user.isCountdownExpired()) {
        await user.updateStatus(3);
      }

      // 获取团队信息
      const teamInfo = await user.getTeamInfo();

      res.json({
        success: true,
        data: {
          user: user.toSafeObject(),
          teamInfo
        }
      });

    } catch (error) {
      console.error('获取用户信息错误:', error);
      res.status(500).json({
        success: false,
        message: '获取用户信息失败'
      });
    }
  }

  // 验证邀请码
  static async validateInviteCode(req, res) {
    try {
      const { inviteCode } = req.params;

      const inviter = await User.findByInviteCode(inviteCode);
      if (!inviter) {
        return res.status(404).json({
          success: false,
          message: '邀请码无效'
        });
      }

      res.json({
        success: true,
        message: '邀请码有效',
        data: {
          inviterEmail: inviter.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // 隐藏部分邮箱
          inviterTeamCount: inviter.team_count
        }
      });

    } catch (error) {
      console.error('验证邀请码错误:', error);
      res.status(500).json({
        success: false,
        message: '验证邀请码失败'
      });
    }
  }

  // 刷新token
  static async refreshToken(req, res) {
    try {
      const user = req.user;
      
      // 将旧token加入黑名单
      if (req.token) {
        await blacklistToken(req.token);
      }

      // 生成新token
      const newToken = generateToken(user.id);

      res.json({
        success: true,
        message: 'Token刷新成功',
        data: {
          token: newToken
        }
      });

    } catch (error) {
      console.error('刷新token错误:', error);
      res.status(500).json({
        success: false,
        message: '刷新token失败'
      });
    }
  }

  // 验证邮箱
  static async verifyEmail(req, res) {
    try {
      const { token, email } = req.query;

      if (!token || !email) {
        return res.status(400).json({
          success: false,
          message: '缺少验证参数'
        });
      }

      // 根据token查找用户
      const user = await User.findByVerificationToken(token);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: '验证链接无效或已过期'
        });
      }

      // 验证邮箱是否匹配
      if (user.email !== email) {
        return res.status(400).json({
          success: false,
          message: '验证链接与邮箱不匹配'
        });
      }

      // 执行邮箱验证
      const result = await user.verifyEmail(token);
      
      if (result.success) {
        res.json({
          success: true,
          message: '邮箱验证成功，您现在可以正常使用所有功能'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('邮箱验证错误:', error);
      res.status(500).json({
        success: false,
        message: '邮箱验证失败'
      });
    }
  }

  // 重新发送验证邮件
  static async resendVerificationEmail(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: '请提供邮箱地址'
        });
      }

      // 查找用户
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 检查是否可以重新发送
      const canResend = user.canResendVerificationEmail();
      if (!canResend.canSend) {
        return res.status(400).json({
          success: false,
          message: canResend.message
        });
      }

      // 生成新的验证token
      const verificationToken = emailService.generateVerificationToken();
      await user.setVerificationToken(verificationToken);

      // 发送验证邮件
      const emailResult = await emailService.sendVerificationEmail(
        email,
        verificationToken,
        email.split('@')[0]
      );

      res.json({
        success: true,
        message: '验证邮件已重新发送，请检查您的邮箱',
        emailSent: emailResult.success
      });

    } catch (error) {
      console.error('重新发送验证邮件错误:', error);
      res.status(500).json({
        success: false,
        message: '发送验证邮件失败'
      });
    }
  }

  // 请求密码重置
  static async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: '请提供邮箱地址'
        });
      }

      // 查找用户
      const user = await User.findByEmail(email);
      if (!user) {
        // 为了安全，不透露用户是否存在
        return res.json({
          success: true,
          message: '如果该邮箱已注册，您将收到密码重置邮件'
        });
      }

      // 生成重置token
      const resetToken = emailService.generateVerificationToken();
      await user.setPasswordResetToken(resetToken);

      // 发送重置邮件
      const emailResult = await emailService.sendPasswordResetEmail(
        email,
        resetToken,
        email.split('@')[0]
      );

      res.json({
        success: true,
        message: '如果该邮箱已注册，您将收到密码重置邮件',
        emailSent: emailResult.success
      });

    } catch (error) {
      console.error('请求密码重置错误:', error);
      res.status(500).json({
        success: false,
        message: '请求密码重置失败'
      });
    }
  }

  // 重置密码
  static async resetPassword(req, res) {
    try {
      const { token, email, newPassword } = req.body;

      if (!token || !email || !newPassword) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: '密码至少需要6位字符'
        });
      }

      // 根据token查找用户
      const user = await User.findByPasswordResetToken(token);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: '重置链接无效或已过期'
        });
      }

      // 验证邮箱是否匹配
      if (user.email !== email) {
        return res.status(400).json({
          success: false,
          message: '重置链接与邮箱不匹配'
        });
      }

      // 执行密码重置
      const result = await user.resetPassword(newPassword, token);
      
      if (result.success) {
        res.json({
          success: true,
          message: '密码重置成功，请使用新密码登录'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('重置密码错误:', error);
      res.status(500).json({
        success: false,
        message: '重置密码失败'
      });
    }
  }
}

// 输入验证规则
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码至少需要6位字符'),
  body('inviterCode')
    .optional()
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
];

module.exports = {
  AuthController,
  registerValidation,
  loginValidation
};