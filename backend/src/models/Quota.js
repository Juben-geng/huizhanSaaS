module.exports = (sequelize, DataTypes) => {
  const Quota = sequelize.define('Quota', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    quotaId: {
      type: DataTypes.STRING(64),
      unique: true,
      allowNull: false,
      comment: '额度ID'
    },
    organizerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '主办方ID'
    },
    exhibitionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '展会ID'
    },
    quotaType: {
      type: DataTypes.ENUM('api_calls', 'storage', 'concurrent_users', 'bandwidth', 'virtual_rooms', 'ai_recommendations'),
      allowNull: false,
      comment: '额度类型'
    },
    totalQuota: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '总额度'
    },
    usedQuota: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '已使用额度'
    },
    remainQuota: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '剩余额度'
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '单位'
    },
    resetPeriod: {
      type: DataTypes.ENUM('none', 'daily', 'weekly', 'monthly', 'yearly'),
      defaultValue: 'monthly',
      comment: '重置周期'
    },
    lastResetTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后重置时间'
    },
    nextResetTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '下次重置时间'
    },
    alertThreshold: {
      type: DataTypes.INTEGER,
      defaultValue: 80,
      comment: '告警阈值（百分比）'
    },
    isAlerted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否已告警'
    },
    overuseAction: {
      type: DataTypes.ENUM('limit', 'throttle', 'charge', 'allow'),
      defaultValue: 'limit',
      comment: '超额处理方式'
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '状态：1-正常 0-禁用'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'quotas',
    timestamps: true,
    indexes: [
      { fields: ['quotaId'] },
      { fields: ['organizerId'] },
      { fields: ['exhibitionId'] },
      { fields: ['quotaType'] }
    ]
  });

  return Quota;
};
