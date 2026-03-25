module.exports = (sequelize, DataTypes) => {
  const RolePermission = sequelize.define('RolePermission', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '角色ID'
    },
    permissionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '权限ID'
    }
  }, {
    tableName: 'role_permissions',
    timestamps: true,
    indexes: [
      { fields: ['roleId'] },
      { fields: ['permissionId'] },
      { unique: true, fields: ['roleId', 'permissionId'] }
    ]
  });

  return RolePermission;
};
