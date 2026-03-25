module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.STRING(64),
      unique: true,
      allowNull: false,
      comment: '用户唯一ID'
    },
    openid: {
      type: DataTypes.STRING(128),
      allowNull: true,
      comment: '微信openid'
    },
    unionid: {
      type: DataTypes.STRING(128),
      allowNull: true,
      comment: '微信unionid'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '手机号（脱敏存储）'
    },
    phoneRaw: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '手机号原始数据（加密）'
    },
    company: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '企业名称'
    },
    position: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '职位'
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '头像URL'
    },
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '昵称'
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否线上参会'
    },
    exhibitionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '展会ID'
    },
    organizerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '主办方ID'
    },
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '积分'
    },
    scanCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '扫码次数'
    },
    connectionCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '建联数量'
    },
    lastScanTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后扫码时间'
    },
    privacyEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '隐私保护开关'
    },
    aiRecommendEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'AI推荐开关'
    },
    offlineModeEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '离线模式开关'
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
    loginWeeklyCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '本周登录次数'
    },
    loginDuration: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '总登录时长（分钟）'
    },
    lastWeeklyReset: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后重置周次时间'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['openid'] },
      { fields: ['phone'] },
      { fields: ['exhibitionId'] },
      { fields: ['organizerId'] }
    ]
  });

  return User;
};
