module.exports = (sequelize, DataTypes) => {
  const Teacher = sequelize.define('Teacher', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    teacherId: {
      type: DataTypes.STRING(64),
      unique: true,
      allowNull: false,
      comment: '教师唯一ID'
    },
    teacherName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '教师姓名'
    },
    username: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
      comment: '登录用户名'
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '登录密码（加密）'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '联系电话'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '联系邮箱'
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '头像URL'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '教师简介'
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '状态：1-正常 0-禁用'
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后登录时间'
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '角色ID'
    }
  }, {
    tableName: 'teachers',
    timestamps: true,
    indexes: [
      { fields: ['teacherId'] },
      { fields: ['username'] },
      { fields: ['status'] }
    ]
  });

  return Teacher;
};
