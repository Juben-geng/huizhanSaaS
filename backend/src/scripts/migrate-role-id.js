const db = require('../models');

async function migrateRoleId() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established');

    const queryInterface = db.sequelize.getQueryInterface();

    console.log('Adding roleId column to organizers...');
    try {
      await queryInterface.addColumn('organizers', 'roleId', {
        type: db.Sequelize.INTEGER,
        allowNull: true,
        after: 'lastLoginAt'
      });
      console.log('roleId column added successfully');
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('roleId column already exists');
      } else {
        throw error;
      }
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateRoleId();
