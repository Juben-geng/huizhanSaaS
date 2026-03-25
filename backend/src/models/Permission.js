module.exports = (sequelize, DataTypes) => {
  const Permission = sequelize.define('Permission', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    permissionKey: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false,
      comment: '权限唯一标识'
    },
    permissionName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '权限名称'
    },
    permissionGroup: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '权限分组'
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '权限描述'
    }
  }, {
    tableName: 'permissions',
    timestamps: true
  });

  return Permission;
};
