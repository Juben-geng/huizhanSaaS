const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database', 'exhibition_saas.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('检查teachers表...\n');

db.serialize(() => {
  db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='teachers'", (err, rows) => {
    if (err) {
      console.error('错误:', err);
      db.close();
      return;
    }

    if (rows.length === 0) {
      console.log('❌ teachers表不存在!');
      db.close();
      return;
    }

    console.log('✅ teachers表存在!\n');

    db.all("SELECT * FROM teachers", (err, rows) => {
      if (err) {
        console.error('错误:', err);
      } else {
        console.log(`找到 ${rows.length} 条教师记录:\n`);
        rows.forEach(row => {
          console.log('ID:', row.id);
          console.log('TeacherID:', row.teacherId);
          console.log('教师姓名:', row.teacherName);
          console.log('用户名:', row.username);
          console.log('密码:', row.password);
          console.log('状态:', row.status);
          console.log('─────────────────');
        });
      }
      db.close();
    });
  });
});
