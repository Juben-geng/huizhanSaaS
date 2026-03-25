const app = getApp();

Page({
  data: {
    boothInfo: {
      boothNumber: '',
      boothName: '',
      hall: '',
      floor: '',
      area: '',
      coverImage: '',
      images: [],
      description: ''
    },
    showEditModal: false,
    showQRModal: false,
    qrCodeUrl: '',
    editForm: {
      boothNumber: '',
      boothName: '',
      hall: '',
      floor: '',
      area: ''
    }
  },

  onLoad() {
    this.loadBoothInfo();
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

      this.setData({ 
        boothInfo: {
          ...boothInfo,
          images: boothInfo.images ? JSON.parse(boothInfo.images) : []
        }
      });
    } catch (error) {
      console.error('Load booth info error:', error);
    }
  },

  editBooth() {
    this.setData({
      showEditModal: true,
      editForm: {
        boothNumber: this.data.boothInfo.boothNumber,
        boothName: this.data.boothInfo.boothName,
        hall: this.data.boothInfo.hall,
        floor: this.data.boothInfo.floor,
        area: this.data.boothInfo.area
      }
    });
  },

  closeEditModal() {
    this.setData({ showEditModal: false });
  },

  onBoothNumberChange(e) {
    this.setData({
      'editForm.boothNumber': e.detail.value
    });
  },

  onBoothNameChange(e) {
    this.setData({
      'editForm.boothName': e.detail.value
    });
  },

  onHallChange(e) {
    this.setData({
      'editForm.hall': e.detail.value
    });
  },

  onFloorChange(e) {
    this.setData({
      'editForm.floor': e.detail.value
    });
  },

  onAreaChange(e) {
    this.setData({
      'editForm.area': e.detail.value
    });
  },

  async saveBoothInfo() {
    try {
      await app.request({
        url: '/merchant/booth/update',
        method: 'POST',
        data: {
          merchantId: app.globalData.merchantInfo.merchantId,
          ...this.data.editForm
        }
      });

      await this.loadBoothInfo();

      this.setData({ showEditModal: false });

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('Save booth info error:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  onDescriptionChange(e) {
    this.setData({
      'boothInfo.description': e.detail.value
    });
  },

  async saveDescription() {
    try {
      await app.request({
        url: '/merchant/booth/update',
        method: 'POST',
        data: {
          merchantId: app.globalData.merchantInfo.merchantId,
          description: this.data.boothInfo.description
        }
      });

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('Save description error:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  uploadBoothImage() {
    wx.chooseImage({
      count: 9 - this.data.boothInfo.images.length,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePaths = res.tempFilePaths;

        wx.showLoading({ title: '上传中...' });

        try {
          const uploadPromises = tempFilePaths.map(filePath => 
            this.uploadImage(filePath)
          );

          const uploadedUrls = await Promise.all(uploadPromises);

          const updatedImages = [...this.data.boothInfo.images, ...uploadedUrls];

          await app.request({
            url: '/merchant/booth/update',
            method: 'POST',
            data: {
              merchantId: app.globalData.merchantInfo.merchantId,
              images: JSON.stringify(updatedImages)
            }
          });

          this.setData({
            'boothInfo.images': updatedImages
          });

          wx.hideLoading();
          wx.showToast({
            title: '上传成功',
            icon: 'success'
          });
        } catch (error) {
          console.error('Upload image error:', error);
          wx.hideLoading();
          wx.showToast({
            title: '上传失败',
            icon: 'none'
          });
        }
      }
    });
  },

  uploadImage(filePath) {
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

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: this.data.boothInfo.images
    });
  },

  shareBooth() {
    wx.showShareMenu({
      withShareTicket: true
    });

    wx.showToast({
      title: '点击右上角分享',
      icon: 'none'
    });
  },

  goToVirtualRoom() {
    wx.navigateTo({
      url: '/pages/virtual-room/virtual-room'
    });
  },

  viewQRCode() {
    this.loadQRCode();
    this.setData({ showQRModal: true });
  },

  async loadQRCode() {
    try {
      const qrCodeData = await app.request({
        url: '/merchant/booth-qr-code',
        method: 'GET',
        data: {
          merchantId: app.globalData.merchantInfo.merchantId
        }
      });

      this.setData({ qrCodeUrl: qrCodeData.qrCodeUrl });
    } catch (error) {
      console.error('Load QR code error:', error);
    }
  },

  closeQRModal() {
    this.setData({ showQRModal: false });
  },

  saveQRCode() {
    wx.downloadFile({
      url: this.data.qrCodeUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.showToast({
                title: '保存成功',
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
        }
      }
    });
  },

  onShareAppMessage() {
    return {
      title: `欢迎参观${this.data.boothInfo.boothNumber} - ${this.data.boothInfo.boothName}`,
      path: `/pages/index/index?merchantId=${app.globalData.merchantInfo.merchantId}`,
      imageUrl: this.data.boothInfo.coverImage
    };
  }
});
