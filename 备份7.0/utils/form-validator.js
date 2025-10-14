/**
 * 表单验证工具函数库
 * 提供通用的表单验证方法
 */

class FormValidator {
  /**
   * 验证邮箱格式
   * @param {string} email - 邮箱地址
   * @returns {Object} 验证结果
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    return {
      isValid,
      message: isValid ? '' : '请输入有效的邮箱地址'
    };
  }

  /**
   * 验证密码强度
   * @param {string} password - 密码
   * @param {Object} options - 验证选项
   * @returns {Object} 验证结果
   */
  static validatePassword(password, options = {}) {
    const {
      minLength = 6,
      requireUppercase = false,
      requireLowercase = false,
      requireNumbers = false,
      requireSpecialChars = false
    } = options;

    const errors = [];

    if (password.length < minLength) {
      errors.push(`密码长度至少${minLength}位`);
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母');
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母');
    }

    if (requireNumbers && !/\d/.test(password)) {
      errors.push('密码必须包含数字');
    }

    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('密码必须包含特殊字符');
    }

    return {
      isValid: errors.length === 0,
      message: errors.join('，'),
      strength: this.calculatePasswordStrength(password)
    };
  }

  /**
   * 计算密码强度
   * @param {string} password - 密码
   * @returns {string} 强度等级
   */
  static calculatePasswordStrength(password) {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score <= 2) return 'weak';
    if (score <= 3) return 'medium';
    return 'strong';
  }

  /**
   * 验证手机号码
   * @param {string} phone - 手机号码
   * @returns {Object} 验证结果
   */
  static validatePhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    const isValid = phoneRegex.test(phone);
    
    return {
      isValid,
      message: isValid ? '' : '请输入有效的手机号码'
    };
  }

  /**
   * 验证数字金额
   * @param {string|number} amount - 金额
   * @param {Object} options - 验证选项
   * @returns {Object} 验证结果
   */
  static validateAmount(amount, options = {}) {
    const {
      min = 0,
      max = Infinity,
      decimals = 2,
      required = true
    } = options;

    if (!required && (amount === '' || amount === null || amount === undefined)) {
      return { isValid: true, message: '' };
    }

    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount)) {
      return { isValid: false, message: '请输入有效的数字' };
    }

    if (numAmount < min) {
      return { isValid: false, message: `金额不能小于${min}` };
    }

    if (numAmount > max) {
      return { isValid: false, message: `金额不能大于${max}` };
    }

    // 检查小数位数
    const decimalPlaces = (amount.toString().split('.')[1] || '').length;
    if (decimalPlaces > decimals) {
      return { isValid: false, message: `小数位数不能超过${decimals}位` };
    }

    return { isValid: true, message: '' };
  }

  /**
   * 验证钱包地址
   * @param {string} address - 钱包地址
   * @param {string} type - 地址类型 (bitcoin, ethereum, tron等)
   * @returns {Object} 验证结果
   */
  static validateWalletAddress(address, type = 'tron') {
    if (!address || address.trim() === '') {
      return { isValid: false, message: '请输入钱包地址' };
    }

    let regex;
    let errorMessage = '请输入有效的钱包地址';

    switch (type.toLowerCase()) {
      case 'bitcoin':
        regex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/;
        errorMessage = '请输入有效的比特币地址';
        break;
      case 'ethereum':
        regex = /^0x[a-fA-F0-9]{40}$/;
        errorMessage = '请输入有效的以太坊地址';
        break;
      case 'tron':
        regex = /^T[A-Za-z1-9]{33}$/;
        errorMessage = '请输入有效的TRON地址';
        break;
      default:
        regex = /^[A-Za-z0-9]{26,35}$/;
    }

    const isValid = regex.test(address.trim());
    
    return {
      isValid,
      message: isValid ? '' : errorMessage
    };
  }

  /**
   * 验证必填字段
   * @param {string} value - 字段值
   * @param {string} fieldName - 字段名称
   * @returns {Object} 验证结果
   */
  static validateRequired(value, fieldName = '此字段') {
    const isValid = value !== null && value !== undefined && value.toString().trim() !== '';
    
    return {
      isValid,
      message: isValid ? '' : `${fieldName}不能为空`
    };
  }

  /**
   * 验证字符串长度
   * @param {string} value - 字符串值
   * @param {Object} options - 验证选项
   * @returns {Object} 验证结果
   */
  static validateLength(value, options = {}) {
    const { min = 0, max = Infinity, fieldName = '此字段' } = options;
    const length = value ? value.toString().length : 0;

    if (length < min) {
      return { isValid: false, message: `${fieldName}长度不能少于${min}个字符` };
    }

    if (length > max) {
      return { isValid: false, message: `${fieldName}长度不能超过${max}个字符` };
    }

    return { isValid: true, message: '' };
  }

  /**
   * 批量验证表单字段
   * @param {Object} formData - 表单数据
   * @param {Object} rules - 验证规则
   * @returns {Object} 验证结果
   */
  static validateForm(formData, rules) {
    const errors = {};
    let isValid = true;

    Object.entries(rules).forEach(([fieldName, fieldRules]) => {
      const value = formData[fieldName];
      const fieldErrors = [];

      fieldRules.forEach(rule => {
        const { type, options = {}, message } = rule;
        let result;

        switch (type) {
          case 'required':
            result = this.validateRequired(value, options.fieldName || fieldName);
            break;
          case 'email':
            result = this.validateEmail(value);
            break;
          case 'password':
            result = this.validatePassword(value, options);
            break;
          case 'phone':
            result = this.validatePhone(value);
            break;
          case 'amount':
            result = this.validateAmount(value, options);
            break;
          case 'walletAddress':
            result = this.validateWalletAddress(value, options.type);
            break;
          case 'length':
            result = this.validateLength(value, { ...options, fieldName });
            break;
          default:
            result = { isValid: true, message: '' };
        }

        if (!result.isValid) {
          fieldErrors.push(message || result.message);
          isValid = false;
        }
      });

      if (fieldErrors.length > 0) {
        errors[fieldName] = fieldErrors;
      }
    });

    return {
      isValid,
      errors,
      firstError: isValid ? '' : Object.values(errors)[0][0]
    };
  }

  /**
   * 实时验证表单字段
   * @param {HTMLElement} form - 表单元素
   * @param {Object} rules - 验证规则
   * @param {Function} callback - 验证结果回调
   */
  static setupRealTimeValidation(form, rules, callback) {
    if (!form) return;

    Object.keys(rules).forEach(fieldName => {
      const field = form.querySelector(`[name="${fieldName}"]`);
      if (!field) return;

      const validateField = () => {
        const formData = new FormData(form);
        const fieldValue = formData.get(fieldName);
        const fieldRules = { [fieldName]: rules[fieldName] };
        const result = this.validateForm({ [fieldName]: fieldValue }, fieldRules);
        
        if (callback) {
          callback(fieldName, result.errors[fieldName] || [], result.isValid);
        }
      };

      field.addEventListener('blur', validateField);
      field.addEventListener('input', () => {
        // 延迟验证，避免用户输入时频繁提示
        clearTimeout(field.validationTimeout);
        field.validationTimeout = setTimeout(validateField, 500);
      });
    });
  }

  /**
   * 显示验证错误信息
   * @param {HTMLElement} field - 表单字段
   * @param {Array} errors - 错误信息数组
   */
  static showFieldErrors(field, errors) {
    if (!field) return;

    // 移除之前的错误提示
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }

    // 更新字段样式
    if (errors.length > 0) {
      field.classList.add('error');
      
      // 添加错误提示
      const errorDiv = document.createElement('div');
      errorDiv.className = 'field-error';
      errorDiv.style.cssText = 'color: #ff4757; font-size: 12px; margin-top: 4px;';
      errorDiv.textContent = errors[0];
      field.parentNode.appendChild(errorDiv);
    } else {
      field.classList.remove('error');
    }
  }
}

// 导出工具类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormValidator;
} else if (typeof window !== 'undefined') {
  window.FormValidator = FormValidator;
}