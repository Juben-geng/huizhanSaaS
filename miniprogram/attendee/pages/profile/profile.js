const app = getApp();

Page({
  data: {
    userInfo: {},
    materialCount: 0,
    favoriteCount: 0,
    activityCount: 0,
    prizeCount: 0,
    signedToday: false,
    signCalendar: [],
    showEditModal: false,
    editForm: {
      nickName: '',
      phoneNumber: '',
      company: '',
      position: ''
    }
  },

  onLoad() {
    this.loadUserInfo();
    this.loadStatistics();
    this.loadSignCalendar();
  },

  onShow() {
    this.loadStatistics();
  },

  async loadUserInfo() {
    try {
      const userInfo = await app.request({
        url: '/user/profile',
        method: 'GET',
        data: {
          userId: app.globalData.userInfo.userId
        }
      });

      this.setData({ 
        userInfo,
        'editForm.nickName': userInfo.nickName || '',
        'editForm.phoneNumber': userInfo.phoneNumber || '',
        'editForm.company': userInfo.company || '',
        'editForm.position': userInfo.position || ''
      });

      app.globalData.userInfo = userInfo;
    } catch (error) {
      console.error('Load user info error:', error);
    }
  },

  async loadStatistics() {
    try {
      const connections = await app.request({
        url: '/user/connect/list',
        method: 'GET',
        data: {
          userId: app.globalData.userInfo.userId,
          pageNum: 1,
          pageSize: 1
        }
      });

      let materialCount = 0;
      let favoriteCount = 0;
      let activityCount = 0;
      let prizeCount = 0;

      materialCount = connections.total || 0;

      const favorites = await app.request({
        url: '/user/connect/list',
        method: 'GET',
        data: {
          userId: app.globalData.userInfo.userId,
          isFavorite: true,
          pageNum: 1,
          pageSize: 1
        }
      });

      favoriteCount = favorites.total || 0;

      const activities = await app.request({
        url: '/admin/dashboard',
        method: 'GET',
        data: {
          exhibitionId: app.globalData.exhibitionId
        }
      });

      activityCount = activities.activities?.total || 0;

      this.setData({
        materialCount,
        favoriteCount,
        activityCount
      });
    } catch (error) {
      console.error('Load statistics error:', error);
    }
  },

  async loadSignCalendar() {
    try {
      const signInfo = await app.request({
        url: '/user/sign-info',
        method: 'GET',
        data: {
          userId: app.globalData.userInfo.userId
        }
      });

      const today = new Date();
      const signCalendar = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        signCalendar.push({
          day: i === 0 ? '今天' : date.getDate() + '日',
          signed: signInfo.signedDates?.includes(dateStr) || false,
          date: dateStr
        });
      }

      this.setData({
        signedToday: signInfo.signedToday || false,
        signCalendar
      });
    } catch (error) {
      console.error('Load sign calendar error:', error);
    }
  },

  async signIn() {
    if (this.data.signedToday) {
      wx.showToast({
        title: '今日已签到',
        icon: 'none'
      });
      return;
    }

    try {
      const result = await app.request({
        url: '/user/sign',
        method: 'POST',
        data: {
          userId: app.globalData.userInfo.userId,
          exhibitionId: app.globalData.exhibitionId,
          location: app.globalData.location
        }
      });

      this.setData({
        signedToday: true,
        'userInfo.signDays': result.signDays,
        'userInfo.score': result.score
      });

      wx.showToast({
        title: '签到成功，获得10积分',
        icon: 'success'
      });

      this.loadSignCalendar();
    } catch (error) {
      console.error('Sign in error:', error);
      wx.showToast({
        title: '签到失败',
        icon: 'none'
      });
    }
  },

  editProfile() {
    this.setData({ showEditModal: true });
  },

  closeEditModal() {
    this.setData({ showEditModal: false });
  },

  onNicknameChange(e) {
    this.setData({ 'editForm.nickName': e.detail.value });
  },

  onPhoneChange(e) {
    this.setData({ 'editForm.phoneNumber': e.detail.value });
  },

  onCompanyChange(e) {
    this.setData({ 'editForm.company': e.detail.value });
  },

  onPositionChange(e) {
    this.setData({ 'editForm.position': e.detail.value });
  },

  async saveProfile() {
    try {
      const result = await app.request({
        url: '/user/profile/update',
        method: 'POST',
        data: {
          userId: app.globalData.userInfo.userId,
          ...this.data.editForm
        }
      });

      this.setData({
        userInfo: result,
        showEditModal: false
      });

      app.globalData.userInfo = result;

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('Save profile error:', error);
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

  goToFavorite() {
    wx.switchTab({
      url: '/pages/connections/connections'
    });
  },

  goToActivities() {
    wx.navigateTo({
      url: '/pages/activities/activities'
    });
  },

  goToPrizes() {
    wx.navigateTo({
      url: '/pages/prizes/prizes'
    });
  },

  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
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

  onPullDownRefresh() {
    this.loadUserInfo();
    this.loadStatistics();
    this.loadSignCalendar();
    wx.stopPullDownRefresh();
  }
});
