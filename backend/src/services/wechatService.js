const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

class WeChatService {
  constructor() {
    this.tokenCache = {
      access_token: null,
      expiresAt: null
    };
  }

  async getAccessToken() {
    const appId = process.env.WECHAT_APPID;
    const appSecret = process.env.WECHAT_APPSECRET;

    if (!appId || !appSecret) {
      throw new Error('微信小程序AppID或AppSecret未配置');
    }

    if (this.tokenCache.access_token && this.tokenCache.expiresAt > Date.now()) {
      return this.tokenCache.access_token;
    }

    const url = 'https://api.weixin.qq.com/cgi-bin/stable_token';

    try {
      const response = await axios.post(url, {
        grant_type: 'client_credential',
        appid: appId,
        secret: appSecret,
        force_refresh: false
      });

      if (response.data.errcode && response.data.errcode !== 0) {
        throw new Error(`获取access_token失败: ${response.data.errmsg}`);
      }

      this.tokenCache = {
        access_token: response.data.access_token,
        expiresAt: Date.now() + (response.data.expires_in - 300) * 1000
      };

      return this.tokenCache.access_token;
    } catch (error) {
      throw new Error(`获取access_token失败: ${error.message}`);
    }
  }

  async getUnlimitedQRCode(scene, page, width = 430, checkPath = true, envVersion = 'release') {
    const accessToken = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`;

    try {
      const response = await axios.post(url, {
        scene,
        page,
        width,
        check_path: checkPath,
        env_version: envVersion
      }, {
        responseType: 'arraybuffer'
      });

      if (response.data.errcode) {
        throw new Error(`生成小程序码失败: ${response.data.errmsg}`);
      }

      return response.data;
    } catch (error) {
      throw new Error(`生成小程序码失败: ${error.message}`);
    }
  }

  async uploadCode(zipFilePath, userVersion, userDesc = '') {
    const accessToken = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/wxa/upload?access_token=${accessToken}`;

    if (!fs.existsSync(zipFilePath)) {
      throw new Error(`小程序代码包不存在: ${zipFilePath}`);
    }

    try {
      const form = new FormData();
      form.append('zip', fs.createReadStream(zipFilePath));
      form.append('user_version', userVersion);
      form.append('user_desc', userDesc);

      const response = await axios.post(url, form, {
        headers: {
          ...form.getHeaders()
        }
      });

      if (response.data.errcode && response.data.errcode !== 0) {
        throw new Error(`上传代码失败: ${response.data.errmsg}`);
      }

      return {
        success: true,
        time: response.data.time || Date.now(),
        previewQRCodeUrl: `https://api.weixin.qq.com/wxa/get_qrcode?access_token=${accessToken}`
      };
    } catch (error) {
      throw new Error(`上传代码失败: ${error.message}`);
    }
  }

  async submitAudit(pageList = [], feedbackInfo = '', feedbackStuff = []) {
    const accessToken = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/wxa/submit_audit?access_token=${accessToken}`;

    try {
      const response = await axios.post(url, {
        item_list: pageList.map(page => ({
          address: page,
          tag: '',
          first_class: '',
          second_class: '',
          first_id: '',
          second_id: ''
        })),
        feedback_info: feedbackInfo,
        feedback_stuff: feedbackStuff
      });

      if (response.data.errcode && response.data.errcode !== 0) {
        throw new Error(`提交审核失败: ${response.data.errmsg}`);
      }

      return {
        success: true,
        auditId: response.data.auditid,
        status: response.data.status
      };
    } catch (error) {
      throw new Error(`提交审核失败: ${error.message}`);
    }
  }

  async getAuditStatus(auditId) {
    const accessToken = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/wxa/get_auditstatus?access_token=${accessToken}`;

    try {
      const response = await axios.post(url, {
        auditid: auditId
      });

      if (response.data.errcode && response.data.errcode !== 0) {
        throw new Error(`获取审核状态失败: ${response.data.errmsg}`);
      }

      return response.data;
    } catch (error) {
      throw new Error(`获取审核状态失败: ${error.message}`);
    }
  }

  async release() {
    const accessToken = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/wxa/release?access_token=${accessToken}`;

    try {
      const response = await axios.post(url, {});

      if (response.data.errcode && response.data.errcode !== 0) {
        throw new Error(`发布失败: ${response.data.errmsg}`);
      }

      return {
        success: true,
        time: response.data.time || Date.now()
      };
    } catch (error) {
      throw new Error(`发布失败: ${error.message}`);
    }
  }

  async rollbackRelease() {
    const accessToken = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/wxa/revertcoderelease?access_token=${accessToken}`;

    try {
      const response = await axios.post(url, {});

      if (response.data.errcode && response.data.errcode !== 0) {
        throw new Error(`回滚失败: ${response.data.errmsg}`);
      }

      return {
        success: true
      };
    } catch (error) {
      throw new Error(`回滚失败: ${error.message}`);
    }
  }

  async getLatestAuditStatus() {
    const accessToken = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/wxa/get_latest_auditstatus?access_token=${accessToken}`;

    try {
      const response = await axios.get(url);

      if (response.data.errcode && response.data.errcode !== 0) {
        throw new Error(`获取最新审核状态失败: ${response.data.errmsg}`);
      }

      return response.data;
    } catch (error) {
      throw new Error(`获取最新审核状态失败: ${error.message}`);
    }
  }

  async getCategory() {
    const accessToken = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/wxa/get_category?access_token=${accessToken}`;

    try {
      const response = await axios.get(url);

      if (response.data.errcode && response.data.errcode !== 0) {
        throw new Error(`获取类目失败: ${response.data.errmsg}`);
      }

      return response.data.category_list || [];
    } catch (error) {
      throw new Error(`获取类目失败: ${error.message}`);
    }
  }

  async getPage() {
    const accessToken = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/wxa/get_page?access_token=${accessToken}`;

    try {
      const response = await axios.get(url);

      if (response.data.errcode && response.data.errcode !== 0) {
        throw new Error(`获取页面列表失败: ${response.data.errmsg}`);
      }

      return response.data.page_list || [];
    } catch (error) {
      throw new Error(`获取页面列表失败: ${error.message}`);
    }
  }
}

module.exports = new WeChatService();
