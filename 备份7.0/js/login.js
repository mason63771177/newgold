/**
 * 登录页面JavaScript逻辑
 * 包含表单切换、表单验证、密码强度检测等功能
 */

// 全局变量
let currentForm = 'login';

/**
 * 页面初始化函数
 * 在DOM加载完成后执行所有初始化操作
 */
document.addEventListener('DOMContentLoaded', function() {
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
 * 切换表单显示
 * @param {string} formType - 表单类型 ('login' 或 'register')
 */
function switchForm(formType) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    // 更新标签按钮状态
    tabButtons.forEach(button => {
        const buttonForm = button.getAttribute('data-form');
        if (buttonForm === formType) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // 切换表单显示
    if (formType === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        currentForm = 'login';
    } else {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
        currentForm = 'register';
    }
}

/**
 * 表单验证功能设置
 * 为登录和注册表单添加提交事件监听器
 */
function setupFormValidation() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // 登录表单验证
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
        
        // 添加实时邮箱验证
        const loginEmailInput = document.getElementById('loginEmail');
        if (loginEmailInput) {
            setupEmailValidation(loginEmailInput);
            setupDynamicInputState(loginEmailInput, isValidEmail);
        }
    }
    
    // 注册表单验证
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleRegister();
        });
        
        // 添加实时邮箱验证
        const registerEmailInput = document.getElementById('registerEmail');
        if (registerEmailInput) {
            setupEmailValidation(registerEmailInput);
            setupDynamicInputState(registerEmailInput, isValidEmail);
        }
    }
    
    // 密码验证
    const loginPasswordInput = document.getElementById('loginPassword');
    const registerPasswordInput = document.getElementById('registerPassword');
    
    if (loginPasswordInput) {
        setupDynamicInputState(loginPasswordInput, (password) => password.length >= 6);
    }
    
    if (registerPasswordInput) {
        setupDynamicInputState(registerPasswordInput, (password) => password.length >= 6);
    }
    
    // 邀请码验证（注册页面）
    const inviteCodeInput = document.getElementById('inviteCode');
    if (inviteCodeInput) {
        setupDynamicInputState(inviteCodeInput, (code) => code.length > 0);
    }
}

/**
 * 设置邮箱输入框的实时验证
 * @param {HTMLElement} emailInput - 邮箱输入框元素
 */
function setupEmailValidation(emailInput) {
    // 禁用原生HTML5验证
    emailInput.setAttribute('novalidate', 'true');
    
    // 创建自定义验证提示元素
    const customTooltip = document.createElement('div');
    customTooltip.className = 'custom-validation-tooltip';
    customTooltip.style.display = 'none';
    
    // 将提示元素插入到输入框后面
    emailInput.parentNode.insertBefore(customTooltip, emailInput.nextSibling);
    
    // 标记用户是否已经开始交互
    let hasUserInteracted = false;
    
    // 监听输入事件
    emailInput.addEventListener('input', function() {
        hasUserInteracted = true;
        const email = this.value.trim();
        
        // 清除原生验证消息
        this.setCustomValidity('');
        
        // 只有在用户开始交互后才显示验证提示
        if (hasUserInteracted) {
            if (email && !isValidEmail(email)) {
                // 检查是否包含@符号
                if (!email.includes('@')) {
                    showCustomValidationTooltip(customTooltip, '请在电子邮件地址中包括"@"符号', 'error');
                } else {
                    showCustomValidationTooltip(customTooltip, '请输入有效的邮箱地址', 'warning');
                }
            } else if (email && isValidEmail(email)) {
                showCustomValidationTooltip(customTooltip, '邮箱格式正确', 'success');
                setTimeout(() => {
                    hideCustomValidationTooltip(customTooltip);
                }, 1500);
            } else {
                hideCustomValidationTooltip(customTooltip);
            }
        }
    });
    
    // 监听失焦事件
    emailInput.addEventListener('blur', function() {
        hasUserInteracted = true;
        const email = this.value.trim();
        
        // 只有在用户开始交互后才显示验证提示
        if (hasUserInteracted && email && !isValidEmail(email)) {
            if (!email.includes('@')) {
                showCustomValidationTooltip(customTooltip, '请在电子邮件地址中包括"@"符号', 'error');
            } else {
                showCustomValidationTooltip(customTooltip, '请输入有效的邮箱地址', 'error');
            }
        }
    });
    
    // 监听获焦事件
    emailInput.addEventListener('focus', function() {
        // 只在没有错误时隐藏提示
        if (!customTooltip.classList.contains('error')) {
            hideCustomValidationTooltip(customTooltip);
        }
    });
    
    // 阻止原生验证提示
    emailInput.addEventListener('invalid', function(e) {
        e.preventDefault();
        return false;
    });
}

/**
 * 显示自定义验证提示
 * @param {HTMLElement} tooltip - 提示框元素
 * @param {string} message - 提示消息
 * @param {string} type - 提示类型 ('error', 'warning', 'success', 'info')
 */
function showCustomValidationTooltip(tooltip, message, type = 'error') {
    tooltip.textContent = message;
    tooltip.className = `custom-validation-tooltip ${type} show animate-in`;
    tooltip.style.display = 'block';
}

/**
 * 隐藏自定义验证提示
 * @param {HTMLElement} tooltip - 提示框元素
 */
function hideCustomValidationTooltip(tooltip) {
    tooltip.classList.add('animate-out');
    setTimeout(() => {
        tooltip.style.display = 'none';
        tooltip.className = 'custom-validation-tooltip';
    }, 200);
}

/**
 * 处理登录表单提交
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
        // 调用后端API
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // 登录成功
            hideLoadingState(submitBtn, '开始挑战');
            showMessage('登录成功！', 'success');
            
            // 保存用户信息到localStorage
            localStorage.setItem('userEmail', data.data.user.email);
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('userId', data.data.user.id);
            localStorage.setItem('currentUser', JSON.stringify(data.data.user));
            
            // 跳转到钱包页面
            setTimeout(() => {
                window.location.href = 'wallet.html';
            }, 1000);
            
        } else {
            // 登录失败
            hideLoadingState(submitBtn, '开始挑战');
            showMessage(data.message || '登录失败，请检查邮箱和密码', 'error');
        }
        
    } catch (error) {
        console.error('登录请求失败:', error);
        hideLoadingState(submitBtn, '开始挑战');
        showMessage('网络连接失败，请检查后端服务是否启动', 'error');
    }
}

/**
 * 处理注册表单提交
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
        // 调用后端API
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password,
                inviteCode: inviteCode
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // 注册成功
            hideLoadingState(submitBtn, '加入挑战');
            showMessage('注册成功！请查收验证邮件', 'success');
            
            // 保存用户信息到localStorage
            localStorage.setItem('userEmail', data.data.user.email);
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('userId', data.data.user.id);
            localStorage.setItem('currentUser', JSON.stringify(data.data.user));
            
            // 跳转到主页面
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
        } else {
            // 注册失败
            hideLoadingState(submitBtn, '加入挑战');
            showMessage(data.message || '注册失败，请检查输入信息', 'error');
        }
        
    } catch (error) {
        console.error('注册请求失败:', error);
        hideLoadingState(submitBtn, '加入挑战');
        showMessage('网络连接失败，请检查后端服务是否启动', 'error');
    }
}

/**
 * 验证登录表单
 * @param {string} email - 邮箱地址
 * @param {string} password - 密码
 * @returns {boolean} 验证是否通过
 */
function validateLoginForm(email, password) {
    if (!email) {
        showMessage('请输入邮箱地址', 'error');
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
 * @param {string} email - 邮箱地址
 * @param {string} password - 密码
 * @param {string} inviteCode - 邀请码
 * @returns {boolean} 验证是否通过
 */
function validateRegisterForm(email, password, inviteCode) {
    if (!email) {
        showMessage('请输入邮箱地址', 'error');
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
    
    return true;
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 邮箱格式是否有效
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * 密码强度检测功能设置
 */
function setupPasswordStrength() {
    const passwordInput = document.getElementById('registerPassword');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            updatePasswordStrength(password);
        });
        
        // 显示密码强度指示器
        passwordInput.addEventListener('focus', function() {
            const strengthIndicator = document.querySelector('.password-strength');
            if (strengthIndicator) {
                strengthIndicator.style.display = 'block';
            }
        });
    }
}

/**
 * 更新密码强度显示
 * @param {string} password - 密码
 */
function updatePasswordStrength(password) {
    const strengthFill = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');
    
    if (!strengthFill || !strengthText) return;
    
    const strength = calculatePasswordStrength(password);
    
    // 移除所有强度类
    strengthFill.classList.remove('weak', 'medium', 'strong');
    
    // 根据强度设置样式和文本
    switch (strength.level) {
        case 'weak':
            strengthFill.classList.add('weak');
            strengthText.textContent = '弱';
            strengthText.style.color = '#ff4757';
            break;
        case 'medium':
            strengthFill.classList.add('medium');
            strengthText.textContent = '中等';
            strengthText.style.color = '#ffa502';
            break;
        case 'strong':
            strengthFill.classList.add('strong');
            strengthText.textContent = '强';
            strengthText.style.color = '#2ed573';
            break;
        default:
            strengthText.textContent = '';
    }
}

/**
 * 计算密码强度
 * @param {string} password - 密码
 * @returns {Object} 包含强度级别和分数的对象
 */
function calculatePasswordStrength(password) {
    if (!password) {
        return { level: 'none', score: 0 };
    }
    
    let score = 0;
    
    // 长度检查
    if (password.length >= 8) score += 2;
    else if (password.length >= 6) score += 1;
    
    // 包含小写字母
    if (/[a-z]/.test(password)) score += 1;
    
    // 包含大写字母
    if (/[A-Z]/.test(password)) score += 1;
    
    // 包含数字
    if (/\d/.test(password)) score += 1;
    
    // 包含特殊字符
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    
    // 根据分数确定强度级别
    if (score <= 2) {
        return { level: 'weak', score };
    } else if (score <= 4) {
        return { level: 'medium', score };
    } else {
        return { level: 'strong', score };
    }
}

/**
 * 显示按钮加载状态
 * @param {HTMLElement} button - 按钮元素
 * @param {string} text - 加载时显示的文本
 */
function showLoadingState(button, text) {
    button.classList.add('loading');
    button.disabled = true;
    button.textContent = text;
}

/**
 * 隐藏按钮加载状态
 * @param {HTMLElement} button - 按钮元素
 * @param {string} text - 恢复后显示的文本
 */
function hideLoadingState(button, text) {
    button.classList.remove('loading');
    button.disabled = false;
    button.textContent = text;
}

/**
 * 显示消息提示
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 ('success', 'error', 'info')
 */
function showMessage(message, type = 'info') {
    // 创建消息元素
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    
    // 设置样式
    Object.assign(messageEl.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        zIndex: '10000',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        maxWidth: '300px',
        wordWrap: 'break-word'
    });
    
    // 根据类型设置背景色
    switch (type) {
        case 'success':
            messageEl.style.background = 'linear-gradient(45deg, #2ed573, #1dd1a1)';
            break;
        case 'error':
            messageEl.style.background = 'linear-gradient(45deg, #ff4757, #ff3742)';
            break;
        default:
            messageEl.style.background = 'linear-gradient(45deg, #2193b0, #6dd5ed)';
    }
    
    // 添加到页面
    document.body.appendChild(messageEl);
    
    // 显示动画
    setTimeout(() => {
        messageEl.style.transform = 'translateX(0)';
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
        messageEl.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 300);
    }, 3000);
}

/**
 * 设置键盘事件处理
 */
function setupKeyboardEvents() {
    document.addEventListener('keydown', function(event) {
        // Enter键提交表单
        if (event.key === 'Enter' && !event.shiftKey) {
            const activeForm = document.querySelector('.form-section:not(.hidden)');
            if (activeForm) {
                const submitBtn = activeForm.querySelector('.submit-btn');
                if (submitBtn && !submitBtn.disabled) {
                    submitBtn.click();
                }
            }
        }
        
        // Escape键清除焦点
        if (event.key === 'Escape') {
            document.activeElement.blur();
        }
    });
}

/**
 * 设置页面可见性变化监听
 */
function setupVisibilityListener() {
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            console.log('页面隐藏，暂停动画');
        } else {
            console.log('页面显示，恢复动画');
        }
    });
}

// 兼容原有的函数名（保持向后兼容）
function showLogin() {
    switchForm('login');
}

function showRegister() {
    switchForm('register');
}

function checkPasswordStrength(password) {
    updatePasswordStrength(password);
}

/**
 * 动态管理输入框状态
 * @param {HTMLElement} input - 输入框元素
 * @param {Function} validationFn - 验证函数
 */
function setupDynamicInputState(input, validationFn) {
    if (!input) return;
    
    const formGroup = input.closest('.form-group');
    if (!formGroup) return;
    
    // 输入时设置为黄色（输入状态）
    input.addEventListener('input', function() {
        const value = this.value.trim();
        
        // 清除所有状态类
        formGroup.classList.remove('error', 'success', 'typing');
        
        if (value) {
            // 有内容时先设置为输入状态（黄色）
            formGroup.classList.add('typing');
            
            // 延迟验证，避免输入过程中频繁切换状态
            clearTimeout(this.validationTimeout);
            this.validationTimeout = setTimeout(() => {
                const isValid = validationFn(value);
                formGroup.classList.remove('typing');
                
                if (isValid) {
                    formGroup.classList.add('success');
                } else {
                    formGroup.classList.add('error');
                }
            }, 500); // 500ms延迟验证
        }
        // 空值时不添加任何类，保持透明状态
    });
    
    // 失焦时立即验证
    input.addEventListener('blur', function() {
        const value = this.value.trim();
        
        // 清除延迟验证
        clearTimeout(this.validationTimeout);
        
        // 清除所有状态类
        formGroup.classList.remove('error', 'success', 'typing');
        
        if (value) {
            const isValid = validationFn(value);
            if (isValid) {
                formGroup.classList.add('success');
            } else {
                formGroup.classList.add('error');
            }
        }
        // 空值时不添加任何类，保持透明状态
    });
    
    // 聚焦时如果有内容且不在验证状态，设置为输入状态
    input.addEventListener('focus', function() {
        const value = this.value.trim();
        if (value && !formGroup.classList.contains('error') && !formGroup.classList.contains('success')) {
            formGroup.classList.remove('typing');
            formGroup.classList.add('typing');
        }
    });
}