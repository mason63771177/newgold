const bcrypt = require('bcrypt');

async function testPassword() {
    const password = 'testpass123';
    const hash = '$2a$12$/NdWdAchLoizQEkzS0enV.wSxV/JxFJI8gikJAHpfOtz3HpE7OBxG';
    
    const isMatch = await bcrypt.compare(password, hash);
    console.log(`密码 "${password}" 与哈希值匹配: ${isMatch}`);
    
    // 生成新的哈希值
    const newHash = await bcrypt.hash(password, 12);
    console.log(`新的哈希值: ${newHash}`);
}

testPassword().catch(console.error);