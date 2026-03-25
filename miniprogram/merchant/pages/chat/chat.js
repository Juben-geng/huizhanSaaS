const app = getApp();

Page({
  data: {
    merchantId: '',
    merchantInfo: {},
    userId: '',
    chatUser: {},
    messages: [],
    messageGroups: [],
    inputText: '',
    showEmoji: false,
    scrollToView: '',
    emojiList: ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '😘', '🥰', '😗', '😙', '😚', '🙂', '🤗']
  },

  onLoad(options) {
    const { userId } = options;
    this.setData({ 
      merchantId: app.globalData.merchantInfo.merchantId,
      merchantInfo: app.globalData.merchantInfo,
      userId 
    });

    this.loadChatUser();
    this.loadMessages();
    this.initSocketListener();
  },

  onUnload() {
    this.leaveChat();
  },

  onShow() {
    if (this.data.messages.length > 0) {
      this.loadMessages();
    }
  },

  async loadChatUser() {
    try {
      const chatUser = await app.request({
        url: '/merchant/chat-user',
        method: 'GET',
        data: {
          userId: this.data.userId
        }
      });

      this.setData({ chatUser });
    } catch (error) {
      console.error('Load chat user error:', error);
    }
  },

  async loadMessages() {
    try {
      const messages = await app.request({
        url: '/merchant/messages',
        method: 'GET',
        data: {
          merchantId: this.data.merchantId,
          userId: this.data.userId
        }
      });

      const formattedMessages = messages.map(message => ({
        ...message,
        sendTime: this.formatTime(message.createdAt),
        fileSize: this.formatFileSize(message.fileSize)
      }));

      this.setData({ messages: formattedMessages });
      this.groupMessages();
      this.scrollToBottom();
    } catch (error) {
      console.error('Load messages error:', error);
    }
  },

  initSocketListener() {
    wx.onSocketMessage((res) => {
      try {
        const data = JSON.parse(res.data);

        if (data.type === 'new-message' && 
            ((data.senderId === this.data.userId && data.receiverId === this.data.merchantId) ||
             (data.senderId === this.data.merchantId && data.receiverId === this.data.userId))) {
          
          const newMessage = {
            ...data.message,
            sendTime: this.formatTime(data.message.createdAt),
            fileSize: this.formatFileSize(data.message.fileSize)
          };

          this.setData({
            messages: [...this.data.messages, newMessage]
          });

          this.groupMessages();
          this.scrollToBottom();

          this.markAsRead();
        }
      } catch (error) {
        console.error('Socket message error:', error);
      }
    });
  },

  joinChat() {
    const roomId = `chat_${this.data.merchantId}_${this.data.userId}`;
    app.joinRoom(roomId);
  },

  leaveChat() {
    const roomId = `chat_${this.data.merchantId}_${this.data.userId}`;
    app.leaveRoom(roomId);
  },

  async markAsRead() {
    try {
      await app.request({
        url: '/merchant/mark-read',
        method: 'POST',
        data: {
          merchantId: this.data.merchantId,
          userId: this.data.userId
        }
      });
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  },

  onInputChange(e) {
    this.setData({ inputText: e.detail.value });
  },

  async sendTextMessage() {
    const text = this.data.inputText.trim();
    if (!text) return;

    try {
      await app.request({
        url: '/merchant/send-message',
        method: 'POST',
        data: {
          senderId: this.data.merchantId,
          receiverId: this.data.userId,
          messageType: 'text',
          content: text
        }
      });

      app.sendMessage({
        senderId: this.data.merchantId,
        receiverId: this.data.userId,
        messageType: 'text',
        content: text
      });

      this.setData({ inputText: '' });
    } catch (error) {
      console.error('Send message error:', error);
      wx.showToast({
        title: '发送失败',
        icon: 'none'
      });
    }
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFilePaths[0];

        wx.showLoading({ title: '发送中...' });

        try {
          const imageUrl = await this.uploadFile(tempFilePath);

          await app.request({
            url: '/merchant/send-message',
            method: 'POST',
            data: {
              senderId: this.data.merchantId,
              receiverId: this.data.userId,
              messageType: 'image',
              imageUrl
            }
          });

          app.sendMessage({
            senderId: this.data.merchantId,
            receiverId: this.data.userId,
            messageType: 'image',
            imageUrl
          });

          wx.hideLoading();
        } catch (error) {
          console.error('Send image error:', error);
          wx.hideLoading();
          wx.showToast({
            title: '发送失败',
            icon: 'none'
          });
        }
      }
    });
  },

  chooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: async (res) => {
        const tempFilePath = res.tempFiles[0].path;
        const fileName = res.tempFiles[0].name;
        const fileSize = res.tempFiles[0].size;

        wx.showLoading({ title: '发送中...' });

        try {
          const fileUrl = await this.uploadFile(tempFilePath);

          await app.request({
            url: '/merchant/send-message',
            method: 'POST',
            data: {
              senderId: this.data.merchantId,
              receiverId: this.data.userId,
              messageType: 'file',
              fileUrl,
              fileName,
              fileSize
            }
          });

          app.sendMessage({
            senderId: this.data.merchantId,
            receiverId: this.data.userId,
            messageType: 'file',
            fileUrl,
            fileName,
            fileSize
          });

          wx.hideLoading();
        } catch (error) {
          console.error('Send file error:', error);
          wx.hideLoading();
          wx.showToast({
            title: '发送失败',
            icon: 'none'
          });
        }
      }
    });
  },

  uploadFile(filePath) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${app.globalData.apiBaseUrl}/upload/file`,
        filePath,
        name: 'file',
        header: {
          'Authorization': `Bearer ${app.globalData.token}`
        },
        success: (res) => {
          const data = JSON.parse(res.data);
          if (data.code === 200) {
            resolve(data.data.url);
          } else {
            reject(data);
          }
        },
        fail: reject
      });
    });
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    const images = this.data.messages
      .filter(m => m.messageType === 'image')
      .map(m => m.imageUrl);

    wx.previewImage({
      current: url,
      urls: images
    });
  },

  toggleEmoji() {
    this.setData({
      showEmoji: !this.data.showEmoji
    });
  },

  selectEmoji(e) {
    const emoji = e.currentTarget.dataset.emoji;
    this.setData({
      inputText: this.data.inputText + emoji
    });
  },

  groupMessages() {
    const groups = [];
    let currentDate = '';

    this.data.messages.forEach((message, index) => {
      const messageDate = this.formatDate(message.createdAt);

      if (messageDate !== currentDate) {
        groups.push({
          date: messageDate,
          messages: []
        });
        currentDate = messageDate;
      }

      groups[groups.length - 1].messages.push(message);
    });

    this.setData({ messageGroups: groups });
  },

  scrollToBottom() {
    const messages = this.data.messages;
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      this.setData({
        scrollToView: `msg-${lastMessage.messageId}`
      });
    }
  },

  goToUserDetail() {
    wx.navigateTo({
      url: `/pages/visitor-detail/visitor-detail?userId=${this.data.userId}`
    });
  },

  formatTime(date) {
    const now = new Date(date);
    return now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  },

  formatDate(date) {
    const now = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (now.toDateString() === today.toDateString()) {
      return '今天';
    } else if (now.toDateString() === yesterday.toDateString()) {
      return '昨天';
    } else {
      return now.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    }
  },

  formatFileSize(bytes) {
    if (!bytes) return '0B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + sizes[i];
  }
});
