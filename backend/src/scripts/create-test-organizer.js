const bcrypt = require('bcryptjs');
const db = require('../models');

async function createTestOrganizer() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established');

    const hashedPassword = await bcrypt.hash('zbf123456', 10);
    
    const organizer = await db.Organizer.create({
      organizerId: `ORG-${Date.now()}`,
      organizerName: '测试主办方zbf01',
      username: 'zbf01',
      password: hashedPassword,
      contactPerson: '张三',
      contactPhone: '13800138000',
      contactEmail: 'zbf01@example.com',
      packageType: 'professional',
      packageExpireTime: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      address: '北京市朝阳区',
      status: 1
    });

    console.log('\n=== Test organizer created successfully ===');
    console.log(`ID: ${organizer.id}`);
    console.log(`Name: ${organizer.organizerName}`);
    console.log(`Username: ${organizer.username}`);
    console.log(`Password: zbf123456`);
    console.log(`Status: ${organizer.status}`);
    console.log(`Package: ${organizer.packageType}`);

    process.exit(0);
  } catch (error) {
    console.error('Create test organizer failed:', error);
    process.exit(1);
  }
}

createTestOrganizer();
