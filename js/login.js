/**
 * 登录页面JavaScript逻辑
 * 包含表单切换、表单验证、密码强度检测等功能
 */

// 全局变量
let currentForm = 'login';

// API配置 - GitHub Pages兼容模式
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000/api' 
    : null; // GitHub Pages模式：不使用后端API

/**
 * 页面初始化函数
 * 在DOM加载完成后执行所有初始化操作
 */
document.addEventListener('DOMContentLoaded', function() {
    // 检查登录状态，如果已登录则跳转到主页
    checkLoginStatus();
    
    // 设置表单切换事件
    setupFormTabs();
    
    // 设置表单验证
    setupFormValidation();
    
    // 设置密码强度检测
    setupPasswordStrength();
    
    // 设置键盘事件
    setupKeyboardEvents();
    
    // 设置页面可见性监听
    setupVisibilityListener();
});

/**
 * 检查登录状态
 * 如果用户已登录，则跳转到主页
 */
function checkLoginStatus() {
    const currentUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('authToken');
    
    if (currentUser && token) {
        // 用户已登录，跳转到主页
        console.log('用户已登录，跳转到主页');
        window.location.href = 'index.html';
    }
}

/**
 * 表单切换功能设置
 * 为表单切换按钮添加点击事件监听器
 */
function setupFormTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const formType = this.getAttribute('data-form');
            switchForm(formType);
        });
    });
}

/**
 * 表单切换函数
 * 在登录和注册表单之间切换
 * @param {string} formType - 表单类型 ('login' 或 'register')
 */
function switchForm(formType) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginTab = document.querySelector('[data-form="login"]');
    const registerTab = document.querySelector('[data-form="register"]');
    
    if (formType === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        currentForm = 'login';
    } else if (formType === 'register') {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
        currentForm = 'register';
    }
    
    // 清除所有表单验证状态
    clearFormValidation();
}

/**
 * 表单验证设置
 * 为表单输入框添加实时验证功能
 */
function setupFormValidation() {
    // 登录表单验证
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    
    if (loginEmail) {
        setupEmailValidation(loginEmail);
    }
    
    if (loginPassword) {
        setupDynamicInputState(loginPassword, (value) => value.length >= 6);
    }
    
    // 注册表单验证
    const registerEmail = document.getElementById('registerEmail');
    const registerPassword = document.getElementById('registerPassword');
    const inviteCode = document.getElementById('inviteCode');
    
    if (registerEmail) {
        setupEmailValidation(registerEmail);
    }
    
    if (registerPassword) {
        setupDynamicInputState(registerPassword, (value) => value.length >= 6);
    }
    
    if (inviteCode) {
        setupDynamicInputState(inviteCode, (value) => value.length >= 6);
    }
    
    // 表单提交事件
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleRegister();
        });
    }
}

/**
 * 邮箱验证设置
 * 为邮箱输入框添加实时验证和自定义提示
 * @param {HTMLElement} emailInput - 邮箱输入框元素
 */
function setupEmailValidation(emailInput) {
    const tooltip = emailInput.parentElement.querySelector('.custom-validation-tooltip');
    let validationTimeout;
    
    emailInput.addEventListener('input', function() {
        const email = this.value.trim();
        
        // 清除之前的验证超时
        if (validationTimeout) {
            clearTimeout(validationTimeout);
        }
        
        // 移除之前的验证状态
        this.classList.remove('valid', 'invalid');
        hideCustomValidationTooltip(tooltip);
        
        if (email === '') {
            return;
        }
        
        // 延迟验证，避免输入过程中频繁提示
        validationTimeout = setTimeout(() => {
            if (isValidEmail(email)) {
                this.classList.add('valid');
                hideCustomValidationTooltip(tooltip);
            } else {
                this.classList.add('invalid');
                showCustomValidationTooltip(tooltip, '请输入有效的邮箱地址', 'error');
            }
        }, 500);
    });
    
    // 失去焦点时立即验证
    emailInput.addEventListener('blur', function() {
        const email = this.value.trim();
        
        if (validationTimeout) {
            clearTimeout(validationTimeout);
        }
        
        this.classList.remove('valid', 'invalid');
        hideCustomValidationTooltip(tooltip);
        
        if (email === '') {
            return;
        }
        
        if (isValidEmail(email)) {
            this.classList.add('valid');
            hideCustomValidationTooltip(tooltip);
        } else {
            this.classList.add('invalid');
            showCustomValidationTooltip(tooltip, '请输入有效的邮箱地址', 'error');
        }
    });
    
    // 获得焦点时隐藏提示
    emailInput.addEventListener('focus', function() {
        hideCustomValidationTooltip(tooltip);
    });
}

/**
 * 显示自定义验证提示框
 * @param {HTMLElement} tooltip - 提示框元素
 * @param {string} message - 提示消息
 * @param {string} type - 提示类型 ('error', 'success', 'warning')
 */
function showCustomValidationTooltip(tooltip, message, type = 'error') {
    if (tooltip) {
        tooltip.textContent = message;
        tooltip.className = `custom-validation-tooltip ${type} show`;
    }
}

/**
 * 隐藏自定义验证提示框
 * @param {HTMLElement} tooltip - 提示框元素
 */
function hideCustomValidationTooltip(tooltip) {
    if (tooltip) {
        tooltip.classList.remove('show');
    }
}

/**
 * 处理登录表单提交
 * GitHub Pages模式：使用本地存储验证登录
 */
async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitBtn = document.querySelector('#loginForm .submit-btn');
    
    // 验证表单
    if (!validateLoginForm(email, password)) {
        return;
    }
    
    // 显示加载状态
    showLoadingState(submitBtn, '登录中...');
    
    try {
        if (API_BASE_URL) {
            // 本地开发模式：调用后端API
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // 登录成功
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                showMessage('登录成功！正在跳转...', 'success');
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                // 登录失败
                showMessage(data.message || '登录失败，请检查邮箱和密码', 'error');
            }
        } else {
            // GitHub Pages模式：使用本地存储模拟登录
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                // 登录成功
                const token = 'mock_token_' + Date.now();
                localStorage.setItem('authToken', token);
                localStorage.setItem('currentUser', JSON.stringify(user));
                showMessage('登录成功！正在跳转...', 'success');
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                // 登录失败
                showMessage('登录失败，请检查邮箱和密码', 'error');
            }
        }
    } catch (error) {
        console.error('登录错误:', error);
        showMessage('网络错误，请稍后重试', 'error');
    } finally {
        // 恢复按钮状态
        hideLoadingState(submitBtn, '登录');
    }
}

/**
 * 处理注册表单提交
 * GitHub Pages模式：使用本地存储模拟注册
 */
async function handleRegister() {
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const inviteCode = document.getElementById('inviteCode').value.trim();
    const submitBtn = document.querySelector('#registerForm .submit-btn');
    
    // 验证表单
    if (!validateRegisterForm(email, password, inviteCode)) {
        return;
    }
    
    // 显示加载状态
    showLoadingState(submitBtn, '注册中...');
    
    try {
        if (API_BASE_URL) {
            // 本地开发模式：调用后端API
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, inviteCode })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // 注册成功
                showMessage('注册成功！请登录', 'success');
                
                setTimeout(() => {
                    switchForm('login');
                    document.getElementById('loginEmail').value = email;
                }, 1500);
            } else {
                // 注册失败
                showMessage(data.message || '注册失败，请重试', 'error');
            }
        } else {
            // GitHub Pages模式：使用本地存储模拟注册
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            // 检查邮箱是否已存在
            if (users.some(u => u.email === email)) {
                showMessage('该邮箱已被注册', 'error');
                return;
            }
            
            // 创建新用户
            const newUser = {
                id: Date.now(),
                email,
                password,
                inviteCode,
                createdAt: new Date().toISOString()
            };
            
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            
            showMessage('注册成功！请登录', 'success');
            
            setTimeout(() => {
                switchForm('login');
                document.getElementById('loginEmail').value = email;
            }, 1500);
        }
    } catch (error) {
        console.error('注册错误:', error);
        showMessage('网络错误，请稍后重试', 'error');
    } finally {
        // 恢复按钮状态
        hideLoadingState(submitBtn, '注册');
    }
}

/**
 * 验证登录表单
 * @param {string} email - 邮箱
 * @param {string} password - 密码
 * @returns {boolean} 验证是否通过
 */
function validateLoginForm(email, password) {
    if (!email) {
        showMessage('请输入邮箱', 'error');
        return false;
    }
    
    if (!isValidEmail(email)) {
        showMessage('请输入有效的邮箱地址', 'error');
        return false;
    }
    
    if (!password) {
        showMessage('请输入密码', 'error');
        return false;
    }
    
    return true;
}

/**
 * 验证注册表单
 * @param {string} email - 邮箱
 * @param {string} password - 密码
 * @param {string} inviteCode - 邀请码
 * @returns {boolean} 验证是否通过
 */
function validateRegisterForm(email, password, inviteCode) {
    if (!email) {
        showMessage('请输入邮箱', 'error');
        return false;
    }
    
    if (!isValidEmail(email)) {
        showMessage('请输入有效的邮箱地址', 'error');
        return false;
    }
    
    if (!password) {
        showMessage('请输入密码', 'error');
        return false;
    }
    
    if (password.length < 6) {
        showMessage('密码长度至少6位', 'error');
        return false;
    }
    
    if (!inviteCode) {
        showMessage('请输入邀请码', 'error');
        return false;
    }
    
    if (inviteCode.length < 6) {
        showMessage('邀请码长度至少6位', 'error');
        return false;
    }
    
    return true;
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否为有效邮箱
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * 密码强度检测设置
 * 为密码输入框添加强度检测功能
 */
function setupPasswordStrength() {
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    
    passwordInputs.forEach(input => {
        input.addEventListener('input', function() {
            updatePasswordStrength(this.value);
        });
    });
}

/**
 * 更新密码强度显示
 * @param {string} password - 密码
 */
function updatePasswordStrength(password) {
    const strengthMeter = document.querySelector('.password-strength-meter');
    const strengthText = document.querySelector('.password-strength-text');
    
    if (!strengthMeter || !strengthText) return;
    
    const strength = calculatePasswordStrength(password);
    
    // 更新强度条
    strengthMeter.className = `password-strength-meter strength-${strength.level}`;
    strengthMeter.style.width = `${strength.percentage}%`;
    
    // 更新强度文本
    strengthText.textContent = strength.text;
    strengthText.className = `password-strength-text strength-${strength.level}`;
}

/**
 * 计算密码强度
 * @param {string} password - 密码
 * @returns {Object} 强度信息
 */
function calculatePasswordStrength(password) {
    let score = 0;
    let level = 'weak';
    let text = '弱';
    
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    if (score >= 5) {
        level = 'strong';
        text = '强';
    } else if (score >= 3) {
        level = 'medium';
        text = '中';
    }
    
    const percentage = Math.min((score / 6) * 100, 100);
    
    return { level, text, percentage, score };
}

/**
 * 显示按钮加载状态
 * @param {HTMLElement} button - 按钮元素
 * @param {string} text - 加载文本
 */
function showLoadingState(button, text) {
    button.disabled = true;
    button.textContent = text;
    button.classList.add('loading');
}

/**
 * 隐藏按钮加载状态
 * @param {HTMLElement} button - 按钮元素
 * @param {string} text - 原始文本
 */
function hideLoadingState(button, text) {
    button.disabled = false;
    button.textContent = text;
    button.classList.remove('loading');
}

/**
 * 显示消息提示
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 ('success', 'error', 'warning', 'info')
 */
function showMessage(message, type = 'info') {
    // 移除现有的消息
    const existingMessage = document.querySelector('.message-toast');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // 创建新的消息元素
    const messageElement = document.createElement('div');
    messageElement.className = `message-toast ${type}`;
    messageElement.textContent = message;
    
    // 添加到页面
    document.body.appendChild(messageElement);
    
    // 显示动画
    setTimeout(() => {
        messageElement.classList.add('show');
    }, 10);
    
    // 自动隐藏
    setTimeout(() => {
        messageElement.classList.remove('show');
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 300);
    }, 3000);
}

/**
 * 键盘事件设置
 * 为表单添加回车键提交功能
 */
function setupKeyboardEvents() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const activeForm = currentForm === 'login' ? 
                document.getElementById('loginForm') : 
                document.getElementById('registerForm');
            
            if (activeForm && activeForm.style.display !== 'none') {
                e.preventDefault();
                const submitBtn = activeForm.querySelector('.submit-btn');
                if (submitBtn && !submitBtn.disabled) {
                    submitBtn.click();
                }
            }
        }
    });
}

/**
 * 页面可见性监听设置
 * 当页面重新可见时清除表单验证状态
 */
function setupVisibilityListener() {
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            clearFormValidation();
        }
    });
}

function showLogin() {
    switchForm('login');
}

function showRegister() {
    switchForm('register');
}

function checkPasswordStrength(password) {
    return calculatePasswordStrength(password);
}

/**
 * 清除表单验证状态
 */
function clearFormValidation() {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.classList.remove('valid', 'invalid');
    });
    
    const tooltips = document.querySelectorAll('.custom-validation-tooltip');
    tooltips.forEach(tooltip => {
        hideCustomValidationTooltip(tooltip);
    });
}

/**
 * 设置动态输入状态
 * @param {HTMLElement} input - 输入框元素
 * @param {Function} validationFn - 验证函数
 */
function setupDynamicInputState(input, validationFn) {
    const tooltip = input.parentElement.querySelector('.custom-validation-tooltip');
    let validationTimeout;
    
    input.addEventListener('input', function() {
        const value = this.value.trim();
        
        // 清除之前的验证超时
        if (validationTimeout) {
            clearTimeout(validationTimeout);
        }
        
        // 移除之前的验证状态
        this.classList.remove('valid', 'invalid');
        hideCustomValidationTooltip(tooltip);
        
        if (value === '') {
            return;
        }
        
        // 延迟验证
        validationTimeout = setTimeout(() => {
            if (validationFn(value)) {
                this.classList.add('valid');
                hideCustomValidationTooltip(tooltip);
            } else {
                this.classList.add('invalid');
            }
        }, 500);
    });
    
    // 失去焦点时立即验证
    input.addEventListener('blur', function() {
        const value = this.value.trim();
        
        if (validationTimeout) {
            clearTimeout(validationTimeout);
        }
        
        this.classList.remove('valid', 'invalid');
        hideCustomValidationTooltip(tooltip);
        
        if (value === '') {
            return;
        }
        
        if (validationFn(value)) {
            this.classList.add('valid');
            hideCustomValidationTooltip(tooltip);
        } else {
            this.classList.add('invalid');
        }
    });
    
    // 获得焦点时隐藏提示
    input.addEventListener('focus', function() {
        hideCustomValidationTooltip(tooltip);
    });
}