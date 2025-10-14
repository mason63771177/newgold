const bcrypt = require('bcryptjs');

(async () => {
  try {
    // 测试两个密码
    const testPasswords = ['TestPass123!@#$%', 'Test123456!'];
    const hashedPassword = '$2a$12$f6.ntbLa8XRLVKPVDeisTeUiVhwXvWHYv5FoHTPrB4wfGCTEQ9KNS';
    
    for (const password of testPasswords) {
      const isMatch = await bcrypt.compare(password, hashedPassword);
      console.log(`密码 '${password}' 匹配结果: ${isMatch}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('密码验证失败:', error);
    process.exit(1);
  }
})();