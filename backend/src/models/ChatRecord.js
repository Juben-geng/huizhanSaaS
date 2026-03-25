module.exports = (sequelize, DataTypes) => {
  const ChatRecord = sequelize.define('ChatRecord', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    chatId: {
      type: DataTypes.STRING(64),
      unique: true,
      allowNull: false,
      comment: '洽谈记录ID'
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
    roomId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '虚拟展位ID'
    },
    chatType: {
      type: DataTypes.ENUM('text', 'voice', 'image', 'file'),
      defaultValue: 'text',
      comment: '洽谈类型'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '内容'
    },
    mediaUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '媒体文件URL'
    },
    sender: {
      type: DataTypes.ENUM('user', 'merchant'),
      allowNull: false,
      comment: '发送方'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否已读'
    },
    readTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '阅读时间'
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '状态：1-正常 0-删除'
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
    tableName: 'chat_records',
    timestamps: true,
    indexes: [
      { fields: ['chatId'] },
      { fields: ['userId'] },
      { fields: ['merchantId'] },
      { fields: ['roomId'] },
      { fields: ['createdAt'] }
    ]
  });

  return ChatRecord;
};
