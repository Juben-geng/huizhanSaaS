const app = getApp();

Page({
  data: {
    currentExhibition: {},
    recommendations: [],
    liveRooms: [],
    activities: [],
    statistics: {
      totalConnections: 0,
      scanCount: 0,
      score: 0
    }
  },

  onLoad(options) {
    this.loadData();
  },

  onShow() {
    this.loadRecommendations();
  },

  async loadData() {
    try {
      const exhibitionId = options.exhibitionId || app.globalData.exhibitionId;
      
      if (exhibitionId) {
        app.joinExhibition(exhibitionId);
        this.setData({ exhibitionId });
      }

      await Promise.all([
        this.loadExhibitionInfo(),
        this.loadRecommendations(),
        this.loadLiveRooms(),
        this.loadActivities(),
        this.loadStatistics()
      ]);
    } catch (error) {
      console.error('Load data error:', error);
    }
  },

  async loadExhibitionInfo() {
    try {
      const exhibitionInfo = await app.request({
        url: '/exhibition/detail',
        method: 'GET',
        data: {
          exhibitionId: this.data.exhibitionId || 'default'
        }
      });
      
      this.setData({ currentExhibition: exhibitionInfo });
    } catch (error) {
      console.error('Load exhibition error:', error);
    }
  },

  async loadRecommendations() {
    try {
      const recommendations = await app.request({
        url: '/ai/list',
        method: 'GET',
        data: {
          userId: app.globalData.userInfo.userId,
          exhibitionId: this.data.exhibitionId,
          pageNum: 1,
          pageSize: 5
        }
      });

      this.setData({ recommendations: recommendations.list || [] });
    } catch (error) {
      console.error('Load recommendations error:', error);
    }
  },

  async loadLiveRooms() {
    try {
      const liveRooms = await app.request({
        url: '/virtual-room/list',
        method: 'GET',
        data: {
          exhibitionId: this.data.exhibitionId,
          roomType: 'live',
          pageNum: 1,
          pageSize: 3
        }
      });

      this.setData({ liveRooms: liveRooms.list || [] });
    } catch (error) {
      console.error('Load live rooms error:', error);
    }
  },

  async loadActivities() {
    try {
      const activities = await app.request({
        url: '/admin/dashboard',
        method: 'GET',
        data: {
          exhibitionId: this.data.exhibitionId
        }
      });

      this.setData({ activities: activities.activities?.list || [] });
    } catch (error) {
      console.error('Load activities error:', error);
    }
  },

  async loadStatistics() {
    try {
      const userInfo = await app.request({
        url: '/user/profile',
        method: 'GET',
        data: {
          userId: app.globalData.userInfo.userId
        }
      });

      this.setData({
        statistics: {
          totalConnections: userInfo.connectionCount,
          scanCount: userInfo.scanCount,
          score: userInfo.score
        }
      });
    } catch (error) {
      console.error('Load statistics error:', error);
    }
  },

  goToScan() {
    wx.navigateTo({
      url: '/pages/scan/scan'
    });
  },

  goToVirtualRoom() {
    wx.switchTab({
      url: '/pages/virtual-room/virtual-room'
    });
  },

  goToRecommend() {
    wx.navigateTo({
      url: '/pages/recommend/recommend'
    });
  },

  goToConnections() {
    wx.switchTab({
      url: '/pages/connections/connections'
    });
  },

  goToMerchantDetail(e) {
    const merchantId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/merchant-detail/merchant-detail?merchantId=${merchantId}`
    });
  },

  goToLiveRoom(e) {
    const roomId = e.currentTarget.dataset.roomId;
    wx.navigateTo({
      url: `/pages/live-room/live-room?roomId=${roomId}`
    });
  },

  goToActivity(e) {
    const activityId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/activity-detail/activity-detail?activityId=${activityId}`
    });
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
