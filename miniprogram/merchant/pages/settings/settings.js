const app = getApp();

Page({
  data: {
    merchantInfo: {},
    boothInfo: {},
    quotaInfo: {
      packageName: '',
      used: 0,
      total: 1000,
      percentage: 0,
      visitorQuota: 0,
      materialQuota: 0,
      messageQuota: 0
    },
    notification: {
      newVisitor: true,
      newMessage: true,
      quotaAlert: true
    }
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    if (this.data.merchantInfo.merchantId) {
      this.loadData();
    }
  },

  async loadData() {
    try {
      await Promise.all([
        this.loadMerchantInfo(),
        this.loadBoothInfo(),
        this.loadQuotaInfo(),
        this.loadNotificationSettings()
      ]);
    } catch (error) {
      console.error('Load data error:', error);
    }
  },

  async loadMerchantInfo() {
    try {
      const merchantInfo = await app.request({
        url: '/merchant/detail',
        method: 'GET',
        data: {
          merchantId: app.globalData.merchantInfo.merchantId
        }
      });

      this.setData({ merchantInfo });
      app.globalData.merchantInfo = merchantInfo;
    } catch (error) {
      console.error('Load merchant error:', error);
    }
  },

  async loadBoothInfo() {
    try {
      const boothInfo = await app.request({
        url: '/merchant/booth',
        method: 'GET',
        data: {
          merchantId: app.globalData.merchantInfo.merchantId
        }
      });

      this.setData({ boothInfo });
    } catch (error) {
      console.error('Load booth error:', error);
    }
  },

  async loadQuotaInfo() {
    try {
      const quotaInfo = await app.request({
        url: '/quota/detail',
        method: 'GET',
        data: {
          merchantId: app.globalData.merchantInfo.merchantId
        }
      });

      const used = quotaInfo.used || 0;
      const total = quotaInfo.total || 1000;
      const percentage = total > 0 ? Math.round((used / total) * 100) : 0;

      this.setData({
        quotaInfo: {
          packageName: quotaInfo.packageName || '免费版',
          used,
          total,
          percentage,
          visitorQuota: quotaInfo.visitorQuota || 0,
          materialQuota: quotaInfo.materialQuota || 0,
          messageQuota: quotaInfo.messageQuota || 0
        }
      });
    } catch (error) {
      console.error('Load quota error:', error);
    }
  },

  async loadNotificationSettings() {
    try {
      const settings = await app.request({
        url: '/merchant/notification-settings',
        method: 'GET',
        data: {
          merchantId: app.globalData.merchantInfo.merchantId
        }
      });

      this.setData({ notification: settings });
    } catch (error) {
      console.error('Load notification error:', error);
    }
  },

  chooseLogo() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFilePaths[0];

        wx.showLoading({ title: '上传中...' });

        try {
          const logoUrl = await this.uploadFile(tempFilePath);

          await app.request({
            url: '/merchant/update-logo',
            method: 'POST',
            data: {
              merchantId: app.globalData.merchantInfo.merchantId,
              logoUrl
            }
          });

          this.setData({
            'merchantInfo.logo': logoUrl
          });
          app.globalData.merchantInfo.logo = logoUrl;

          wx.hideLoading();
          wx.showToast({
            title: '上传成功',
            icon: 'success'
          });
        } catch (error) {
          console.error('Upload logo error:', error);
          wx.hideLoading();
          wx.showToast({
            title: '上传失败',
            icon: 'none'
          });
        }
      }
    });
  },

  uploadFile(filePath) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${app.globalData.apiBaseUrl}/upload/image`,
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

  editProfile() {
    wx.navigateTo({
      url: '/pages/edit-profile/edit-profile'
    });
  },

  goToBooth() {
    wx.switchTab({
      url: '/pages/booth/booth'
    });
  },

  upgradePackage() {
    wx.navigateTo({
      url: '/pages/upgrade-package/upgrade-package'
    });
  },

  onNotificationChange(e) {
    const type = e.currentTarget.dataset.type;
    const checked = e.detail.value;

    this.setData({
      [`notification.${type}`]: checked
    });

    this.saveNotificationSettings();
  },

  async saveNotificationSettings() {
    try {
      await app.request({
        url: '/merchant/notification-settings',
        method: 'POST',
        data: {
          merchantId: app.globalData.merchantInfo.merchantId,
          settings: this.data.notification
        }
      });

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('Save notification error:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  goToMaterials() {
    wx.navigateTo({
      url: '/pages/materials/materials'
    });
  },

  goToVirtualRoom() {
    wx.navigateTo({
      url: '/pages/virtual-room/virtual-room'
    });
  },

  goToLiveRoom() {
    wx.navigateTo({
      url: '/pages/live-manage/live-manage'
    });
  },

  goToStatistics() {
    wx.navigateTo({
      url: '/pages/statistics/statistics'
    });
  },

  goToHelp() {
    wx.navigateTo({
      url: '/pages/help/help'
    });
  },

  goToAbout() {
    wx.navigateTo({
      url: '/pages/about/about'
    });
  },

  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          app.globalData.merchantInfo = null;
          app.globalData.token = null;

          wx.reLaunch({
            url: '/pages/index/index'
          });
        }
      }
    });
  }
});
