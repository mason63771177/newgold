const bcryptjs = require('bcryptjs');

async function testBcryptCompatibility() {
    const password = 'testpass123';
    
    // 使用bcrypt生成的哈希值
    const bcryptHash = '$2b$12$00vsGvehZh7lBKvNIj7Vnuh2wjub.QOkFTptyA1jxDxeBsy84wp2W';
    
    // 使用bcryptjs生成的哈希值
    const bcryptjsHash = await bcryptjs.hash(password, 12);
    
    console.log('测试密码:', password);
    console.log('bcrypt哈希值:', bcryptHash);
    console.log('bcryptjs哈希值:', bcryptjsHash);
    
    // 测试bcryptjs是否能验证bcrypt生成的哈希值
    const canVerifyBcrypt = await bcryptjs.compare(password, bcryptHash);
    console.log('bcryptjs能否验证bcrypt哈希值:', canVerifyBcrypt);
    
    // 测试bcryptjs验证自己生成的哈希值
    const canVerifyBcryptjs = await bcryptjs.compare(password, bcryptjsHash);
    console.log('bcryptjs能否验证自己的哈希值:', canVerifyBcryptjs);
    
    // 生成一个新的bcryptjs哈希值用于数据库更新
    const newHash = await bcryptjs.hash(password, 12);
    console.log('新的bcryptjs哈希值:', newHash);
}

testBcryptCompatibility().catch(console.error);