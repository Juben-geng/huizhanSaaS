const app = getApp();

Page({
  data: {
    activeTab: 'all',
    searchKeyword: '',
    connections: [],
    showDetail: false,
    currentConnection: {},
    statistics: {
      totalConnections: 0,
      todayConnections: 0,
      scanCount: 0
    },
    pageNum: 1,
    pageSize: 20,
    hasMore: true,
    loading: false
  },

  onLoad() {
    this.loadStatistics();
    this.loadConnections();
  },

  onShow() {
    if (this.data.connections.length > 0) {
      this.loadConnections(true);
    }
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreConnections();
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ 
      activeTab: tab,
      pageNum: 1,
      hasMore: true
    });
    this.loadConnections();
  },

  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value,
      pageNum: 1,
      hasMore: true
    });
    this.loadConnections();
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

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayConnections = await app.request({
        url: '/user/connect/list',
        method: 'GET',
        data: {
          userId: app.globalData.userInfo.userId,
          startTime: today.toISOString(),
          pageNum: 1,
          pageSize: 1
        }
      });

      this.setData({
        statistics: {
          totalConnections: userInfo.connectionCount,
          todayConnections: todayConnections.total || 0,
          scanCount: userInfo.scanCount
        }
      });
    } catch (error) {
      console.error('Load statistics error:', error);
    }
  },

  async loadConnections(refresh = false) {
    if (this.data.loading) return;

    this.setData({ loading: true });

    try {
      let startTime;
      if (this.data.activeTab === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        startTime = today.toISOString();
      } else if (this.data.activeTab === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        startTime = weekAgo.toISOString();
      }

      const result = await app.request({
        url: '/user/connect/list',
        method: 'GET',
        data: {
          userId: app.globalData.userInfo.userId,
          startTime,
          endTime: undefined,
          isFavorite: this.data.activeTab === 'favorite' ? true : undefined,
          keyword: this.data.searchKeyword || undefined,
          pageNum: this.data.pageNum,
          pageSize: this.data.pageSize
        }
      });

      const connections = result.list.map(conn => ({
        ...conn,
        connectTime: this.formatDate(conn.createdAt),
        materials: conn.materials || [],
        materialCount: conn.materials?.length || 0
      }));

      this.setData({
        connections: refresh ? connections : [...this.data.connections, ...connections],
        hasMore: connections.length >= this.data.pageSize,
        loading: false
      });
    } catch (error) {
      console.error('Load connections error:', error);
      this.setData({ loading: false });
    }
  },

  async loadMoreConnections() {
    this.setData({
      pageNum: this.data.pageNum + 1
    });
    await this.loadConnections();
  },

  async toggleFavorite(e) {
    const { id, favorite } = e.currentTarget.dataset;
    const newFavorite = !favorite;

    try {
      await app.request({
        url: '/user/connect/favorite',
        method: 'POST',
        data: {
          connectionId: id,
          isFavorite: newFavorite
        }
      });

      const connections = this.data.connections.map(conn => 
        conn.connectionId === id ? { ...conn, isFavorite: newFavorite } : conn
      );

      this.setData({ connections });
    } catch (error) {
      console.error('Toggle favorite error:', error);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  },

  stopPropagation() {},

  async goToConnectionDetail(e) {
    const connectionId = e.currentTarget.dataset.id;

    try {
      const connectionDetail = await app.request({
        url: '/user/connect/detail',
        method: 'GET',
        data: { connectionId }
      });

      this.setData({
        showDetail: true,
        currentConnection: {
          ...connectionDetail,
          connectTime: this.formatDate(connectionDetail.createdAt),
          materials: connectionDetail.materials || []
        }
      });
    } catch (error) {
      console.error('Load connection detail error:', error);
    }
  },

  closeDetail() {
    this.setData({ showDetail: false });
  },

  viewMaterial(e) {
    const material = e.currentTarget.dataset.material;
    wx.navigateTo({
      url: `/pages/material-viewer/material-viewer?materialId=${material.materialId}`
    });
  },

  onRemarkChange(e) {
    this.setData({
      'currentConnection.remark': e.detail.value
    });
  },

  async saveRemark() {
    try {
      await app.request({
        url: '/user/connect/remark',
        method: 'POST',
        data: {
          connectionId: this.data.currentConnection.connectionId,
          remark: this.data.currentConnection.remark
        }
      });

      wx.showToast({
        title: '备注已保存',
        icon: 'success'
      });
    } catch (error) {
      console.error('Save remark error:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  callContact() {
    const phone = this.data.currentConnection.contactPhone;
    if (phone) {
      wx.makePhoneCall({
        phoneNumber: phone
      });
    }
  },

  shareMerchant() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  goToScan() {
    wx.navigateTo({
      url: '/pages/scan/scan'
    });
  },

  formatDate(date) {
    const now = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (now.toDateString() === today.toDateString()) {
      return now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (now.toDateString() === yesterday.toDateString()) {
      return '昨天 ' + now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else {
      return now.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    }
  },

  onPullDownRefresh() {
    this.setData({
      pageNum: 1,
      hasMore: true
    });
    this.loadStatistics();
    this.loadConnections().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
