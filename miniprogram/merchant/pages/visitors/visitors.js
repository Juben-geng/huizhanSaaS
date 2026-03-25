const app = getApp();

Page({
  data: {
    visitors: [],
    searchKeyword: '',
    activeFilters: [],
    showFilterModal: false,
    filterParams: {
      timeRange: 'all',
      industry: '',
      favorited: ''
    },
    pageNum: 1,
    pageSize: 20,
    hasMore: true,
    loading: false
  },

  onLoad() {
    this.loadVisitors();
  },

  onShow() {
    if (this.data.visitors.length > 0) {
      this.loadVisitors(true);
    }
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreVisitors();
    }
  },

  async loadVisitors(refresh = false) {
    if (this.data.loading) return;

    this.setData({ loading: true });

    try {
      const result = await app.request({
        url: '/merchant/visitors',
        method: 'GET',
        data: {
          merchantId: app.globalData.merchantInfo.merchantId,
          keyword: this.data.searchKeyword || undefined,
          timeRange: this.data.filterParams.timeRange === 'all' ? undefined : this.data.filterParams.timeRange,
          industry: this.data.filterParams.industry || undefined,
          favorited: this.data.filterParams.favorited || undefined,
          pageNum: this.data.pageNum,
          pageSize: this.data.pageSize
        }
      });

      const visitors = result.list.map(visitor => ({
        ...visitor,
        scanTime: this.formatTime(visitor.createdAt),
        tags: this.parseTags(visitor.tags)
      }));

      this.setData({
        visitors: refresh ? visitors : [...this.data.visitors, ...visitors],
        hasMore: visitors.length >= this.data.pageSize,
        loading: false
      });
    } catch (error) {
      console.error('Load visitors error:', error);
      this.setData({ loading: false });
    }
  },

  async loadMoreVisitors() {
    this.setData({
      pageNum: this.data.pageNum + 1
    });
    await this.loadVisitors();
  },

  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value,
      pageNum: 1,
      hasMore: true
    });
    this.loadVisitors();
  },

  showFilterModal() {
    this.setData({ showFilterModal: true });
  },

  closeFilterModal() {
    this.setData({ showFilterModal: false });
  },

  selectTimeRange(e) {
    const range = e.currentTarget.dataset.range;
    this.setData({
      'filterParams.timeRange': range
    });
  },

  selectIndustry(e) {
    const industry = e.currentTarget.dataset.industry;
    this.setData({
      'filterParams.industry': industry
    });
  },

  selectFavorited(e) {
    const favorited = e.currentTarget.dataset.favorited;
    this.setData({
      'filterParams.favorited': favorited
    });
  },

  resetFilters() {
    this.setData({
      filterParams: {
        timeRange: 'all',
        industry: '',
        favorited: ''
      }
    });
  },

  async applyFilters() {
    const filters = [];
    if (this.data.filterParams.timeRange !== 'all') {
      filters.push({ key: 'timeRange', label: this.getTimeRangeLabel(this.data.filterParams.timeRange) });
    }
    if (this.data.filterParams.industry) {
      filters.push({ key: 'industry', label: this.data.filterParams.industry });
    }
    if (this.data.filterParams.favorited) {
      filters.push({ key: 'favorited', label: this.data.filterParams.favorited === 'true' ? '已收藏' : '未收藏' });
    }

    this.setData({
      activeFilters: filters,
      showFilterModal: false,
      pageNum: 1,
      hasMore: true
    });

    await this.loadVisitors(true);
  },

  removeFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    const updatedFilters = this.data.activeFilters.filter(f => f.key !== filter.key);

    if (filter.key === 'timeRange') {
      this.setData({ 'filterParams.timeRange': 'all' });
    } else if (filter.key === 'industry') {
      this.setData({ 'filterParams.industry': '' });
    } else if (filter.key === 'favorited') {
      this.setData({ 'filterParams.favorited': '' });
    }

    this.setData({ 
      activeFilters: updatedFilters,
      pageNum: 1,
      hasMore: true
    });

    this.loadVisitors(true);
  },

  clearFilters() {
    this.setData({
      activeFilters: [],
      filterParams: {
        timeRange: 'all',
        industry: '',
        favorited: ''
      },
      pageNum: 1,
      hasMore: true
    });

    this.loadVisitors(true);
  },

  goToDetail(e) {
    const connectionId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/visitor-detail/visitor-detail?connectionId=${connectionId}`
    });
  },

  async toggleFavorite(e) {
    const { id, favorited } = e.currentTarget.dataset;
    
    try {
      await app.request({
        url: '/merchant/toggle-favorite',
        method: 'POST',
        data: {
          connectionId: id,
          favorited: !favorited
        }
      });

      const visitors = this.data.visitors.map(visitor => {
        if (visitor.connectionId === id) {
          return { ...visitor, favorited: !favorited };
        }
        return visitor;
      });

      this.setData({ visitors });
    } catch (error) {
      console.error('Toggle favorite error:', error);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  },

  sendMessage(e) {
    const userId = e.currentTarget.dataset.userId;
    wx.navigateTo({
      url: `/pages/chat/chat?userId=${userId}`
    });
  },

  viewMaterials(e) {
    const userId = e.currentTarget.dataset.userId;
    wx.navigateTo({
      url: `/pages/user-materials/user-materials?userId=${userId}`
    });
  },

  stopPropagation() {},

  parseTags(tags) {
    if (!tags) return [];
    try {
      return JSON.parse(tags);
    } catch {
      return [];
    }
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

  getTimeRangeLabel(range) {
    const labels = {
      'today': '今天',
      'week': '本周',
      'month': '本月'
    };
    return labels[range] || range;
  },

  onPullDownRefresh() {
    this.setData({
      pageNum: 1,
      hasMore: true
    });
    this.loadVisitors(true).then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
