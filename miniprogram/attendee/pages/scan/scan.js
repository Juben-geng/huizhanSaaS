const app = getApp();

Page({
  data: {
    flash: false,
    showResult: false,
    resultData: {},
    recentScans: [],
    scanning: false
  },

  onLoad() {
    this.loadRecentScans();
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
      const qrCode = result.startsWith('merchant:') ? result : `merchant:${result}`;

      try {
        const location = app.globalData.location || {};
        const scanResult = await app.request({
          url: '/user/scan/connect',
          method: 'POST',
          data: {
            userId: app.globalData.userInfo.userId,
            qrCode,
            longitude: location.longitude,
            latitude: location.latitude
          }
        });

        this.setData({
          showResult: true,
          resultData: scanResult
        });

        await app.request({
          url: '/ai/preference/scan',
          method: 'POST',
          data: {
            userId: app.globalData.userInfo.userId,
            merchantId: scanResult.merchant.merchantId,
            industry: scanResult.merchant.industry
          }
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
      const connections = await app.request({
        url: '/user/connect/list',
        method: 'GET',
        data: {
          userId: app.globalData.userInfo.userId,
          pageNum: 1,
          pageSize: 5
        }
      });

      this.setData({ recentScans: connections.list || [] });
    } catch (error) {
      console.error('Load recent scans error:', error);
    }
  },

  closeResult() {
    this.setData({ 
      showResult: false,
      scanning: true
    });
  },

  goToMerchantDetail(e) {
    const merchantId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/merchant-detail/merchant-detail?merchantId=${merchantId}`
    });
    this.closeResult();
  },

  goToConnections() {
    wx.switchTab({
      url: '/pages/connections/connections'
    });
  }
});
