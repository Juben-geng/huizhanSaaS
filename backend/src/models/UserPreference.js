module.exports = (sequelize, DataTypes) => {
  const UserPreference = sequelize.define('UserPreference', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    preferenceId: {
      type: DataTypes.STRING(64),
      unique: true,
      allowNull: false,
      comment: '偏好ID'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '用户ID'
    },
    exhibitionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '展会ID'
    },
    preferredIndustries: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '偏好行业（JSON数组）'
    },
    scanHistory: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '扫码历史（JSON数组）'
    },
    materialViewHistory: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '物料查看历史（JSON数组）'
    },
    searchHistory: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '搜索历史（JSON数组）'
    },
    connectionHistory: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '建联历史（JSON数组）'
    },
    preferredZones: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '偏好展区（JSON数组）'
    },
    behaviorTags: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '行为标签（JSON数组）'
    },
    intentionLevel: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
      comment: '意向度'
    },
    activityLevel: {
      type: DataTypes.ENUM('inactive', 'normal', 'active', 'highly_active'),
      defaultValue: 'normal',
      comment: '活跃度'
    },
    lastUpdateTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后更新时间'
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
    tableName: 'user_preferences',
    timestamps: true,
    indexes: [
      { fields: ['preferenceId'] },
      { fields: ['userId'] },
      { fields: ['exhibitionId'] }
    ]
  });

  return UserPreference;
};
