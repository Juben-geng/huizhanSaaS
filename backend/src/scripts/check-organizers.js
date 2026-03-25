const db = require('../models');

async function checkOrganizers() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established');

    const organizers = await db.Organizer.findAll({
      attributes: ['id', 'organizerId', 'organizerName', 'username', 'password', 'status'],
      order: [['id', 'ASC']],
      limit: 10
    });

    console.log('\n=== Organizers in Database ===');
    organizers.forEach(o => {
      console.log(`ID: ${o.id}, Name: ${o.organizerName}, Username: ${o.username}, HasPassword: ${!!o.password}, Status: ${o.status}`);
    });

    const zbfOrganizer = await db.Organizer.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { organizerName: { [db.Sequelize.Op.like]: '%zbf%' } },
          { username: { [db.Sequelize.Op.like]: '%zbf%' } }
        ]
      }
    });

    if (zbfOrganizer) {
      console.log('\n=== Found zbf organizer ===');
      console.log(`ID: ${zbfOrganizer.id}`);
      console.log(`Name: ${zbfOrganizer.organizerName}`);
      console.log(`Username: ${zbfOrganizer.username}`);
      console.log(`Has Password: ${!!zbfOrganizer.password}`);
      console.log(`Status: ${zbfOrganizer.status}`);
    } else {
      console.log('\n=== No zbf organizer found ===');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkOrganizers();
