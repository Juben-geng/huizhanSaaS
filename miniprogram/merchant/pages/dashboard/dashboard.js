const app = getApp();

Page({
  data: {
    merchantInfo: {},
    quotaInfo: {
      used: 0,
      total: 1000,
      remaining: 1000,
      percentage: 0
    },
    stats: {
      todayVisitors: 0,
      totalVisitors: 0,
      materialViews: 0,
      chatMessages: 0
    },
    chartPeriod: 'day',
    chartData: [],
    recentVisitors: [],
    liveRoom: null
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
        this.loadQuotaInfo(),
        this.loadStatistics(),
        this.loadChartData(),
        this.loadRecentVisitors(),
        this.loadLiveRoom()
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

  async loadQuotaInfo() {
    try {
      const quotaInfo = await app.request({
        url: '/quota/info',
        method: 'GET',
        data: {
          merchantId: app.globalData.merchantInfo.merchantId
        }
      });

      const used = quotaInfo.used || 0;
      const total = quotaInfo.total || 1000;
      const remaining = total - used;
      const percentage = total > 0 ? Math.round((used / total) * 100) : 0;

      this.setData({
        quotaInfo: {
          used,
          total,
          remaining,
          percentage
        }
      });
    } catch (error) {
      console.error('Load quota error:', error);
    }
  },

  async loadStatistics() {
    try {
      const stats = await app.request({
        url: '/merchant/statistics',
        method: 'GET',
        data: {
          merchantId: app.globalData.merchantInfo.merchantId
        }
      });

      this.setData({ stats });
    } catch (error) {
      console.error('Load statistics error:', error);
    }
  },

  async loadChartData() {
    try {
      const period = this.data.chartPeriod;
      const chartData = await app.request({
        url: '/merchant/visitor-trend',
        method: 'GET',
        data: {
          merchantId: app.globalData.merchantInfo.merchantId,
          period
        }
      });

      const maxVal = Math.max(...chartData.map(item => item.value), 1);
      const formattedData = chartData.map(item => ({
        label: item.label,
        value: item.value,
        color: item.value >= maxVal * 0.8 ? '#ff6b6b' : '#1890ff'
      }));

      this.setData({ chartData: formattedData });
    } catch (error) {
      console.error('Load chart data error:', error);
    }
  },

  async loadRecentVisitors() {
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

      this.setData({ recentVisitors: formattedVisitors });
    } catch (error) {
      console.error('Load visitors error:', error);
    }
  },

  async loadLiveRoom() {
    try {
      const liveRoom = await app.request({
        url: '/merchant/live-room',
        method: 'GET',
        data: {
          merchantId: app.globalData.merchantInfo.merchantId
        }
      });

      this.setData({ liveRoom });
    } catch (error) {
      console.error('Load live room error:', error);
    }
  },

  switchChartPeriod(e) {
    const period = e.currentTarget.dataset.period;
    this.setData({ chartPeriod: period });
    this.loadChartData();
  },

  goToVisitors() {
    wx.switchTab({
      url: '/pages/visitors/visitors'
    });
  },

  goToVisitorDetail(e) {
    const connectionId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/visitor-detail/visitor-detail?connectionId=${connectionId}`
    });
  },

  sendMessage(e) {
    const userId = e.currentTarget.dataset.userId;
    wx.navigateTo({
      url: `/pages/chat/chat?userId=${userId}`
    });
  },

  stopPropagation() {},

  goToScan() {
    wx.navigateTo({
      url: '/pages/scan/scan'
    });
  },

  goToBooth() {
    wx.switchTab({
      url: '/pages/booth/booth'
    });
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

  manageLive() {
    wx.navigateTo({
      url: `/pages/live-manage/live-manage?roomId=${this.data.liveRoom.roomId}`
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
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
