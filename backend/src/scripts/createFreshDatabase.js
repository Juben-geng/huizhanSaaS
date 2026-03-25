const db = require('../models');
const fs = require('fs');
const path = require('path');

async function createFreshDatabase() {
  try {
    const dbPath = path.join(__dirname, '../../database/exhibition_saas.sqlite');
    
    if (fs.existsSync(dbPath)) {
      console.log('Database file exists, backing up...');
      const backupPath = dbPath + '.backup';
      fs.copyFileSync(dbPath, backupPath);
      fs.unlinkSync(dbPath);
      console.log('Database file removed.');
    }

    await db.sequelize.authenticate();
    console.log('Database connection established successfully.');

    console.log('Creating database schema...');
    await db.sequelize.sync({ force: true });
    console.log('Database schema created successfully!');

    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');

    const teacherId = uuidv4();
    const password = await bcrypt.hash('teacher123456', 10);

    const teacher = await db.Teacher.create({
      teacherId,
      teacherName: '测试教师',
      username: 'teacher',
      password,
      phone: '13800138001',
      email: 'teacher@example.com',
      status: 1
    });

    console.log('Teacher account created successfully!');
    console.log('Username: teacher');
    console.log('Password: teacher123456');
    console.log('Teacher ID:', teacher.teacherId);

    await db.sequelize.close();
    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error creating database:', error);
    process.exit(1);
  }
}

createFreshDatabase();
