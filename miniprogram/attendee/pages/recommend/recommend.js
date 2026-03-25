const app = getApp();

Page({
  data: {
    recommendations: [],
    preferences: [],
    industries: [],
    allIndustries: ['科技', '制造', '金融', '医疗', '教育', '零售', '物流', '建筑', '能源', '环保'],
    selectedIndustry: '',
    sortBy: 'score',
    showPreferenceModal: false,
    selectedIndustries: [],
    preferenceRemark: '',
    pageNum: 1,
    pageSize: 20,
    hasMore: true,
    loading: false
  },

  onLoad() {
    this.loadPreferences();
    this.loadRecommendations();
    this.loadIndustries();
  },

  onShow() {
    if (this.data.recommendations.length > 0) {
      this.loadRecommendations(true);
    }
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreRecommendations();
    }
  },

  async loadPreferences() {
    try {
      const preferences = await app.request({
        url: '/ai/preference/list',
        method: 'GET',
        data: {
          userId: app.globalData.userInfo.userId
        }
      });

      const industryList = preferences.list?.map(p => p.industry) || [];
      const remark = preferences.list?.find(p => p.remark)?.remark || '';

      this.setData({
        preferences: industryList,
        selectedIndustries: industryList,
        preferenceRemark: remark
      });
    } catch (error) {
      console.error('Load preferences error:', error);
    }
  },

  async loadRecommendations(refresh = false) {
    if (this.data.loading) return;

    this.setData({ loading: true });

    try {
      const result = await app.request({
        url: '/ai/list',
        method: 'GET',
        data: {
          userId: app.globalData.userInfo.userId,
          exhibitionId: app.globalData.exhibitionId,
          industry: this.data.selectedIndustry || undefined,
          sortBy: this.data.sortBy,
          pageNum: this.data.pageNum,
          pageSize: this.data.pageSize
        }
      });

      const recommendations = result.list.map(rec => ({
        ...rec,
        reasons: rec.reasons ? rec.reasons.split(',').map(r => r.trim()) : [],
        merchant: rec.merchant || {}
      }));

      this.setData({
        recommendations: refresh ? recommendations : [...this.data.recommendations, ...recommendations],
        hasMore: recommendations.length >= this.data.pageSize,
        loading: false
      });
    } catch (error) {
      console.error('Load recommendations error:', error);
      this.setData({ loading: false });
    }
  },

  async loadIndustries() {
    try {
      const result = await app.request({
        url: '/exhibition/industries',
        method: 'GET',
        data: {
          exhibitionId: app.globalData.exhibitionId
        }
      });

      this.setData({ industries: result.industries || [] });
    } catch (error) {
      console.error('Load industries error:', error);
    }
  },

  async loadMoreRecommendations() {
    this.setData({
      pageNum: this.data.pageNum + 1
    });
    await this.loadRecommendations();
  },

  selectIndustry(e) {
    const industry = e.currentTarget.dataset.industry;
    this.setData({ 
      selectedIndustry: industry,
      pageNum: 1,
      hasMore: true
    });
    this.loadRecommendations();
  },

  sortRecommendations(e) {
    const sort = e.currentTarget.dataset.sort;
    this.setData({ 
      sortBy: sort,
      pageNum: 1,
      hasMore: true
    });
    this.loadRecommendations();
  },

  async markViewed(e) {
    const recommendationId = e.currentTarget.dataset.id;

    try {
      await app.request({
        url: '/ai/viewed',
        method: 'POST',
        data: {
          recommendationId
        }
      });

      const recommendations = this.data.recommendations.filter(
        rec => rec.recommendationId !== recommendationId
      );

      this.setData({ recommendations });

      wx.showToast({
        title: '已标记为已查看',
        icon: 'success'
      });
    } catch (error) {
      console.error('Mark viewed error:', error);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  },

  goToMerchantDetail(e) {
    const merchantId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/merchant-detail/merchant-detail?merchantId=${merchantId}`
    });
  },

  stopPropagation() {},

  editPreferences() {
    this.setData({ showPreferenceModal: true });
  },

  closePreferenceModal() {
    this.setData({ showPreferenceModal: false });
  },

  toggleIndustry(e) {
    const industry = e.currentTarget.dataset.industry;
    const selectedIndustries = [...this.data.selectedIndustries];
    const index = selectedIndustries.indexOf(industry);

    if (index > -1) {
      selectedIndustries.splice(index, 1);
    } else {
      selectedIndustries.push(industry);
    }

    this.setData({ selectedIndustries });
  },

  onRemarkChange(e) {
    this.setData({ preferenceRemark: e.detail.value });
  },

  async savePreferences() {
    try {
      for (const industry of this.data.selectedIndustries) {
        await app.request({
          url: '/ai/preference/save',
          method: 'POST',
          data: {
            userId: app.globalData.userInfo.userId,
            industry,
            remark: this.data.preferenceRemark
          }
        });
      }

      this.setData({
        preferences: this.data.selectedIndustries,
        showPreferenceModal: false
      });

      wx.showToast({
        title: '偏好已保存',
        icon: 'success'
      });

      this.loadRecommendations(true);
    } catch (error) {
      console.error('Save preferences error:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  onPullDownRefresh() {
    this.setData({
      pageNum: 1,
      hasMore: true
    });
    this.loadRecommendations().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
