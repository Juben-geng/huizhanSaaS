const express = require('express');
const router = express.Router();
const { Merchant, Connection, Material, Exhibition, Organizer } = require('../models');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

router.post('/create', async (req, res) => {
  try {
    const { 
      organizerId, exhibitionId, merchantName, industry, 
      description, contactPhone, contactPerson, wechatId,
      boothNumber, boothZone, latitude, longitude 
    } = req.body;

    const merchantId = uuidv4();
    const merchant = await Merchant.create({
      merchantId,
      merchantName,
      industry,
      description,
      contactPhone,
      contactPerson,
      wechatId,
      exhibitionId,
      organizerId,
      boothNumber,
      boothZone,
      latitude,
      longitude
    });

    const qrCodeData = `merchant:${merchantId}`;
    const qrCodeUrl = await QRCode.toDataURL(qrCodeData);

    await merchant.update({ qrCode: qrCodeUrl });

    await Exhibition.increment('currentMerchants', { where: { id: exhibitionId } });

    res.json({
      code: 200,
      msg: '创建成功',
      data: {
        merchantId: merchant.merchantId,
        merchantName: merchant.merchantName,
        qrCode: merchant.qrCode
      }
    });
  } catch (error) {
    req.logger.error('Create merchant error:', error);
    res.status(500).json({
      code: 500,
      msg: '创建商家失败',
      data: null
    });
  }
});

router.get('/list', async (req, res) => {
  try {
    const { exhibitionId, organizerId, pageNum = 1, pageSize = 10, industry, boothZone } = req.query;

    const where = {};
    if (exhibitionId) where.exhibitionId = exhibitionId;
    if (organizerId) where.organizerId = organizerId;
    if (industry) where.industry = industry;
    if (boothZone) where.boothZone = boothZone;

    const { count, rows } = await Merchant.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(pageNum) - 1) * parseInt(pageSize)
    });

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        total: count,
        list: rows.map(m => ({
          merchantId: m.merchantId,
          merchantName: m.merchantName,
          industry: m.industry,
          logo: m.logo,
          boothNumber: m.boothNumber,
          boothZone: m.boothZone,
          visitorCount: m.visitorCount,
          connectionCount: m.connectionCount,
          hasVirtualRoom: m.hasVirtualRoom,
          onlineStatus: m.onlineStatus
        }))
      }
    });
  } catch (error) {
    req.logger.error('Get merchant list error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取商家列表失败',
      data: null
    });
  }
});

router.get('/detail', async (req, res) => {
  try {
    const { merchantId } = req.query;

    const merchant = await Merchant.findOne({ 
      where: { merchantId },
      include: [
        { model: Material },
        { model: Exhibition }
      ]
    });

    if (!merchant) {
      return res.status(404).json({
        code: 404,
        msg: '商家不存在',
        data: null
      });
    }

    const recentConnections = await Connection.findAll({
      where: { merchantId: merchant.id },
      include: [{ model: require('../models').User }],
      order: [['scanTime', 'DESC']],
      limit: 10
    });

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        merchantId: merchant.merchantId,
        merchantName: merchant.merchantName,
        industry: merchant.industry,
        logo: merchant.logo,
        description: merchant.description,
        address: merchant.address,
        contactPhone: merchant.contactPhone,
        contactPerson: merchant.contactPerson,
        wechatId: merchant.wechatId,
        boothNumber: merchant.boothNumber,
        boothZone: merchant.boothZone,
        visitorCount: merchant.visitorCount,
        connectionCount: merchant.connectionCount,
        materialViewCount: merchant.materialViewCount,
        onlineVisitorCount: merchant.onlineVisitorCount,
        chatCount: merchant.chatCount,
        materials: merchant.Materials,
        exhibition: merchant.Exhibition,
        recentConnections: recentConnections.map(c => ({
          userId: c.User.userId,
          company: c.User.company,
          position: c.User.position,
          scanTime: c.scanTime,
          intentionLevel: c.intentionLevel
        }))
      }
    });
  } catch (error) {
    req.logger.error('Get merchant detail error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取商家详情失败',
      data: null
    });
  }
});

router.post('/material/upload', async (req, res) => {
  try {
    const { merchantId, title, description, fileType, fileUrl, fileSize, thumbnailUrl } = req.body;

    const merchant = await Merchant.findOne({ where: { merchantId } });
    if (!merchant) {
      return res.status(404).json({
        code: 404,
        msg: '商家不存在',
        data: null
      });
    }

    const materialId = uuidv4();
    const material = await Material.create({
      materialId,
      merchantId: merchant.id,
      title,
      description,
      fileType,
      fileUrl,
      fileSize,
      thumbnailUrl,
      sortOrder: 0
    });

    res.json({
      code: 200,
      msg: '上传成功',
      data: {
        materialId: material.materialId,
        title: material.title,
        fileType: material.fileType,
        fileUrl: material.fileUrl
      }
    });
  } catch (error) {
    req.logger.error('Upload material error:', error);
    res.status(500).json({
      code: 500,
      msg: '上传物料失败',
      data: null
    });
  }
});

router.get('/statistics', async (req, res) => {
  try {
    const { merchantId, startDate, endDate } = req.query;

    const merchant = await Merchant.findOne({ where: { merchantId } });
    if (!merchant) {
      return res.status(404).json({
        code: 404,
        msg: '商家不存在',
        data: null
      });
    }

    const where = { merchantId: merchant.id };
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const connections = await Connection.findAll({ where });

    const statistics = {
      totalConnections: connections.length,
      totalVisitors: merchant.visitorCount,
      materialViews: merchant.materialViewCount,
      onlineVisitors: merchant.onlineVisitorCount,
      chatCount: merchant.chatCount,
      connectionsByIntention: {
        high: connections.filter(c => c.intentionLevel === 'high').length,
        medium: connections.filter(c => c.intentionLevel === 'medium').length,
        low: connections.filter(c => c.intentionLevel === 'low').length
      },
      connectionsByTime: connections.reduce((acc, c) => {
        const hour = new Date(c.scanTime).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({
      code: 200,
      msg: '获取成功',
      data: statistics
    });
  } catch (error) {
    req.logger.error('Get merchant statistics error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取统计数据失败',
      data: null
    });
  }
});

router.put('/virtual-room', async (req, res) => {
  try {
    const { merchantId, roomName, roomType, description, roomImages, is3D, videoUrl } = req.body;

    const merchant = await Merchant.findOne({ where: { merchantId } });
    if (!merchant) {
      return res.status(404).json({
        code: 404,
        msg: '商家不存在',
        data: null
      });
    }

    await merchant.update({
      hasVirtualRoom: true,
      virtualRoomType: roomType,
      onlineStatus: true
    });

    res.json({
      code: 200,
      msg: '更新成功',
      data: {
        merchantId: merchant.merchantId,
        hasVirtualRoom: merchant.hasVirtualRoom,
        virtualRoomType: merchant.virtualRoomType
      }
    });
  } catch (error) {
    req.logger.error('Update virtual room error:', error);
    res.status(500).json({
      code: 500,
      msg: '更新虚拟展位失败',
      data: null
    });
  }
});

router.post('/scan-user', async (req, res) => {
  try {
    const { merchantId, userQrCode, longitude, latitude } = req.body;

    const merchant = await Merchant.findOne({ where: { merchantId } });
    if (!merchant) {
      return res.status(404).json({
        code: 404,
        msg: '商家不存在',
        data: null
      });
    }

    const User = require('../models').User;
    const user = await User.findOne({ where: { userId: userQrCode.replace('user:', '') } });
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
        scanTime: {
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
      scanType: 'merchant_scan'
    });

    await merchant.increment('connectionCount');

    req.io.to(`exhibition-${merchant.exhibitionId}`).emit('new-connection', {
      merchantId: merchant.merchantId,
      userId: user.userId,
      timestamp: connection.scanTime
    });

    res.json({
      code: 200,
      msg: '扫码成功',
      data: {
        connectionId: connection.connectionId,
        user: {
          userId: user.userId,
          company: user.company,
          position: user.position,
          nickname: user.nickname
        }
      }
    });
  } catch (error) {
    req.logger.error('Scan user error:', error);
    res.status(500).json({
      code: 500,
      msg: '扫码失败',
      data: null
    });
  }
});

module.exports = router;
