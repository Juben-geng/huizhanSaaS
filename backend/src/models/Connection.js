module.exports = (sequelize, DataTypes) => {
  const Connection = sequelize.define('Connection', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    connectionId: {
      type: DataTypes.STRING(64),
      unique: true,
      allowNull: false,
      comment: '建联记录ID'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '用户ID'
    },
    merchantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '商家ID'
    },
    scanType: {
      type: DataTypes.ENUM('user_scan', 'merchant_scan', 'both_scan'),
      defaultValue: 'user_scan',
      comment: '扫码类型'
    },
    scanTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: '扫码时间'
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      comment: '扫码纬度'
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      comment: '扫码经度'
    },
    isOffline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否离线扫码'
    },
    syncTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '离线数据同步时间'
    },
    intentionLevel: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
      comment: '意向度'
    },
    materialViewed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否查看物料'
    },
    materialViewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '物料查看次数'
    },
    lastViewTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后查看时间'
    },
    isDuplicate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否重复扫码'
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '状态：1-有效 0-无效'
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
    tableName: 'connections',
    timestamps: true,
    indexes: [
      { fields: ['connectionId'] },
      { fields: ['userId'] },
      { fields: ['merchantId'] },
      { fields: ['scanTime'] },
      { fields: ['intentionLevel'] }
    ]
  });

  return Connection;
};
