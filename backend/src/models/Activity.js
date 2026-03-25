module.exports = (sequelize, DataTypes) => {
  const Activity = sequelize.define('Activity', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    activityId: {
      type: DataTypes.STRING(64),
      unique: true,
      allowNull: false,
      comment: '活动ID'
    },
    exhibitionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '展会ID'
    },
    activityName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '活动名称'
    },
    activityType: {
      type: DataTypes.ENUM('scan_reward', 'challenge', 'lottery'),
      allowNull: false,
      comment: '活动类型'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '活动描述'
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '开始时间'
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '结束时间'
    },
    rules: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '活动规则（JSON）'
    },
    scanCountRequired: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '所需扫码次数'
    },
    zonesRequired: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '所需展区（JSON数组）'
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否线上活动'
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
    tableName: 'activities',
    timestamps: true,
    indexes: [
      { fields: ['activityId'] },
      { fields: ['exhibitionId'] },
      { fields: ['activityType'] }
    ]
  });

  return Activity;
};
