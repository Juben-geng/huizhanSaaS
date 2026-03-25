const bcrypt = require('bcryptjs');

async function initTeacherAccount(db) {
  try {
    const existingTeacher = await db.Teacher.findOne({
      where: { username: 'teacher' }
    });

    if (existingTeacher) {
      console.log('✅ Teacher账户已存在，跳过创建');
      return existingTeacher;
    }

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
    console.log('用户名: teacher');
    console.log('密码: teacher123456');
    
    return teacher;
  } catch (error) {
    console.error('❌ 创建Teacher账户失败:', error.message);
    throw error;
  }
}

module.exports = initTeacherAccount;
