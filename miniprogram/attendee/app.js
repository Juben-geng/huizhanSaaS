const API_BASE_URL = getApp().globalData?.apiBaseUrl || 'http://localhost:3000/api';

App({
  globalData: {
    userInfo: null,
    token: null,
    exhibitionId: null,
    currentExhibition: null,
    socketConnected: false,
    offlineData: [],
    apiBaseUrl: API_BASE_URL
  },

  onLaunch() {
    this.checkLogin();
    this.initSocket();
    this.syncOfflineData();
  },

  onShow() {
    this.getLocation();
  },

  checkLogin() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token && userInfo) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
    }
  },

  initSocket() {
    const socketUrl = `${this.globalData.apiBaseUrl.replace('http', 'ws')}`;
    wx.connectSocket({
      url: socketUrl
    });

    wx.onSocketOpen(() => {
      this.globalData.socketConnected = true;
      console.log('Socket connected');
    });

    wx.onSocketError((error) => {
      console.error('Socket error:', error);
      this.globalData.socketConnected = false;
    });

    wx.onSocketClose(() => {
      this.globalData.socketConnected = false;
    });
  },

  getLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.globalData.location = {
          latitude: res.latitude,
          longitude: res.longitude
        };
      },
      fail: () => {
        console.log('Location permission denied');
      }
    });
  },

  request(options) {
    const { url, method = 'GET', data = {}, needAuth = true } = options;
    const header = {
      'Content-Type': 'application/json'
    };

    if (needAuth && this.globalData.token) {
      header['Authorization'] = `Bearer ${this.globalData.token}`;
    }

    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.globalData.apiBaseUrl}${url}`,
        method,
        data,
        header,
        success: (res) => {
          if (res.statusCode === 200) {
            if (res.data.code === 200) {
              resolve(res.data.data);
            } else {
              wx.showToast({
                title: res.data.msg || '请求失败',
                icon: 'none'
              });
              reject(res.data);
            }
          } else {
            wx.showToast({
              title: '网络错误',
              icon: 'none'
            });
            reject(res);
          }
        },
        fail: (error) => {
          if (this.isOffline()) {
            this.saveOfflineData({ url, method, data });
          }
          wx.showToast({
            title: '网络连接失败',
            icon: 'none'
          });
          reject(error);
        }
      });
    });
  },

  login(code, encryptedData, iv) {
    return this.request({
      url: '/user/wechat/login',
      method: 'POST',
      data: { code, encryptedData, iv },
      needAuth: false
    });
  },

  isOffline() {
    const networkType = wx.getNetworkType();
    return networkType === 'none';
  },

  saveOfflineData(data) {
    this.globalData.offlineData.push({
      ...data,
      timestamp: Date.now()
    });
    wx.setStorageSync('offlineData', this.globalData.offlineData);
  },

  syncOfflineData() {
    const offlineData = wx.getStorageSync('offlineData') || [];
    
    if (offlineData.length > 0 && !this.isOffline()) {
      offlineData.forEach(async (item) => {
        try {
          await this.request({
            url: item.url,
            method: item.method,
            data: item.data
          });
        } catch (error) {
          console.error('Sync failed:', error);
        }
      });

      this.globalData.offlineData = [];
      wx.removeStorageSync('offlineData');
      wx.showToast({
        title: '离线数据已同步',
        icon: 'success'
      });
    }
  },

  joinExhibition(exhibitionId) {
    if (this.globalData.socketConnected) {
      wx.sendSocketMessage({
        data: JSON.stringify({
          type: 'join-exhibition',
          exhibitionId
        })
      });
      this.globalData.exhibitionId = exhibitionId;
    }
  },

  joinRoom(roomId) {
    if (this.globalData.socketConnected) {
      wx.sendSocketMessage({
        data: JSON.stringify({
          type: 'join-room',
          roomId
        })
      });
    }
  },

  leaveRoom(roomId) {
    if (this.globalData.socketConnected) {
      wx.sendSocketMessage({
        data: JSON.stringify({
          type: 'leave-room',
          roomId
        })
      });
    }
  },

  sendMessage(data) {
    if (this.globalData.socketConnected) {
      wx.sendSocketMessage({
        data: JSON.stringify({
          type: 'send-message',
          ...data
        })
      });
    }
  }
});
