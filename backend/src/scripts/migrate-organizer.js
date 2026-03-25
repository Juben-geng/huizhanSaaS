const db = require('../models');

async function migrateOrganizer() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established');

    const queryInterface = db.sequelize.getQueryInterface();

    console.log('Adding username column...');
    try {
      await queryInterface.addColumn('organizers', 'username', {
        type: db.Sequelize.STRING(50),
        allowNull: true,
        after: 'organizerName'
      });
      console.log('Username column added successfully');
      
      try {
        await queryInterface.addIndex('organizers', ['username'], {
          unique: true,
          name: 'organizers_username_unique'
        });
        console.log('Username unique index created');
      } catch (indexError) {
        console.log('Username index already exists or could not be created');
      }
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('Username column already exists');
      } else {
        throw error;
      }
    }

    console.log('Adding password column...');
    try {
      await queryInterface.addColumn('organizers', 'password', {
        type: db.Sequelize.STRING(255),
        allowNull: true,
        after: 'username'
      });
      console.log('Password column added successfully');
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('Password column already exists');
      } else {
        throw error;
      }
    }

    console.log('Adding address column...');
    try {
      await queryInterface.addColumn('organizers', 'address', {
        type: db.Sequelize.STRING(200),
        allowNull: true,
        after: 'packageExpireTime'
      });
      console.log('Address column added successfully');
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('Address column already exists');
      } else {
        throw error;
      }
    }

    console.log('Adding lastLoginAt column...');
    try {
      await queryInterface.addColumn('organizers', 'lastLoginAt', {
        type: db.Sequelize.DATE,
        allowNull: true,
        after: 'status'
      });
      console.log('lastLoginAt column added successfully');
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('lastLoginAt column already exists');
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

migrateOrganizer();
