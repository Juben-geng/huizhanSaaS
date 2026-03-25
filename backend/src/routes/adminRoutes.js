const express = require('express');
const router = express.Router();
const { Organizer, Exhibition, Merchant, User, Activity, Prize } = require('../models');
const { v4: uuidv4 } = require('uuid');
const quotaManager = require('../services/quotaManager');

router.post('/organizer/create', async (req, res) => {
  try {
    const { 
      organizerName, contactPerson, contactPhone, contactEmail,
      logo, description, packageType 
    } = req.body;

    const organizerId = uuidv4();
    const organizer = await Organizer.create({
      organizerId,
      organizerName,
      contactPerson,
      contactPhone,
      contactEmail,
      logo,
      description,
      packageType: packageType || 'free',
      packageExpireTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    await quotaManager.initializeQuota(organizer.id, packageType || 'free');

    res.json({
      code: 200,
      msg: '创建成功',
      data: {
        organizerId: organizer.organizerId,
        organizerName: organizer.organizerName,
        packageType: organizer.packageType
      }
    });
  } catch (error) {
    req.logger.error('Create organizer error:', error);
    res.status(500).json({
      code: 500,
      msg: '创建主办方失败',
      data: null
    });
  }
});

router.post('/exhibition/create', async (req, res) => {
  try {
    const { 
      organizerId, exhibitionName, description, coverImage,
      startTime, endTime, venue, maxUsers, maxMerchants,
      hasVirtualExhibition, hasScreen, hasAIRecommend 
    } = req.body;

    const exhibitionId = uuidv4();
    const exhibition = await Exhibition.create({
      exhibitionId,
      exhibitionName,
      description,
      coverImage,
      organizerId,
      startTime,
      endTime,
      venue,
      maxUsers,
      maxMerchants,
      hasVirtualExhibition,
      hasScreen,
      hasAIRecommend,
      status: 'draft'
    });

    res.json({
      code: 200,
      msg: '创建成功',
      data: {
        exhibitionId: exhibition.exhibitionId,
        exhibitionName: exhibition.exhibitionName
      }
    });
  } catch (error) {
    req.logger.error('Create exhibition error:', error);
    res.status(500).json({
      code: 500,
      msg: '创建展会失败',
      data: null
    });
  }
});

router.get('/exhibition/list', async (req, res) => {
  try {
    const { organizerId, status, pageNum = 1, pageSize = 10 } = req.query;

    const where = {};
    if (organizerId) where.organizerId = organizerId;
    if (status) where.status = status;

    const { count, rows } = await Exhibition.findAndCountAll({
      where,
      include: [{ model: Organizer, as: 'organizer' }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(pageNum) - 1) * parseInt(pageSize)
    });

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        total: count,
        list: rows.map(e => ({
          exhibitionId: e.exhibitionId,
          exhibitionName: e.exhibitionName,
          coverImage: e.coverImage,
          startTime: e.startTime,
          endTime: e.endTime,
          venue: e.venue,
          maxUsers: e.maxUsers,
          maxMerchants: e.maxMerchants,
          currentUsers: e.currentUsers,
          currentMerchants: e.currentMerchants,
          status: e.status,
          organizerName: e.Organizer?.organizerName
        }))
      }
    });
  } catch (error) {
    req.logger.error('Get exhibition list error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取展会列表失败',
      data: null
    });
  }
});

router.put('/exhibition/status', async (req, res) => {
  try {
    const { exhibitionId, status } = req.body;

    const exhibition = await Exhibition.findOne({ where: { exhibitionId } });
    if (!exhibition) {
      return res.status(404).json({
        code: 404,
        msg: '展会不存在',
        data: null
      });
    }

    await exhibition.update({ status });

    res.json({
      code: 200,
      msg: '更新成功',
      data: {
        exhibitionId: exhibition.exhibitionId,
        status: exhibition.status
      }
    });
  } catch (error) {
    req.logger.error('Update exhibition status error:', error);
    res.status(500).json({
      code: 500,
      msg: '更新展会状态失败',
      data: null
    });
  }
});

router.post('/activity/create', async (req, res) => {
  try {
    const { 
      exhibitionId, activityName, activityType, description,
      startTime, endTime, rules, scanCountRequired, zonesRequired,
      isOnline 
    } = req.body;

    const activityId = uuidv4();
    const activity = await Activity.create({
      activityId,
      exhibitionId,
      activityName,
      activityType,
      description,
      startTime,
      endTime,
      rules: JSON.stringify(rules),
      scanCountRequired,
      zonesRequired: JSON.stringify(zonesRequired),
      isOnline
    });

    res.json({
      code: 200,
      msg: '创建成功',
      data: {
        activityId: activity.activityId,
        activityName: activity.activityName
      }
    });
  } catch (error) {
    req.logger.error('Create activity error:', error);
    res.status(500).json({
      code: 500,
      msg: '创建活动失败',
      data: null
    });
  }
});

router.post('/prize/create', async (req, res) => {
  try {
    const { 
      activityId, prizeName, prizeImage, prizeType, prizeValue,
      totalCount, sortOrder 
    } = req.body;

    const prizeId = uuidv4();
    const prize = await Prize.create({
      prizeId,
      activityId,
      prizeName,
      prizeImage,
      prizeType,
      prizeValue,
      totalCount,
      remainCount: totalCount,
      winCount: 0,
      sortOrder
    });

    res.json({
      code: 200,
      msg: '创建成功',
      data: {
        prizeId: prize.prizeId,
        prizeName: prize.prizeName,
        totalCount: prize.totalCount,
        remainCount: prize.remainCount
      }
    });
  } catch (error) {
    req.logger.error('Create prize error:', error);
    res.status(500).json({
      code: 500,
      msg: '创建奖品失败',
      data: null
    });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const { exhibitionId } = req.query;

    const exhibition = await Exhibition.findOne({ where: { exhibitionId } });
    if (!exhibition) {
      return res.status(404).json({
        code: 404,
        msg: '展会不存在',
        data: null
      });
    }

    const totalUsers = await User.count({ where: { exhibitionId: exhibition.id } });
    const totalMerchants = await Merchant.count({ where: { exhibitionId: exhibition.id } });
    
    const connections = await require('../models').Connection.findAll({
      where: {
        merchantId: {
          [Op.in]: (await Merchant.findAll({ 
            where: { exhibitionId: exhibition.id },
            attributes: ['id']
          })).map(m => m.id)
        }
      }
    });

    const activities = await Activity.findAll({ where: { exhibitionId: exhibition.id } });
    const activityIds = activities.map(a => a.id);
    
    const prizes = await Prize.findAll({
      where: { activityId: { [Op.in]: activityIds } }
    });

    const dashboard = {
      exhibition: {
        exhibitionId: exhibition.exhibitionId,
        exhibitionName: exhibition.exhibitionName,
        status: exhibition.status,
        startTime: exhibition.startTime,
        endTime: exhibition.endTime
      },
      statistics: {
        totalUsers,
        totalMerchants,
        totalConnections: connections.length,
        activeUsers: await User.count({ 
          where: { 
            exhibitionId: exhibition.id,
            lastScanTime: {
              [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        })
      },
      activities: {
        totalActivities: activities.length,
        totalPrizes: prizes.length,
        totalPrizeValue: prizes.reduce((sum, p) => sum + parseInt(p.prizeValue || 0), 0)
      }
    };

    res.json({
      code: 200,
      msg: '获取成功',
      data: dashboard
    });
  } catch (error) {
    req.logger.error('Get dashboard error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取仪表盘数据失败',
      data: null
    });
  }
});

router.get('/export/data', async (req, res) => {
  try {
    const { exhibitionId, dataType } = req.query;

    let data = [];
    let filename = '';

    switch (dataType) {
      case 'users':
        const users = await User.findAll({ where: { exhibitionId } });
        data = users.map(u => ({
          userId: u.userId,
          company: u.company,
          position: u.position,
          score: u.score,
          scanCount: u.scanCount,
          connectionCount: u.connectionCount,
          createdAt: u.createdAt
        }));
        filename = 'users_data.xlsx';
        break;

      case 'merchants':
        const merchants = await Merchant.findAll({ where: { exhibitionId } });
        data = merchants.map(m => ({
          merchantId: m.merchantId,
          merchantName: m.merchantName,
          industry: m.industry,
          visitorCount: m.visitorCount,
          connectionCount: m.connectionCount,
          createdAt: m.createdAt
        }));
        filename = 'merchants_data.xlsx';
        break;

      case 'connections':
        const Connection = require('../models').Connection;
        const connections = await Connection.findAll({
          where: { merchantId: { [Op.in]: (await Merchant.findAll({ 
            where: { exhibitionId },
            attributes: ['id']
          })).map(m => m.id) } },
          include: [{ model: User }, { model: Merchant }]
        });
        data = connections.map(c => ({
          userId: c.User?.userId,
          merchantId: c.Merchant?.merchantId,
          scanTime: c.scanTime,
          intentionLevel: c.intentionLevel,
          materialViewed: c.materialViewed
        }));
        filename = 'connections_data.xlsx';
        break;

      default:
        return res.status(400).json({
          code: 400,
          msg: '不支持的数据类型',
          data: null
        });
    }

    res.json({
      code: 200,
      msg: '导出成功',
      data: {
        filename,
        data,
        total: data.length
      }
    });
  } catch (error) {
    req.logger.error('Export data error:', error);
    res.status(500).json({
      code: 500,
      msg: '导出数据失败',
      data: null
    });
  }
});

module.exports = router;
