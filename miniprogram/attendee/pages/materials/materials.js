const app = getApp();

Page({
  data: {
    activeTab: 'all',
    searchKeyword: '',
    materials: [],
    showPreview: false,
    currentMaterial: {},
    pageNum: 1,
    pageSize: 20,
    hasMore: true,
    loading: false
  },

  onLoad() {
    this.loadMaterials();
  },

  onShow() {
    if (this.data.materials.length > 0) {
      this.loadMaterials(true);
    }
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreMaterials();
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ 
      activeTab: tab,
      pageNum: 1,
      hasMore: true
    });
    this.loadMaterials();
  },

  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value,
      pageNum: 1,
      hasMore: true
    });
    this.loadMaterials();
  },

  async loadMaterials(refresh = false) {
    if (this.data.loading) return;

    this.setData({ loading: true });

    try {
      const result = await app.request({
        url: '/user/materials/list',
        method: 'GET',
        data: {
          userId: app.globalData.userInfo.userId,
          materialType: this.data.activeTab === 'all' ? undefined : this.data.activeTab,
          keyword: this.data.searchKeyword || undefined,
          pageNum: this.data.pageNum,
          pageSize: this.data.pageSize
        }
      });

      const materials = result.list.map(material => ({
        ...material,
        materialTypeText: this.getMaterialTypeText(material.materialType),
        getDate: this.formatDate(material.createdAt),
        fileSize: this.formatFileSize(material.fileSize)
      }));

      this.setData({
        materials: refresh ? materials : [...this.data.materials, ...materials],
        hasMore: materials.length >= this.data.pageSize,
        loading: false
      });
    } catch (error) {
      console.error('Load materials error:', error);
      this.setData({ loading: false });
    }
  },

  async loadMoreMaterials() {
    this.setData({
      pageNum: this.data.pageNum + 1
    });
    await this.loadMaterials();
  },

  viewMaterial(e) {
    const material = e.currentTarget.dataset.material;
    this.setData({
      showPreview: true,
      currentMaterial: {
        ...material,
        materialTypeText: this.getMaterialTypeText(material.materialType),
        getDate: this.formatDate(material.createdAt),
        fileSize: this.formatFileSize(material.fileSize)
      }
    });
  },

  closePreview() {
    this.setData({ showPreview: false });
  },

  async downloadMaterial(e) {
    const url = e.currentTarget.dataset.url;
    await this.downloadFile(url);
  },

  async downloadCurrentMaterial() {
    await this.downloadFile(this.data.currentMaterial.fileUrl);
  },

  async downloadFile(url) {
    try {
      wx.showLoading({ title: '下载中...' });

      const downloadTask = wx.downloadFile({
        url,
        success: (res) => {
          if (res.statusCode === 200) {
            wx.saveFile({
              tempFilePath: res.tempFilePath,
              success: (saveRes) => {
                wx.showToast({
                  title: '下载成功',
                  icon: 'success'
                });
              },
              fail: () => {
                wx.showToast({
                  title: '保存失败',
                  icon: 'none'
                });
              }
            });
          } else {
            wx.showToast({
              title: '下载失败',
              icon: 'none'
            });
          }
        },
        fail: () => {
          wx.showToast({
            title: '下载失败',
            icon: 'none'
          });
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    } catch (error) {
      console.error('Download error:', error);
      wx.hideLoading();
      wx.showToast({
        title: '下载失败',
        icon: 'none'
      });
    }
  },

  stopPropagation() {},

  getMaterialTypeText(type) {
    const typeMap = {
      'image': '图片',
      'video': '视频',
      'document': '文档'
    };
    return typeMap[type] || '其他';
  },

  formatDate(date) {
    const now = new Date(date);
    return now.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  },

  formatFileSize(bytes) {
    if (!bytes) return '0B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + sizes[i];
  },

  onPullDownRefresh() {
    this.setData({
      pageNum: 1,
      hasMore: true
    });
    this.loadMaterials().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
