const db = require('../models');

async function initPermissions() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established');

    await db.sequelize.sync();

    const permissions = [
      { permissionKey: 'dashboard:view', permissionName: '查看仪表盘', permissionGroup: '仪表盘', description: '查看仪表盘数据' },
      { permissionKey: 'organizer:view', permissionName: '查看主办方', permissionGroup: '主办方管理', description: '查看主办方列表' },
      { permissionKey: 'organizer:create', permissionName: '创建主办方', permissionGroup: '主办方管理', description: '创建新的主办方' },
      { permissionKey: 'organizer:edit', permissionName: '编辑主办方', permissionGroup: '主办方管理', description: '编辑主办方信息' },
      { permissionKey: 'organizer:delete', permissionName: '删除主办方', permissionGroup: '主办方管理', description: '删除主办方' },
      { permissionKey: 'exhibition:view', permissionName: '查看展会', permissionGroup: '展会管理', description: '查看展会列表' },
      { permissionKey: 'exhibition:create', permissionName: '创建展会', permissionGroup: '展会管理', description: '创建新的展会' },
      { permissionKey: 'exhibition:edit', permissionName: '编辑展会', permissionGroup: '展会管理', description: '编辑展会信息' },
      { permissionKey: 'exhibition:delete', permissionName: '删除展会', permissionGroup: '展会管理', description: '删除展会' },
      { permissionKey: 'merchant:view', permissionName: '查看商家', permissionGroup: '商家管理', description: '查看商家列表' },
      { permissionKey: 'merchant:create', permissionName: '创建商家', permissionGroup: '商家管理', description: '创建新的商家' },
      { permissionKey: 'merchant:edit', permissionName: '编辑商家', permissionGroup: '商家管理', description: '编辑商家信息' },
      { permissionKey: 'merchant:delete', permissionName: '删除商家', permissionGroup: '商家管理', description: '删除商家' },
      { permissionKey: 'user:view', permissionName: '查看用户', permissionGroup: '用户管理', description: '查看用户列表' },
      { permissionKey: 'user:create', permissionName: '创建用户', permissionGroup: '用户管理', description: '创建新的用户' },
      { permissionKey: 'user:edit', permissionName: '编辑用户', permissionGroup: '用户管理', description: '编辑用户信息' },
      { permissionKey: 'user:delete', permissionName: '删除用户', permissionGroup: '用户管理', description: '删除用户' },
      { permissionKey: 'package:view', permissionName: '查看套餐', permissionGroup: '套餐管理', description: '查看套餐列表' },
      { permissionKey: 'package:create', permissionName: '创建套餐', permissionGroup: '套餐管理', description: '创建新的套餐' },
      { permissionKey: 'package:edit', permissionName: '编辑套餐', permissionGroup: '套餐管理', description: '编辑套餐信息' },
      { permissionKey: 'package:delete', permissionName: '删除套餐', permissionGroup: '套餐管理', description: '删除套餐' },
      { permissionKey: 'finance:view', permissionName: '查看财务', permissionGroup: '财务管理', description: '查看财务数据' },
      { permissionKey: 'finance:export', permissionName: '导出财务', permissionGroup: '财务管理', description: '导出财务报表' },
      { permissionKey: 'log:view', permissionName: '查看日志', permissionGroup: '系统管理', description: '查看系统日志' },
      { permissionKey: 'log:export', permissionName: '导出日志', permissionGroup: '系统管理', description: '导出系统日志' },
      { permissionKey: 'settings:view', permissionName: '查看设置', permissionGroup: '系统管理', description: '查看系统设置' },
      { permissionKey: 'settings:edit', permissionName: '编辑设置', permissionGroup: '系统管理', description: '编辑系统设置' },
      { permissionKey: 'role:view', permissionName: '查看角色', permissionGroup: '角色权限', description: '查看角色列表' },
      { permissionKey: 'role:create', permissionName: '创建角色', permissionGroup: '角色权限', description: '创建新的角色' },
      { permissionKey: 'role:edit', permissionName: '编辑角色', permissionGroup: '角色权限', description: '编辑角色信息' },
      { permissionKey: 'role:delete', permissionName: '删除角色', permissionGroup: '角色权限', description: '删除角色' },
      { permissionKey: 'permission:view', permissionName: '查看权限', permissionGroup: '角色权限', description: '查看权限列表' },
      { permissionKey: 'miniprogram:config', permissionName: '配置小程序', permissionGroup: '小程序管理', description: '配置小程序信息' },
      { permissionKey: 'miniprogram:publish', permissionName: '发布小程序', permissionGroup: '小程序管理', description: '发布小程序版本' },
      { permissionKey: 'miniprogram:rollback', permissionName: '回滚小程序', permissionGroup: '小程序管理', description: '回滚小程序版本' }
    ];

    console.log('Creating permissions...');
    for (const perm of permissions) {
      await db.Permission.findOrCreate({
        where: { permissionKey: perm.permissionKey },
        defaults: perm
      });
    }
    console.log('Permissions created successfully');

    const roles = [
      { roleKey: 'super_admin', roleName: '超级管理员', description: '拥有所有权限' },
      { roleKey: 'admin', roleName: '管理员', description: '拥有大部分管理权限' },
      { roleKey: 'organizer', roleName: '主办方', description: '主办方角色' },
      { roleKey: 'operator', roleName: '运营人员', description: '运营人员角色' }
    ];

    console.log('Creating roles...');
    for (const role of roles) {
      await db.Role.findOrCreate({
        where: { roleKey: role.roleKey },
        defaults: role
      });
    }
    console.log('Roles created successfully');

    const allPermissions = await db.Permission.findAll();
    const superAdminRole = await db.Role.findOne({ where: { roleKey: 'super_admin' } });
    
    if (superAdminRole && allPermissions.length > 0) {
      console.log('Assigning all permissions to super_admin...');
      await superAdminRole.setPermissions(allPermissions);
      console.log('Permissions assigned successfully');
    }

    console.log('\n=== Permissions and Roles initialized successfully ===');
    process.exit(0);
  } catch (error) {
    console.error('Init permissions failed:', error);
    process.exit(1);
  }
}

initPermissions();
