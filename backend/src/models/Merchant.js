module.exports = (sequelize, DataTypes) => {
  const Merchant = sequelize.define('Merchant', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    merchantId: {
      type: DataTypes.STRING(64),
      unique: true,
      allowNull: false,
      comment: '商家唯一ID'
    },
    merchantName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '商家名称'
    },
    industry: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '所属行业'
    },
    logo: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Logo URL'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '商家简介'
    },
    address: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '地址'
    },
    contactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '联系电话'
    },
    contactPerson: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '联系人'
    },
    wechatId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '企业微信号'
    },
    exhibitionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '展会ID'
    },
    organizerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '主办方ID'
    },
    boothNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '展位号'
    },
    boothZone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '展区'
    },
    qrCode: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '展位二维码URL'
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      comment: '纬度'
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      comment: '经度'
    },
    hasVirtualRoom: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否开启虚拟展位'
    },
    virtualRoomType: {
      type: DataTypes.ENUM('none', 'basic', 'premium'),
      defaultValue: 'none',
      comment: '虚拟展位类型'
    },
    visitorCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '访客数'
    },
    connectionCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '建联数'
    },
    materialViewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '物料查看数'
    },
    onlineVisitorCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '线上访客数'
    },
    chatCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '洽谈次数'
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
    tableName: 'merchants',
    timestamps: true,
    indexes: [
      { fields: ['merchantId'] },
      { fields: ['exhibitionId'] },
      { fields: ['organizerId'] },
      { fields: ['boothZone'] },
      { fields: ['industry'] }
    ]
  });

  return Merchant;
};
