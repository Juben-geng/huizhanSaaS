const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MiniprogramPublish = sequelize.define('MiniprogramPublish', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    taskId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '小程序类型: attendee-观众端, merchant-商家端'
    },
    version: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
      comment: '状态: pending-待处理, building-构建中, uploading-上传中, auditing-审核中, success-成功, failed-失败, rolling_back-回滚中, rolled_back-已回滚'
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '进度 0-100'
    },
    logs: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON格式的日志数组'
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'miniprogram_publish',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });

  return MiniprogramPublish;
};
