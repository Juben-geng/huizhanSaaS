module.exports = (sequelize, DataTypes) => {
  const Organizer = sequelize.define('Organizer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    organizerId: {
      type: DataTypes.STRING(64),
      unique: true,
      allowNull: false,
      comment: '主办方唯一ID'
    },
    organizerName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '主办方名称'
    },
    username: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: true,
      comment: '登录用户名'
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '登录密码（加密）'
    },
    contactPerson: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '联系人'
    },
    contactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '联系电话'
    },
    contactEmail: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '联系邮箱'
    },
    logo: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Logo URL'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '主办方简介'
    },
    packageType: {
      type: DataTypes.ENUM('free', 'professional', 'enterprise'),
      defaultValue: 'free',
      comment: '套餐类型'
    },
    packageExpireTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '套餐到期时间'
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
    tableName: 'organizers',
    timestamps: true,
    indexes: [
      { fields: ['organizerId'] },
      { fields: ['username'] },
      { fields: ['packageType'] }
    ]
  });

  return Organizer;
};
