const express = require('express');
const router = express.Router();
const { VirtualRoom, Merchant, ChatRecord, User } = require('../models');
const { v4: uuidv4 } = require('uuid');

router.post('/create', async (req, res) => {
  try {
    const { 
      merchantId, roomName, roomType, description, roomImages,
      is3D, videoUrl, liveUrl, openingHours 
    } = req.body;

    const merchant = await Merchant.findOne({ where: { merchantId } });
    if (!merchant) {
      return res.status(404).json({
        code: 404,
        msg: '商家不存在',
        data: null
      });
    }

    const roomId = uuidv4();
    const virtualRoom = await VirtualRoom.create({
      roomId,
      merchantId: merchant.id,
      roomName,
      roomType,
      description,
      roomImages: JSON.stringify(roomImages || []),
      is3D: is3D || false,
      videoUrl,
      liveUrl,
      openingHours: JSON.stringify(openingHours || {}),
      status: 'active'
    });

    await merchant.update({ 
      hasVirtualRoom: true,
      virtualRoomType: roomType 
    });

    res.json({
      code: 200,
      msg: '创建成功',
      data: {
        roomId: virtualRoom.roomId,
        roomName: virtualRoom.roomName,
        roomType: virtualRoom.roomType
      }
    });
  } catch (error) {
    req.logger.error('Create virtual room error:', error);
    res.status(500).json({
      code: 500,
      msg: '创建虚拟展位失败',
      data: null
    });
  }
});

router.get('/detail', async (req, res) => {
  try {
    const { roomId } = req.query;

    const virtualRoom = await VirtualRoom.findOne({
      where: { roomId },
      include: [{ model: Merchant }]
    });

    if (!virtualRoom) {
      return res.status(404).json({
        code: 404,
        msg: '虚拟展位不存在',
        data: null
      });
    }

    const visitorCount = await VirtualRoom.increment('visitorCount', {
      where: { roomId },
      silent: true
    });

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        roomId: virtualRoom.roomId,
        roomName: virtualRoom.roomName,
        roomType: virtualRoom.roomType,
        description: virtualRoom.description,
        roomImages: JSON.parse(virtualRoom.roomImages || '[]'),
        is3D: virtualRoom.is3D,
        videoUrl: virtualRoom.videoUrl,
        liveUrl: virtualRoom.liveUrl,
        openingHours: JSON.parse(virtualRoom.openingHours || '{}'),
        status: virtualRoom.status,
        visitorCount: virtualRoom.visitorCount + 1,
        merchant: {
          merchantId: virtualRoom.Merchant.merchantId,
          merchantName: virtualRoom.Merchant.merchantName,
          industry: virtualRoom.Merchant.industry,
          logo: virtualRoom.Merchant.logo,
          contactPhone: virtualRoom.Merchant.contactPhone,
          contactPerson: virtualRoom.Merchant.contactPerson,
          wechatId: virtualRoom.Merchant.wechatId
        }
      }
    });
  } catch (error) {
    req.logger.error('Get virtual room detail error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取虚拟展位详情失败',
      data: null
    });
  }
});

router.get('/list', async (req, res) => {
  try {
    const { exhibitionId, roomType, pageNum = 1, pageSize = 10 } = req.query;

    const where = { status: 'active' };
    if (roomType) where.roomType = roomType;

    const { count, rows } = await VirtualRoom.findAndCountAll({
      where,
      include: [{
        model: Merchant,
        where: exhibitionId ? { exhibitionId } : undefined,
        attributes: ['merchantId', 'merchantName', 'industry', 'logo', 'boothNumber']
      }],
      order: [['visitorCount', 'DESC'], [['createdAt', 'DESC']]],
      limit: parseInt(pageSize),
      offset: (parseInt(pageNum) - 1) * parseInt(pageSize)
    });

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        total: count,
        list: rows.map(room => ({
          roomId: room.roomId,
          roomName: room.roomName,
          roomType: room.roomType,
          roomImages: JSON.parse(room.roomImages || '[]'),
          is3D: room.is3D,
          liveUrl: room.liveUrl,
          visitorCount: room.visitorCount,
          merchant: room.Merchant
        }))
      }
    });
  } catch (error) {
    req.logger.error('Get virtual room list error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取虚拟展位列表失败',
      data: null
    });
  }
});

router.post('/chat/send', async (req, res) => {
  try {
    const { roomId, userId, merchantId, messageType, content, fileUrl } = req.body;

    const chatRecordId = uuidv4();
    const chatRecord = await ChatRecord.create({
      chatRecordId,
      roomId,
      userId,
      merchantId,
      messageType,
      content,
      fileUrl,
      senderType: 'user',
      status: 'sent'
    });

    await Merchant.increment('chatCount', { 
      where: { id: merchantId },
      silent: true
    });

    req.io.to(`room-${roomId}`).emit('new-message', {
      chatRecordId: chatRecord.chatRecordId,
      roomId,
      userId,
      merchantId,
      messageType,
      content,
      fileUrl,
      senderType: 'user',
      createdAt: chatRecord.createdAt
    });

    res.json({
      code: 200,
      msg: '发送成功',
      data: {
        chatRecordId: chatRecord.chatRecordId,
        createdAt: chatRecord.createdAt
      }
    });
  } catch (error) {
    req.logger.error('Send chat message error:', error);
    res.status(500).json({
      code: 500,
      msg: '发送消息失败',
      data: null
    });
  }
});

router.get('/chat/history', async (req, res) => {
  try {
    const { roomId, userId, pageNum = 1, pageSize = 20 } = req.query;

    const where = { roomId };
    if (userId) where.userId = userId;

    const { count, rows } = await ChatRecord.findAndCountAll({
      where,
      include: [
        { 
          model: User,
          attributes: ['userId', 'nickname', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(pageNum) - 1) * parseInt(pageSize)
    });

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        total: count,
        list: rows.reverse().map(chat => ({
          chatRecordId: chat.chatRecordId,
          roomId: chat.roomId,
          messageType: chat.messageType,
          content: chat.content,
          fileUrl: chat.fileUrl,
          senderType: chat.senderType,
          status: chat.status,
          user: chat.User,
          createdAt: chat.createdAt
        }))
      }
    });
  } catch (error) {
    req.logger.error('Get chat history error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取聊天记录失败',
      data: null
    });
  }
});

router.put('/status', async (req, res) => {
  try {
    const { roomId, status, liveUrl } = req.body;

    const virtualRoom = await VirtualRoom.findOne({ where: { roomId } });
    if (!virtualRoom) {
      return res.status(404).json({
        code: 404,
        msg: '虚拟展位不存在',
        data: null
      });
    }

    const updateData = { status };
    if (liveUrl) updateData.liveUrl = liveUrl;

    await virtualRoom.update(updateData);

    await Merchant.update(
      { onlineStatus: status === 'live' },
      { where: { id: virtualRoom.merchantId } }
    );

    req.io.to(`exhibition-${virtualRoom.Merchant?.exhibitionId}`).emit('room-status-change', {
      roomId,
      status,
      liveUrl
    });

    res.json({
      code: 200,
      msg: '更新成功',
      data: {
        roomId: virtualRoom.roomId,
        status: virtualRoom.status,
        liveUrl: virtualRoom.liveUrl
      }
    });
  } catch (error) {
    req.logger.error('Update virtual room status error:', error);
    res.status(500).json({
      code: 500,
      msg: '更新状态失败',
      data: null
    });
  }
});

router.post('/live/start', async (req, res) => {
  try {
    const { roomId, liveUrl } = req.body;

    const virtualRoom = await VirtualRoom.findOne({ where: { roomId } });
    if (!virtualRoom) {
      return res.status(404).json({
        code: 404,
        msg: '虚拟展位不存在',
        data: null
      });
    }

    await virtualRoom.update({
      status: 'live',
      liveUrl,
      liveStartTime: new Date()
    });

    await Merchant.update(
      { onlineStatus: true },
      { where: { id: virtualRoom.merchantId } }
    );

    req.io.to(`exhibition-${virtualRoom.Merchant?.exhibitionId}`).emit('live-start', {
      roomId,
      merchantId: virtualRoom.merchantId,
      liveUrl,
      startTime: virtualRoom.liveStartTime
    });

    res.json({
      code: 200,
      msg: '直播开始',
      data: {
        roomId: virtualRoom.roomId,
        liveUrl: virtualRoom.liveUrl,
        liveStartTime: virtualRoom.liveStartTime
      }
    });
  } catch (error) {
    req.logger.error('Start live error:', error);
    res.status(500).json({
      code: 500,
      msg: '开始直播失败',
      data: null
    });
  }
});

router.post('/live/stop', async (req, res) => {
  try {
    const { roomId } = req.body;

    const virtualRoom = await VirtualRoom.findOne({ where: { roomId } });
    if (!virtualRoom) {
      return res.status(404).json({
        code: 404,
        msg: '虚拟展位不存在',
        data: null
      });
    }

    const liveDuration = virtualRoom.liveStartTime 
      ? Math.floor((new Date() - virtualRoom.liveStartTime) / 1000)
      : 0;

    await virtualRoom.update({
      status: 'active',
      liveStartTime: null,
      liveDuration: virtualRoom.liveDuration + liveDuration
    });

    await Merchant.update(
      { onlineStatus: false },
      { where: { id: virtualRoom.merchantId } }
    );

    req.io.to(`exhibition-${virtualRoom.Merchant?.exhibitionId}`).emit('live-stop', {
      roomId,
      merchantId: virtualRoom.merchantId,
      duration: liveDuration
    });

    res.json({
      code: 200,
      msg: '直播结束',
      data: {
        roomId: virtualRoom.roomId,
        totalDuration: virtualRoom.liveDuration + liveDuration
      }
    });
  } catch (error) {
    req.logger.error('Stop live error:', error);
    res.status(500).json({
      code: 500,
      msg: '结束直播失败',
      data: null
    });
  }
});

module.exports = router;
