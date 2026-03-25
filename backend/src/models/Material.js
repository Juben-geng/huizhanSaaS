module.exports = (sequelize, DataTypes) => {
  const Material = sequelize.define('Material', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    materialId: {
      type: DataTypes.STRING(64),
      unique: true,
      allowNull: false,
      comment: '物料ID'
    },
    merchantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '商家ID'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '物料标题'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '物料描述'
    },
    fileType: {
      type: DataTypes.ENUM('image', 'pdf', 'video', 'document', 'link'),
      allowNull: false,
      comment: '文件类型'
    },
    fileUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '文件URL'
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '文件大小（字节）'
    },
    thumbnailUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '缩略图URL'
    },
    downloadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '下载次数'
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '查看次数'
    },
    shareCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '分享次数'
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
    tableName: 'materials',
    timestamps: true,
    indexes: [
      { fields: ['materialId'] },
      { fields: ['merchantId'] },
      { fields: ['fileType'] }
    ]
  });

  return Material;
};
