const db = require('../models');

async function assignTeacherPermissions() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established');

    const teacher = await db.Teacher.findOne({ where: { username: 'teacher' } });

    if (!teacher) {
      console.error('Teacher account not found');
      process.exit(1);
    }

    console.log(`Found teacher: ${teacher.username}`);

    let teacherRole = await db.Role.findOne({ where: { roleKey: 'teacher' } });

    if (!teacherRole) {
      console.log('Teacher role not found, creating...');
      teacherRole = await db.Role.create({
        roleKey: 'teacher',
        roleName: '教师',
        description: '教师角色',
        status: 'active'
      });
      console.log(`Created teacher role: ${teacherRole.roleName}`);
    }

    await teacher.update({ roleId: teacherRole.id });
    console.log(`Assigned role '${teacherRole.roleName}' to teacher '${teacher.username}'`);

    const teacherPermissions = await db.Permission.findAll({
      where: {
        permissionKey: {
          [db.Sequelize.Op.or]: [
            'dashboard:view',
            'exhibition:view',
            'merchant:view',
            'user:view'
          ]
        }
      }
    });

    console.log(`Found ${teacherPermissions.length} permissions to assign`);

    if (teacherPermissions.length > 0) {
      await teacherRole.setPermissions(teacherPermissions);
      console.log(`Assigned ${teacherPermissions.length} permissions to teacher role`);
      console.log('Permissions:', teacherPermissions.map(p => p.permissionName).join(', '));
    }

    console.log('\n=== Teacher permissions assignment completed successfully ===');
    process.exit(0);
  } catch (error) {
    console.error('Teacher permissions assignment failed:', error);
    process.exit(1);
  }
}

assignTeacherPermissions();