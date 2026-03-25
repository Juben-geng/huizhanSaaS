module.exports = (sequelize, DataTypes) => {
  const Prize = sequelize.define('Prize', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    prizeId: {
      type: DataTypes.STRING(64),
      unique: true,
      allowNull: false,
      comment: '奖品ID'
    },
    activityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '活动ID'
    },
    prizeName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '奖品名称'
    },
    prizeImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '奖品图片'
    },
    prizeType: {
      type: DataTypes.ENUM('score', 'gift', 'coupon', 'voucher', 'other'),
      allowNull: false,
      comment: '奖品类型'
    },
    prizeValue: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '奖品价值'
    },
    totalCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '总数量'
    },
    remainCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '剩余数量'
    },
    winCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '已中奖数量'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序'
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
    tableName: 'prizes',
    timestamps: true,
    indexes: [
      { fields: ['prizeId'] },
      { fields: ['activityId'] }
    ]
  });

  return Prize;
};
