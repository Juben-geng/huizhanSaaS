const db = require('../models');

async function syncDatabase() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established successfully.');

    console.log('Syncing database...');
    await db.sequelize.sync({ alter: true });
    console.log('Database synced successfully!');

    await db.sequelize.close();
  } catch (error) {
    console.error('Error syncing database:', error);
    process.exit(1);
  }
}

syncDatabase();
