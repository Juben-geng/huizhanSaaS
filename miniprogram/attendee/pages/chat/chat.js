const app = getApp();

Page({
  data: {
    roomId: '',
    merchantId: '',
    merchantInfo: {},
    roomInfo: {},
    userInfo: {},
    messages: [],
    systemMessages: [],
    inputText: '',
    scrollToView: '',
    online: false,
    typing: false,
    typingTimer: null
  },

  onLoad(options) {
    const { roomId, merchantId } = options;
    this.setData({ 
      roomId, 
      merchantId,
      userInfo: app.globalData.userInfo || {}
    });
    
    this.loadChatInfo();
    this.loadMessages();
    this.setupSocketListeners();
  },

  onUnload() {
    app.leaveRoom(this.data.roomId);
    this.removeSocketListeners();
  },

  async loadChatInfo() {
    try {
      const roomInfo = await app.request({
        url: '/virtual-room/detail',
        method: 'GET',
        data: { roomId: this.data.roomId }
      });

      this.setData({
        roomInfo,
        merchantInfo: roomInfo.merchant || {},
        online: roomInfo.onlineStatus || false
      });
    } catch (error) {
      console.error('Load chat info error:', error);
    }
  },

  async loadMessages() {
    try {
      const messages = await app.request({
        url: '/virtual-room/chat/messages',
        method: 'GET',
        data: {
          roomId: this.data.roomId,
          pageNum: 1,
          pageSize: 50
        }
      });

      const formattedMessages = messages.list.map(msg => ({
        ...msg,
        sendTime: this.formatTime(msg.createdAt)
      }));

      this.setData({ messages: formattedMessages });

      if (formattedMessages.length > 0) {
        const lastMsg = formattedMessages[formattedMessages.length - 1];
        this.setData({ scrollToView: `msg-${lastMsg.messageId}` });
      }
    } catch (error) {
      console.error('Load messages error:', error);
    }
  },

  setupSocketListeners() {
    wx.onSocketMessage((res) => {
      const data = JSON.parse(res.data);

      if (data.type === 'new-message' && data.roomId === this.data.roomId) {
        this.receiveMessage(data.data);
      } else if (data.type === 'typing' && data.roomId === this.data.roomId) {
        this.showTypingIndicator(data.data);
      } else if (data.type === 'user-joined' && data.roomId === this.data.roomId) {
        this.addSystemMessage(`${data.data.userName} 加入了聊天室`);
      } else if (data.type === 'user-left' && data.roomId === this.data.roomId) {
        this.addSystemMessage(`${data.data.userName} 离开了聊天室`);
      }
    });
  },

  removeSocketListeners() {
    wx.offSocketMessage();
  },

  receiveMessage(message) {
    const formattedMessage = {
      ...message,
      sendTime: this.formatTime(new Date())
    };

    const messages = [...this.data.messages, formattedMessage];
    this.setData({
      messages,
      scrollToView: `msg-${formattedMessage.messageId}`,
      typing: false
    });
  },

  showTypingIndicator(data) {
    this.setData({ typing: true });

    if (this.data.typingTimer) {
      clearTimeout(this.data.typingTimer);
    }

    this.data.typingTimer = setTimeout(() => {
      this.setData({ typing: false });
    }, 3000);
  },

  addSystemMessage(content) {
    const systemMessages = [...this.data.systemMessages, { content }];
    this.setData({ systemMessages });
  },

  onInputChange(e) {
    this.setData({ inputText: e.detail.value });
  },

  async sendMessage() {
    const content = this.data.inputText.trim();
    
    if (!content) {
      wx.showToast({
        title: '请输入消息内容',
        icon: 'none'
      });
      return;
    }

    try {
      const message = await app.request({
        url: '/virtual-room/chat/send',
        method: 'POST',
        data: {
          roomId: this.data.roomId,
          senderId: app.globalData.userInfo.userId,
          senderType: 'user',
          content
        }
      });

      const formattedMessage = {
        ...message,
        sendTime: this.formatTime(new Date())
      };

      const messages = [...this.data.messages, formattedMessage];
      this.setData({
        messages,
        inputText: '',
        scrollToView: `msg-${formattedMessage.messageId}`
      });

      app.sendMessage({
        roomId: this.data.roomId,
        message: formattedMessage
      });
    } catch (error) {
      console.error('Send message error:', error);
      wx.showToast({
        title: '发送失败',
        icon: 'none'
      });
    }
  },

  handleImageUpload() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.uploadImage(tempFilePath);
      }
    });
  },

  async uploadImage(filePath) {
    try {
      wx.showLoading({ title: '上传中...' });

      const uploadTask = wx.uploadFile({
        url: `${app.globalData.apiBaseUrl}/virtual-room/chat/upload-image`,
        filePath,
        name: 'image',
        header: {
          'Authorization': `Bearer ${app.globalData.token}`
        },
        success: (uploadRes) => {
          const data = JSON.parse(uploadRes.data);
          if (data.code === 200) {
            this.sendImageMessage(data.data.imageUrl);
          } else {
            wx.showToast({
              title: '上传失败',
              icon: 'none'
            });
          }
        },
        fail: () => {
          wx.showToast({
            title: '上传失败',
            icon: 'none'
          });
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    } catch (error) {
      console.error('Upload image error:', error);
      wx.hideLoading();
    }
  },

  async sendImageMessage(imageUrl) {
    try {
      const message = await app.request({
        url: '/virtual-room/chat/send',
        method: 'POST',
        data: {
          roomId: this.data.roomId,
          senderId: app.globalData.userInfo.userId,
          senderType: 'user',
          messageType: 'image',
          content: imageUrl
        }
      });

      const formattedMessage = {
        ...message,
        sendTime: this.formatTime(new Date())
      };

      const messages = [...this.data.messages, formattedMessage];
      this.setData({
        messages,
        scrollToView: `msg-${formattedMessage.messageId}`
      });

      app.sendMessage({
        roomId: this.data.roomId,
        message: formattedMessage
      });
    } catch (error) {
      console.error('Send image error:', error);
    }
  },

  formatTime(date) {
    const now = new Date(date);
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  onPullDownRefresh() {
    this.loadMessages().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
