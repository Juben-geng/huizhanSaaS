const db = require('./src/models');
const bcrypt = require('bcryptjs');

async function createTeacherAccount() {
  try {
    console.log('开始创建teacher账户...\n');

    const password = 'teacher123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    const teacher = await db.Teacher.create({
      teacherId: 'T' + Date.now(),
      teacherName: '测试教师',
      username: 'teacher',
      password: hashedPassword,
      status: 1
    });

    console.log('✅ Teacher账户创建成功!');
    console.log('ID:', teacher.id);
    console.log('TeacherID:', teacher.teacherId);
    console.log('教师姓名:', teacher.teacherName);
    console.log('用户名:', teacher.username);
    console.log('密码:', password);
    console.log('状态:', teacher.status);
    console.log('\n现在可以使用以下凭证登录:');
    console.log('用户名: teacher');
    console.log('密码: teacher123456');

    process.exit(0);
  } catch (error) {
    console.error('❌ 创建失败:', error.message);
    process.exit(1);
  }
}

createTeacherAccount();
