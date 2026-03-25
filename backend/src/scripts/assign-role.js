const db = require('../models');

async function assignRole() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established');

    const organizer = await db.Organizer.findOne({ where: { username: 'zbf01' } });
    const organizerRole = await db.Role.findOne({ where: { roleKey: 'organizer' } });

    if (organizer && organizerRole) {
      await organizer.update({ roleId: organizerRole.id });
      console.log(`Assigned role '${organizerRole.roleName}' to organizer '${organizer.username}'`);
    } else {
      console.log('Organizer or role not found');
    }

    const organizerPermissions = await db.Permission.findAll({
      where: {
        permissionKey: {
          [db.Sequelize.Op.or]: [
            'dashboard:view',
            'exhibition:view',
            'exhibition:create',
            'exhibition:edit',
            'merchant:view',
            'merchant:create',
            'merchant:edit',
            'user:view',
            'user:create',
            'user:edit',
            'finance:view'
          ]
        }
      }
    });

    if (organizerRole && organizerPermissions.length > 0) {
      await organizerRole.setPermissions(organizerPermissions);
      console.log(`Assigned ${organizerPermissions.length} permissions to organizer role`);
    }

    console.log('\n=== Role assignment completed successfully ===');
    process.exit(0);
  } catch (error) {
    console.error('Role assignment failed:', error);
    process.exit(1);
  }
}

assignRole();
