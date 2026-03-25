const db = require('./backend/src/models');

async function checkTeacher() {
  try {
    const teacher = await db.Teacher.findOne({
      where: { username: 'teacher' }
    });

    if (!teacher) {
      console.log('❌ Teacher账户不存在');
      process.exit(1);
    }

    console.log('✅ Teacher账户信息:');
    console.log('ID:', teacher.id);
    console.log('TeacherID:', teacher.teacherId);
    console.log('教师姓名:', teacher.teacherName);
    console.log('用户名:', teacher.username);
    console.log('密码哈希:', teacher.password);
    console.log('状态:', teacher.status);
    console.log('上次登录:', teacher.lastLoginAt);

    const bcrypt = require('bcryptjs');
    const isValid = await bcrypt.compare('teacher123456', teacher.password);
    console.log('\n密码验证 (teacher123456):', isValid ? '✅ 正确' : '❌ 错误');

    process.exit(0);
  } catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
  }
}

checkTeacher();
