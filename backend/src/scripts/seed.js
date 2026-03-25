const bcrypt = require('bcryptjs');
const db = require('../models');

async function seed() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established');

    const hashedPassword = await bcrypt.hash('admin123456', 10);
    
    const [admin] = await db.User.findOrCreate({
      where: { userId: 'admin-001' },
      defaults: {
        userId: 'admin-001',
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        status: 'active'
      }
    });

    if (admin.isNewRecord) {
      console.log('Default admin user created');
    } else {
      console.log('Default admin user already exists');
    }

    console.log('Seed completed');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
