module.exports = (sequelize, DataTypes) => {
  const AIRecommendation = sequelize.define('AIRecommendation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    recommendationId: {
      type: DataTypes.STRING(64),
      unique: true,
      allowNull: false,
      comment: '推荐ID'
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
    exhibitionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '展会ID'
    },
    matchScore: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      comment: '匹配分数'
    },
    matchReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '推荐理由（JSON）'
    },
    recommendationType: {
      type: DataTypes.ENUM('industry_match', 'behavior_match', 'location_match', 'complementary'),
      allowNull: false,
      comment: '推荐类型'
    },
    isViewed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否已查看'
    },
    isConnected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否已建联'
    },
    viewTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '查看时间'
    },
    connectTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '建联时间'
    },
    position: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '推荐位置'
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '状态：1-有效 0-失效'
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
    tableName: 'ai_recommendations',
    timestamps: true,
    indexes: [
      { fields: ['recommendationId'] },
      { fields: ['userId'] },
      { fields: ['merchantId'] },
      { fields: ['exhibitionId'] },
      { fields: ['matchScore'] }
    ]
  });

  return AIRecommendation;
};
