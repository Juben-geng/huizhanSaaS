const app = getApp();

Page({
  data: {
    activeTab: 'all',
    searchKeyword: '',
    rooms: [],
    showRoomDetail: false,
    currentRoom: {},
    pageNum: 1,
    pageSize: 20,
    hasMore: true,
    loading: false
  },

  onLoad(options) {
    this.loadRooms();
  },

  onShow() {
    if (this.data.rooms.length > 0) {
      this.loadRooms(true);
    }
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreRooms();
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ 
      activeTab: tab,
      pageNum: 1,
      hasMore: true
    });
    this.loadRooms();
  },

  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value,
      pageNum: 1,
      hasMore: true
    });
    this.loadRooms();
  },

  async loadRooms(refresh = false) {
    if (this.data.loading) return;

    this.setData({ loading: true });

    try {
      const roomType = this.data.activeTab === 'all' ? undefined : this.data.activeTab;
      
      const result = await app.request({
        url: '/virtual-room/list',
        method: 'GET',
        data: {
          exhibitionId: app.globalData.exhibitionId,
          roomType,
          pageNum: this.data.pageNum,
          pageSize: this.data.pageSize
        }
      });

      const rooms = result.list.map(room => ({
        ...room,
        roomImages: room.roomImages || [],
        statusText: room.status === 'live' ? '直播中' : room.status === 'active' ? '开放中' : '已关闭'
      }));

      this.setData({
        rooms: refresh ? rooms : rooms,
        hasMore: rooms.length >= this.data.pageSize,
        loading: false
      });
    } catch (error) {
      console.error('Load rooms error:', error);
      this.setData({ loading: false });
    }
  },

  async loadMoreRooms() {
    this.setData({
      pageNum: this.data.pageNum + 1
    });
    await this.loadRooms();
  },

  async enterRoom(e) {
    const roomId = e.currentTarget.dataset.roomId;

    try {
      const roomDetail = await app.request({
        url: '/virtual-room/detail',
        method: 'GET',
        data: { roomId }
      });

      await app.request({
        url: '/ai/preference/view-material',
        method: 'POST',
        data: {
          userId: app.globalData.userInfo.userId,
          materialId: roomId,
          industry: roomDetail.merchant.industry
        }
      });

      app.joinRoom(roomId);

      this.setData({
        showRoomDetail: true,
        currentRoom: {
          ...roomDetail,
          roomImages: roomDetail.roomImages || [],
          merchant: roomDetail.merchant || {}
        }
      });
    } catch (error) {
      console.error('Enter room error:', error);
      wx.showToast({
        title: '进入展位失败',
        icon: 'none'
      });
    }
  },

  closeDetail() {
    app.leaveRoom(this.data.currentRoom.roomId);
    this.setData({ showRoomDetail: false });
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    const urls = this.data.currentRoom.roomImages;
    wx.previewImage({
      current: url,
      urls
    });
  },

  startChat() {
    const roomId = this.data.currentRoom.roomId;
    wx.navigateTo({
      url: `/pages/chat/chat?roomId=${roomId}&merchantId=${this.data.currentRoom.merchant.merchantId}`
    });
  },

  joinLive() {
    const liveUrl = this.data.currentRoom.liveUrl;
    if (liveUrl) {
      wx.navigateTo({
        url: `/pages/live-player/live-player?url=${encodeURIComponent(liveUrl)}`
      });
    }
  },

  onPullDownRefresh() {
    this.setData({
      pageNum: 1,
      hasMore: true
    });
    this.loadRooms().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
