const express = require('express');
const router = express.Router();
const { User, Exhibition, Connection, Material, UserPreference } = require('../models');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'exhibition-saas-secret-key';

router.post('/wechat/login', async (req, res) => {
  try {
    const { code, encryptedData, iv } = req.body;

    const userId = uuidv4();
    const user = await User.create({
      userId,
      openid: code,
      lastLoginAt: new Date()
    });

    const token = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      code: 200,
      msg: '登录成功',
      data: {
        userId: user.userId,
        token,
        isNewUser: true
      }
    });
  } catch (error) {
    req.logger.error('Login error:', error);
    res.status(500).json({
      code: 500,
      msg: '登录失败',
      data: null
    });
  }
});

router.post('/sign', async (req, res) => {
  try {
    const { userId, company, position, isOnline } = req.body;

    const user = await User.findOne({ where: { userId } });
    if (!user) {
      return res.status(404).json({
        code: 404,
        msg: '用户不存在',
        data: null
      });
    }

    await user.update({
      company,
      position,
      isOnline: isOnline || false
    });

    const exhibition = await Exhibition.findOne({ 
      where: { id: user.exhibitionId } 
    });

    await exhibition.increment('currentUsers');

    res.json({
      code: 200,
      msg: '签到成功',
      data: {
        userId: user.userId,
        exhibitionId: user.exhibitionId,
        isOnline: user.isOnline
      }
    });
  } catch (error) {
    req.logger.error('Sign error:', error);
    res.status(500).json({
      code: 500,
      msg: '签到失败',
      data: null
    });
  }
});

router.post('/scan/connect', async (req, res) => {
  try {
    const { userId, qrCode, longitude, latitude } = req.body;

    const merchant = await Merchant.findOne({ where: { qrCode } });
    if (!merchant) {
      return res.status(404).json({
        code: 404,
        msg: '商家不存在',
        data: null
      });
    }

    const user = await User.findOne({ where: { userId } });
    if (!user) {
      return res.status(404).json({
        code: 404,
        msg: '用户不存在',
        data: null
      });
    }

    const existingConnection = await Connection.findOne({
      where: {
        userId: user.id,
        merchantId: merchant.id,
        createdAt: {
          [Op.gte]: new Date(Date.now() - 3 * 60 * 1000)
        }
      }
    });

    if (existingConnection) {
      return res.json({
        code: 400,
        msg: '短时间内重复扫码',
        data: null
      });
    }

    const connection = await Connection.create({
      connectionId: uuidv4(),
      userId: user.id,
      merchantId: merchant.id,
      latitude,
      longitude,
      scanType: 'user_scan'
    });

    await user.increment('connectionCount');
    await user.update({ lastScanTime: new Date() });
    await merchant.increment('connectionCount');

    const materials = await Material.findAll({
      where: { merchantId: merchant.id },
      order: [['sortOrder', 'ASC']]
    });

    req.io.to(`exhibition-${user.exhibitionId}`).emit('new-connection', {
      merchantId: merchant.merchantId,
      userId: user.userId,
      timestamp: connection.scanTime
    });

    res.json({
      code: 200,
      msg: '建联成功',
      data: {
        connectionId: connection.connectionId,
        merchant: {
          merchantId: merchant.merchantId,
          merchantName: merchant.merchantName,
          industry: merchant.industry,
          boothNumber: merchant.boothNumber
        },
        materials: materials.map(m => ({
          materialId: m.materialId,
          title: m.title,
          fileType: m.fileType,
          fileUrl: m.fileUrl,
          thumbnailUrl: m.thumbnailUrl
        }))
      }
    });
  } catch (error) {
    req.logger.error('Scan connect error:', error);
    res.status(500).json({
      code: 500,
      msg: '建联失败',
      data: null
    });
  }
});

router.get('/connect/list', async (req, res) => {
  try {
    const { userId, pageNum = 1, pageSize = 10, industry, intentionLevel } = req.query;

    const user = await User.findOne({ where: { userId } });
    if (!user) {
      return res.status(404).json({
        code: 404,
        msg: '用户不存在',
        data: null
      });
    }

    const where = { userId: user.id, status: 1 };
    if (intentionLevel) {
      where.intentionLevel = intentionLevel;
    }

    const { count, rows } = await Connection.findAndCountAll({
      where,
      include: [{
        model: Merchant,
        where: industry ? { industry } : undefined,
        attributes: ['merchantId', 'merchantName', 'industry', 'logo', 'boothNumber', 'contactPhone']
      }],
      order: [['scanTime', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(pageNum) - 1) * parseInt(pageSize)
    });

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        total: count,
        list: rows.map(conn => ({
          connectionId: conn.connectionId,
          merchant: conn.Merchant,
          scanTime: conn.scanTime,
          intentionLevel: conn.intentionLevel,
          materialViewed: conn.materialViewed
        }))
      }
    });
  } catch (error) {
    req.logger.error('Get connect list error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取建联列表失败',
      data: null
    });
  }
});

router.get('/material/list', async (req, res) => {
  try {
    const { userId, pageNum = 1, pageSize = 10 } = req.query;

    const user = await User.findOne({ where: { userId } });
    if (!user) {
      return res.status(404).json({
        code: 404,
        msg: '用户不存在',
        data: null
      });
    }

    const { count, rows } = await Connection.findAndCountAll({
      where: { userId: user.id },
      include: [{
        model: Merchant,
        include: [{
          model: Material,
          attributes: ['materialId', 'title', 'fileType', 'fileUrl', 'thumbnailUrl']
        }]
      }],
      order: [['scanTime', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(pageNum) - 1) * parseInt(pageSize)
    });

    const materials = [];
    rows.forEach(conn => {
      if (conn.Merchant && conn.Merchant.Materials) {
        conn.Merchant.Materials.forEach(mat => {
          materials.push({
            ...mat.toJSON(),
            merchantName: conn.Merchant.merchantName,
            merchantId: conn.Merchant.merchantId
          });
        });
      }
    });

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        total: materials.length,
        list: materials
      }
    });
  } catch (error) {
    req.logger.error('Get material list error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取物料列表失败',
      data: null
    });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const { userId } = req.query;

    const user = await User.findOne({ where: { userId } });
    if (!user) {
      return res.status(404).json({
        code: 404,
        msg: '用户不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        userId: user.userId,
        nickname: user.nickname,
        avatar: user.avatar,
        company: user.company,
        position: user.position,
        score: user.score,
        scanCount: user.scanCount,
        connectionCount: user.connectionCount,
        isOnline: user.isOnline,
        privacyEnabled: user.privacyEnabled,
        aiRecommendEnabled: user.aiRecommendEnabled,
        offlineModeEnabled: user.offlineModeEnabled
      }
    });
  } catch (error) {
    req.logger.error('Get profile error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取用户信息失败',
      data: null
    });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { userId, nickname, avatar, company, position, privacyEnabled, aiRecommendEnabled, offlineModeEnabled } = req.body;

    const user = await User.findOne({ where: { userId } });
    if (!user) {
      return res.status(404).json({
        code: 404,
        msg: '用户不存在',
        data: null
      });
    }

    const updateData = {};
    if (nickname !== undefined) updateData.nickname = nickname;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (company !== undefined) updateData.company = company;
    if (position !== undefined) updateData.position = position;
    if (privacyEnabled !== undefined) updateData.privacyEnabled = privacyEnabled;
    if (aiRecommendEnabled !== undefined) updateData.aiRecommendEnabled = aiRecommendEnabled;
    if (offlineModeEnabled !== undefined) updateData.offlineModeEnabled = offlineModeEnabled;

    await user.update(updateData);

    res.json({
      code: 200,
      msg: '更新成功',
      data: {
        userId: user.userId,
        ...updateData
      }
    });
  } catch (error) {
    req.logger.error('Update profile error:', error);
    res.status(500).json({
      code: 500,
      msg: '更新用户信息失败',
      data: null
    });
  }
});

module.exports = router;
