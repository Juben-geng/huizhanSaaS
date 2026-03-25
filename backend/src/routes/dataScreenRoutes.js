const express = require('express');
const router = express.Router();
const { Exhibition, Merchant, User, Connection, Activity, Prize, VirtualRoom } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

router.get('/realtime', async (req, res) => {
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

    const [totalUsers, totalMerchants, totalConnections, activeUsers, liveRooms] = await Promise.all([
      User.count({ where: { exhibitionId: exhibition.id } }),
      Merchant.count({ where: { exhibitionId: exhibition.id } }),
      Connection.count({
        where: {
          merchantId: {
            [Op.in]: literal(`(SELECT id FROM Merchants WHERE exhibitionId = ${exhibition.id})`)
          }
        }
      }),
      User.count({
        where: {
          exhibitionId: exhibition.id,
          lastScanTime: {
            [Op.gte]: new Date(Date.now() - 30 * 60 * 1000)
          }
        }
      }),
      VirtualRoom.count({
        where: { status: 'live' },
        include: [{
          model: Merchant,
          where: { exhibitionId: exhibition.id }
        }]
      })
    ]);

    const connectionsByTime = await Connection.findAll({
      attributes: [
        [fn('HOUR', col('scanTime')), 'hour'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: {
        merchantId: {
          [Op.in]: literal(`(SELECT id FROM Merchants WHERE exhibitionId = ${exhibition.id})`)
        },
        scanTime: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      group: [fn('HOUR', col('scanTime'))],
      raw: true
    });

    const merchantsByIndustry = await Merchant.findAll({
      attributes: [
        'industry',
        [fn('COUNT', col('id')), 'count']
      ],
      where: { exhibitionId: exhibition.id },
      group: ['industry'],
      order: [[literal('count'), 'DESC']],
      limit: 10,
      raw: true
    });

    const topMerchants = await Merchant.findAll({
      where: { exhibitionId: exhibition.id },
      order: [['connectionCount', 'DESC']],
      limit: 10,
      attributes: ['merchantId', 'merchantName', 'industry', 'connectionCount', 'visitorCount']
    });

    const activities = await Activity.findAll({
      where: { exhibitionId: exhibition.id },
      include: [{
        model: Prize,
        attributes: ['prizeId', 'prizeName', 'totalCount', 'remainCount']
      }],
      order: [['startTime', 'DESC']],
      limit: 5
    });

    const realtimeData = {
      exhibition: {
        exhibitionId: exhibition.exhibitionId,
        exhibitionName: exhibition.exhibitionName,
        status: exhibition.status,
        startTime: exhibition.startTime,
        endTime: exhibition.endTime
      },
      overview: {
        totalUsers,
        totalMerchants,
        totalConnections,
        activeUsers,
        liveRooms,
        capacity: {
          used: exhibition.currentUsers,
          total: exhibition.maxUsers,
          percentage: Math.round((exhibition.currentUsers / exhibition.maxUsers) * 100)
        }
      },
      trends: {
        connectionsByTime: Array.from({ length: 24 }, (_, i) => {
          const hourData = connectionsByTime.find(c => c.hour === i);
          return {
            hour: i,
            count: hourData ? hourData.count : 0
          };
        }),
        connectionsByIndustry: merchantsByIndustry.map(m => ({
          industry: m.industry,
          count: m.count
        }))
      },
      ranking: {
        topMerchants: topMerchants.map(m => ({
          merchantId: m.merchantId,
          merchantName: m.merchantName,
          industry: m.industry,
          connectionCount: m.connectionCount,
          visitorCount: m.visitorCount
        }))
      },
      activities: activities.map(a => ({
        activityId: a.activityId,
        activityName: a.activityName,
        activityType: a.activityType,
        status: a.status,
        startTime: a.startTime,
        endTime: a.endTime,
        prizes: a.Prizes.map(p => ({
          prizeId: p.prizeId,
          prizeName: p.prizeName,
          totalCount: p.totalCount,
          remainCount: p.remainCount
        }))
      }))
    };

    res.json({
      code: 200,
      msg: '获取成功',
      data: realtimeData
    });
  } catch (error) {
    req.logger.error('Get realtime data error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取实时数据失败',
      data: null
    });
  }
});

router.get('/statistics', async (req, res) => {
  try {
    const { exhibitionId, startDate, endDate, groupBy = 'hour' } = req.query;

    const exhibition = await Exhibition.findOne({ where: { exhibitionId } });
    if (!exhibition) {
      return res.status(404).json({
        code: 404,
        msg: '展会不存在',
        data: null
      });
    }

    let dateFormat = '%Y-%m-%d %H:00:00';
    if (groupBy === 'day') dateFormat = '%Y-%m-%d';
    if (groupBy === 'week') dateFormat = '%Y-%u';

    const timeCondition = {};
    if (startDate && endDate) {
      timeCondition.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else {
      timeCondition.createdAt = {
        [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      };
    }

    const userGrowth = await User.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('createdAt'), dateFormat), 'time'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: {
        exhibitionId: exhibition.id,
        ...timeCondition
      },
      group: [literal('time')],
      order: [[literal('time'), 'ASC']],
      raw: true
    });

    const connectionGrowth = await Connection.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('scanTime'), dateFormat), 'time'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: {
        merchantId: {
          [Op.in]: literal(`(SELECT id FROM Merchants WHERE exhibitionId = ${exhibition.id})`)
        },
        scanTime: timeCondition.createdAt
      },
      group: [literal('time')],
      order: [[literal('time'), 'ASC']],
      raw: true
    });

    const intentionDistribution = await Connection.findAll({
      attributes: [
        'intentionLevel',
        [fn('COUNT', col('id')), 'count']
      ],
      where: {
        merchantId: {
          [Op.in]: literal(`(SELECT id FROM Merchants WHERE exhibitionId = ${exhibition.id})`)
        },
        ...timeCondition
      },
      group: ['intentionLevel'],
      raw: true
    });

    const statistics = {
      userGrowth: userGrowth.map(u => ({
        time: u.time,
        count: u.count
      })),
      connectionGrowth: connectionGrowth.map(c => ({
        time: c.time,
        count: c.count
      })),
      intentionDistribution: intentionDistribution.map(i => ({
        level: i.intentionLevel,
        count: i.count
      }))
    };

    res.json({
      code: 200,
      msg: '获取成功',
      data: statistics
    });
  } catch (error) {
    req.logger.error('Get statistics error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取统计数据失败',
      data: null
    });
  }
});

router.get('/heatmap', async (req, res) => {
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

    const connectionHeatmap = await Connection.findAll({
      attributes: [
        'latitude',
        'longitude',
        [fn('COUNT', col('id')), 'count']
      ],
      where: {
        merchantId: {
          [Op.in]: literal(`(SELECT id FROM Merchants WHERE exhibitionId = ${exhibition.id})`)
        },
        latitude: { [Op.ne]: null },
        longitude: { [Op.ne]: null },
        scanTime: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      group: ['latitude', 'longitude'],
      having: literal('COUNT(*) > 1'),
      raw: true
    });

    const merchantZones = await Merchant.findAll({
      attributes: [
        'boothZone',
        'latitude',
        'longitude',
        'connectionCount'
      ],
      where: {
        exhibitionId: exhibition.id,
        latitude: { [Op.ne]: null },
        longitude: { [Op.ne]: null }
      },
      raw: true
    });

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        connectionHeatmap: connectionHeatmap.map(h => ({
          lat: h.latitude,
          lng: h.longitude,
          count: h.count
        })),
        merchantZones: merchantZones.map(m => ({
          zone: m.boothZone,
          lat: m.latitude,
          lng: m.longitude,
          count: m.connectionCount
        }))
      }
    });
  } catch (error) {
    req.logger.error('Get heatmap error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取热力图数据失败',
      data: null
    });
  }
});

router.get('/ranking', async (req, res) => {
  try {
    const { exhibitionId, type = 'merchants', limit = 10 } = req.query;

    const exhibition = await Exhibition.findOne({ where: { exhibitionId } });
    if (!exhibition) {
      return res.status(404).json({
        code: 404,
        msg: '展会不存在',
        data: null
      });
    }

    let ranking = [];

    if (type === 'merchants') {
      ranking = await Merchant.findAll({
        where: { exhibitionId: exhibition.id },
        order: [['connectionCount', 'DESC']],
        limit: parseInt(limit),
        attributes: ['merchantId', 'merchantName', 'industry', 'logo', 'boothNumber', 'connectionCount', 'visitorCount']
      });
    } else if (type === 'users') {
      ranking = await User.findAll({
        where: { exhibitionId: exhibition.id },
        order: [['connectionCount', 'DESC']],
        limit: parseInt(limit),
        attributes: ['userId', 'nickname', 'avatar', 'company', 'position', 'scanCount', 'connectionCount', 'score']
      });
    } else if (type === 'industries') {
      const industryData = await Merchant.findAll({
        attributes: [
          'industry',
          [fn('COUNT', col('id')), 'merchantCount'],
          [fn('SUM', col('connectionCount')), 'totalConnections']
        ],
        where: { exhibitionId: exhibition.id },
        group: ['industry'],
        order: [[literal('totalConnections'), 'DESC']],
        limit: parseInt(limit),
        raw: true
      });
      ranking = industryData;
    }

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        type,
        list: ranking
      }
    });
  } catch (error) {
    req.logger.error('Get ranking error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取排行榜数据失败',
      data: null
    });
  }
});

module.exports = router;
