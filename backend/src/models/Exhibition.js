module.exports = (sequelize, DataTypes) => {
  const Exhibition = sequelize.define('Exhibition', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    exhibitionId: {
      type: DataTypes.STRING(64),
      unique: true,
      allowNull: false,
      comment: '展会唯一ID'
    },
    exhibitionName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '展会名称'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '展会简介'
    },
    coverImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '封面图URL'
    },
    organizerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '主办方ID'
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
    venue: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '展会地点'
    },
    maxUsers: {
      type: DataTypes.INTEGER,
      defaultValue: 200,
      comment: '最大参会人数'
    },
    maxMerchants: {
      type: DataTypes.INTEGER,
      defaultValue: 20,
      comment: '最大商家数量'
    },
    currentUsers: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '当前参会人数'
    },
    currentMerchants: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '当前商家数量'
    },
    hasVirtualExhibition: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否开启线上展会'
    },
    hasScreen: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否开启现场大屏'
    },
    hasAIRecommend: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否开启AI推荐'
    },
    status: {
      type: DataTypes.ENUM('draft', 'ongoing', 'completed', 'cancelled'),
      defaultValue: 'draft',
      comment: '状态'
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
    tableName: 'exhibitions',
    timestamps: true,
    indexes: [
      { fields: ['exhibitionId'] },
      { fields: ['organizerId'] },
      { fields: ['status'] },
      { fields: ['startTime'] }
    ]
  });

  return Exhibition;
};
