module.exports = (sequelize, DataTypes) => {
  const VirtualRoom = sequelize.define('VirtualRoom', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    roomId: {
      type: DataTypes.STRING(64),
      unique: true,
      allowNull: false,
      comment: '虚拟展位ID'
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
    roomName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '展位名称'
    },
    roomType: {
      type: DataTypes.ENUM('basic', 'premium'),
      defaultValue: 'basic',
      comment: '展位类型'
    },
    roomImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '展位主图'
    },
    roomImages: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '展位图片（JSON数组）'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '展位描述'
    },
    is3D: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否3D展位'
    },
    model3DUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '3D模型URL'
    },
    videoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '宣传视频URL'
    },
    visitorCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '访客数'
    },
    chatCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '洽谈次数'
    },
    onlineStatus: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '在线状态'
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '分类'
    },
    tags: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '标签（逗号分隔）'
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
    tableName: 'virtual_rooms',
    timestamps: true,
    indexes: [
      { fields: ['roomId'] },
      { fields: ['merchantId'] },
      { fields: ['exhibitionId'] },
      { fields: ['category'] }
    ]
  });

  return VirtualRoom;
};
