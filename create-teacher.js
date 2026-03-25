const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database', 'exhibition_saas.sqlite');
const db = new sqlite3.Database(dbPath);

async function createTeacher() {
  console.log('开始创建teacher账户...\n');

  const password = 'teacher123456';
  const hashedPassword = await bcrypt.hash(password, 10);

  const teacherId = 'T' + Date.now();
  const username = 'teacher';
  const teacherName = '测试教师';

  const sql = `
    INSERT INTO teachers (teacherId, teacherName, username, password, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))
  `;

  db.run(sql, [teacherId, teacherName, username, hashedPassword], function(err) {
    if (err) {
      console.error('❌ 创建失败:', err.message);
      db.close();
      return;
    }

    console.log('✅ Teacher账户创建成功!');
    console.log('ID:', this.lastID);
    console.log('TeacherID:', teacherId);
    console.log('教师姓名:', teacherName);
    console.log('用户名:', username);
    console.log('密码:', password);
    console.log('状态: 正常');
    console.log('\n现在可以使用以下凭证登录:');
    console.log('用户名: teacher');
    console.log('密码: teacher123456');
    
    db.close();
  });
}

createTeacher();
