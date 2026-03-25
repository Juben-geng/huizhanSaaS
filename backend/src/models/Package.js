module.exports = (sequelize, DataTypes) => {
  const Package = sequelize.define('Package', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    packageId: {
      type: DataTypes.STRING(64),
      unique: true,
      allowNull: false,
      comment: '套餐唯一ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '套餐名称'
    },
    type: {
      type: DataTypes.ENUM('free', 'professional', 'enterprise', 'flagship'),
      allowNull: false,
      comment: '套餐类型'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: '价格'
    },
    period: {
      type: DataTypes.STRING(20),
      defaultValue: '年',
      comment: '计费周期'
    },
    limitExhibitions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '展会数量限制'
    },
    limitMerchants: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '商家数量限制'
    },
    limitVisitors: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '访客数量限制'
    },
    limitStorage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '存储空间限制(GB)'
    },
    features: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '功能特性(JSON数组)'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      comment: '状态'
    },
    userCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '使用人数'
    }
  }, {
    tableName: 'packages',
    timestamps: true,
    indexes: [
      { fields: ['packageId'] },
      { fields: ['type'] },
      { fields: ['status'] }
    ]
  });

  Package.prototype.getFeaturesArray = function() {
    if (!this.features) return [];
    try {
      return JSON.parse(this.features);
    } catch (e) {
      return [];
    }
  };

  Package.prototype.setFeaturesArray = function(features) {
    this.features = JSON.stringify(features);
  };

  return Package;
};
