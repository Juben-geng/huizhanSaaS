const db = require('../models');

async function syncTeacher() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established successfully.');

    console.log('Syncing Teacher table...');
    await db.Teacher.sync({ force: false });
    console.log('Teacher table synced successfully!');

    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');

    const teacherId = uuidv4();
    const password = await bcrypt.hash('teacher123456', 10);

    const [teacher, created] = await db.Teacher.findOrCreate({
      where: { username: 'teacher' },
      defaults: {
        teacherId,
        teacherName: '测试教师',
        username: 'teacher',
        password,
        phone: '13800138001',
        email: 'teacher@example.com',
        status: 1
      }
    });

    if (created) {
      console.log('Teacher account created successfully!');
      console.log('Username: teacher');
      console.log('Password: teacher123456');
    } else {
      console.log('Teacher account already exists.');
      console.log('Username: teacher');
      console.log('Password: teacher123456 (or previously set password)');
    }

    await db.sequelize.close();
  } catch (error) {
    console.error('Error syncing teacher table:', error);
    process.exit(1);
  }
}

syncTeacher();
