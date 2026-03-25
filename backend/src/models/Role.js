module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    roleKey: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
      comment: '角色唯一标识'
    },
    roleName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '角色名称'
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '角色描述'
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '状态：1-启用 0-禁用'
    }
  }, {
    tableName: 'roles',
    timestamps: true
  });

  return Role;
};
