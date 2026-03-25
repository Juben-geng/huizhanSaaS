const app = getApp();

Page({
  data: {
    flash: false,
    showResult: false,
    resultData: {},
    recentScans: [],
    qrCodeUrl: '',
    scanning: false
  },

  onLoad() {
    this.loadRecentScans();
    this.loadQRCode();
  },

  onShow() {
    this.setData({ scanning: true });
  },

  onHide() {
    this.setData({ scanning: false });
  },

  async handleScanCode(e) {
    if (this.data.scanning) {
      this.setData({ scanning: false });

      const result = e.detail.result;
      const userCode = result.startsWith('user:') ? result : `user:${result}`;

      try {
        const location = app.globalData.location || {};
        const scanResult = await app.request({
          url: '/merchant/scan-user',
          method: 'POST',
          data: {
            merchantId: app.globalData.merchantInfo.merchantId,
            userCode,
            longitude: location.longitude,
            latitude: location.latitude
          }
        });

        this.setData({
          showResult: true,
          resultData: scanResult
        });

        this.loadRecentScans();
      } catch (error) {
        wx.showToast({
          title: '扫码失败，请重试',
          icon: 'none'
        });
        this.setData({ scanning: true });
      }
    }
  },

  toggleFlash() {
    this.setData({
      flash: !this.data.flash
    });
  },

  switchCamera() {
    wx.showToast({
      title: '切换相机',
      icon: 'none'
    });
  },

  scanFromAlbum() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        wx.scanCode({
          onlyFromCamera: false,
          success: (scanRes) => {
            this.handleScanCode({ detail: { result: scanRes.result } });
          }
        });
      }
    });
  },

  async loadRecentScans() {
    try {
      const visitors = await app.request({
        url: '/merchant/visitors',
        method: 'GET',
        data: {
          merchantId: app.globalData.merchantInfo.merchantId,
          pageNum: 1,
          pageSize: 5
        }
      });

      const formattedVisitors = visitors.list.map(visitor => ({
        ...visitor,
        scanTime: this.formatTime(visitor.createdAt)
      }));

      this.setData({ recentScans: formattedVisitors });
    } catch (error) {
      console.error('Load recent scans error:', error);
    }
  },

  async loadQRCode() {
    try {
      const qrCodeData = await app.request({
        url: '/merchant/qr-code',
        method: 'GET',
        data: {
          merchantId: app.globalData.merchantInfo.merchantId
        }
      });

      this.setData({ qrCodeUrl: qrCodeData.qrCodeUrl });
    } catch (error) {
      console.error('Load QR code error:', error);
    }
  },

  async generateQRCode() {
    try {
      const qrCodeData = await app.request({
        url: '/merchant/generate-qr-code',
        method: 'POST',
        data: {
          merchantId: app.globalData.merchantInfo.merchantId
        }
      });

      this.setData({ qrCodeUrl: qrCodeData.qrCodeUrl });

      wx.showToast({
        title: '二维码生成成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('Generate QR code error:', error);
      wx.showToast({
        title: '生成失败',
        icon: 'none'
      });
    }
  },

  closeResult() {
    this.setData({ 
      showResult: false,
      scanning: true
    });
  },

  sendMessage() {
    const userId = this.data.resultData.userId;
    wx.navigateTo({
      url: `/pages/chat/chat?userId=${userId}`
    });
    this.closeResult();
  },

  goToVisitorDetail(e) {
    const connectionId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/visitor-detail/visitor-detail?connectionId=${connectionId}`
    });
  },

  goToVisitors() {
    wx.switchTab({
      url: '/pages/visitors/visitors'
    });
  },

  formatTime(date) {
    const now = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (now.toDateString() === today.toDateString()) {
      return now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (now.toDateString() === yesterday.toDateString()) {
      return '昨天';
    } else {
      return now.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    }
  }
});
