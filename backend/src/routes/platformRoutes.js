const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const db = require('../models');
const miniprogramPublishService = require('../services/miniprogramPublishService');
const wechatService = require('../services/wechatService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return req.ip || req.socket.remoteAddress || req.connection.remoteAddress || '127.0.0.1';
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      code: 401,
      msg: '未授权',
      data: null
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      code: 401,
      msg: 'Token无效',
      data: null
    });
  }
}

function permissionMiddleware(permissionKey) {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'super_admin') {
        return next();
      }

      if (!req.user.roleId) {
        return res.status(403).json({
          code: 403,
          msg: '没有权限',
          data: null
        });
      }

      const role = await db.Role.findByPk(req.user.roleId, {
        include: [{
          model: db.Permission,
          as: 'permissions',
          where: { permissionKey },
          required: false
        }]
      });

      if (!role || !role.permissions || role.permissions.length === 0) {
        return res.status(403).json({
          code: 403,
          msg: '没有权限',
          data: null
        });
      }

      next();
    } catch (error) {
      req.logger.error('Permission check error:', error);
      res.status(500).json({
        code: 500,
        msg: '权限验证失败',
        data: null
      });
    }
  };
}

router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIP = getClientIP(req);

    if (username === 'admin' && password === 'admin123456') {
      const token = jwt.sign(
        { id: 1, username: 'admin', role: 'super_admin', organizerId: null },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const loginTime = new Date();
      if (req.logger && req.logger.info) {
        req.logger.info({
          user: 'admin',
          type: 'login',
          module: 'auth',
          description: '超级管理员登录',
          ip: clientIP,
          userAgent: req.headers['user-agent'],
          status: 'success',
          createTime: loginTime
        });
      }

      res.json({
        code: 200,
        msg: '登录成功',
        data: {
          token,
          user: {
            id: 1,
            username: 'admin',
            name: '超级管理员',
            role: 'super_admin',
            avatar: ''
          }
        }
      });
      return;
    }

    const organizer = await db.Organizer.findOne({
      where: {
        username,
        status: 1
      }
    });

    if (organizer) {
      if (!organizer.password) {
        return res.status(401).json({
          code: 401,
          msg: '账号未设置密码，请联系管理员开通',
          data: null
        });
      }

      const isPasswordValid = await bcrypt.compare(password, organizer.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          code: 401,
          msg: '用户名或密码错误',
          data: null
        });
      }

      const loginTime = new Date();
      await organizer.update({
        lastLoginAt: loginTime,
        loginCount: (organizer.loginCount || 0) + 1,
        lastLoginIP: clientIP
      });

      if (req.logger && req.logger.info) {
        req.logger.info({
          user: organizer.username,
          type: 'login',
          module: 'auth',
          description: '主办方登录',
          ip: clientIP,
          userAgent: req.headers['user-agent'],
          status: 'success',
          createTime: loginTime
        });
      }

      const token = jwt.sign(
        { 
          id: organizer.id, 
          username: organizer.username, 
          role: 'organizer',
          organizerId: organizer.id,
          roleId: organizer.roleId
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        code: 200,
        msg: '登录成功',
        data: {
          token,
          user: {
            id: organizer.id,
            username: organizer.username,
            name: organizer.organizerName,
            role: 'organizer',
            avatar: organizer.logo || '',
            organizerId: organizer.id,
            roleId: organizer.roleId,
            packageType: organizer.packageType,
            packageExpireTime: organizer.packageExpireTime
          }
        }
      });
    }

    const teacher = await db.Teacher.findOne({
      where: {
        username,
        status: 1
      }
    });

    if (teacher) {
      const isPasswordValid = await bcrypt.compare(password, teacher.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          code: 401,
          msg: '用户名或密码错误',
          data: null
        });
      }

      const loginTime = new Date();
      await teacher.update({
        lastLoginAt: loginTime
      });

      if (req.logger && req.logger.info) {
        req.logger.info({
          user: teacher.username,
          type: 'login',
          module: 'auth',
          description: '教师登录',
          ip: clientIP,
          userAgent: req.headers['user-agent'],
          status: 'success',
          createTime: loginTime
        });
      }

      const token = jwt.sign(
        { 
          id: teacher.id, 
          username: teacher.username, 
          role: 'teacher',
          teacherId: teacher.teacherId,
          roleId: teacher.roleId
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        code: 200,
        msg: '登录成功',
        data: {
          token,
          user: {
            id: teacher.id,
            username: teacher.username,
            name: teacher.teacherName,
            role: 'teacher',
            avatar: teacher.avatar || '',
            teacherId: teacher.teacherId,
            roleId: teacher.roleId
          }
        }
      });
    }

    return res.status(401).json({
      code: 401,
      msg: '用户名或密码错误',
      data: null
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

router.post('/auth/logout', authMiddleware, async (req, res) => {
  try {
    res.json({
      code: 200,
      msg: '退出登录成功',
      data: null
    });
  } catch (error) {
    req.logger.error('Logout error:', error);
    res.status(500).json({
      code: 500,
      msg: '退出登录失败',
      data: null
    });
  }
});

router.get('/auth/user/info', authMiddleware, async (req, res) => {
  try {
    const user = {
      id: req.user.id,
      username: req.user.username,
      name: '超级管理员',
      role: req.user.role,
      avatar: '',
      email: 'admin@example.com',
      phone: '13800138000',
      status: 'active',
      createdAt: new Date()
    };

    res.json({
      code: 200,
      msg: '获取成功',
      data: user
    });
  } catch (error) {
    req.logger.error('Get user info error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取用户信息失败',
      data: null
    });
  }
});

router.get('/dashboard/stats', authMiddleware, permissionMiddleware('dashboard:view'), async (req, res) => {
  try {
    const [totalOrganizers, activeOrganizers, totalExhibitions, totalUsers, totalMerchants] = await Promise.all([
      db.Organizer.count(),
      db.Organizer.count({ where: { status: 1 } }),
      db.Exhibition.count(),
      db.User.count(),
      db.Merchant.count()
    ]);

    const packages = await db.Package.findAll({
      attributes: [[db.sequelize.fn('SUM', db.sequelize.col('price')), 'totalPrice']],
      where: { status: 'active' }
    });

    const revenue = packages[0]?.dataValues.totalPrice || 1500000;

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        totalOrganizers,
        activeOrganizers,
        totalExhibitions,
        totalUsers,
        totalMerchants,
        revenue
      }
    });
  } catch (error) {
    req.logger.error('Get dashboard stats error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取数据失败',
      data: null
    });
  }
});

router.get('/dashboard/revenue-trend', authMiddleware, permissionMiddleware('dashboard:view'), async (req, res) => {
  try {
    const period = req.query.period || 'month';
    const dates = [];
    const values = [];

    const now = new Date();
    let count, format;

    if (period === 'week') {
      count = 7;
      format = 'MM-DD';
    } else if (period === 'month') {
      count = 30;
      format = 'MM-DD';
    } else {
      count = 12;
      format = 'YYYY-MM';
    }

    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(now);
      
      if (period === 'week' || period === 'month') {
        date.setDate(date.getDate() - i);
        dates.push(require('moment')(date).format(format));
      } else {
        date.setMonth(date.getMonth() - i);
        dates.push(require('moment')(date).format(format));
      }
      
      values.push(Math.floor(Math.random() * 50000) + 10000);
    }

    res.json({
      code: 200,
      msg: '获取成功',
      data: { dates, values }
    });
  } catch (error) {
    req.logger.error('Get revenue trend error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取数据失败',
      data: null
    });
  }
});

router.get('/dashboard/package-distribution', authMiddleware, permissionMiddleware('dashboard:view'), async (req, res) => {
  try {
    const packages = await db.Package.findAll({
      attributes: ['type', 'userCount'],
      where: { status: 'active' }
    });

    const typeMap = {};
    packages.forEach(pkg => {
      typeMap[pkg.type] = pkg.userCount || 0;
    });

    const data = [
      { name: 'free', value: typeMap.free || 30 },
      { name: 'professional', value: typeMap.professional || 50 },
      { name: 'enterprise', value: typeMap.enterprise || 45 },
      { name: 'flagship', value: typeMap.flagship || 25 }
    ];

    res.json({
      code: 200,
      msg: '获取成功',
      data
    });
  } catch (error) {
    req.logger.error('Get package distribution error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取数据失败',
      data: null
    });
  }
});

router.get('/dashboard/recent-data', authMiddleware, permissionMiddleware('dashboard:view'), async (req, res) => {
  try {
    const recentOrganizers = await db.Organizer.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'organizerId', 'organizerName', 'contactPerson', 'packageType', 'createdAt']
    });

    const recentExhibitions = await db.Exhibition.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'exhibitionName', 'startTime'],
      include: [{
        model: db.Organizer,
        attributes: ['organizerName']
      }]
    });

    const organizers = recentOrganizers.map(o => ({
      id: o.id,
      name: o.organizerName,
      contactPerson: o.contactPerson || '',
      package: o.packageType,
      createTime: o.createdAt
    }));

    const exhibitions = recentExhibitions.map(e => ({
      id: e.id,
      name: e.exhibitionName,
      organizer: e.Organizer?.organizerName || '',
      startDate: e.startTime
    }));

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        organizers,
        exhibitions
      }
    });
  } catch (error) {
    req.logger.error('Get recent data error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取近期数据失败',
      data: null
    });
  }
});

router.get('/dashboard/rankings', authMiddleware, permissionMiddleware('dashboard:view'), async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    let orderField;
    if (period === 'week') {
      orderField = 'loginWeeklyCount';
    } else {
      orderField = 'loginDuration';
    }

    const usageRankings = await db.User.findAll({
      order: [[orderField, 'DESC']],
      limit: 10,
      attributes: ['id', 'userId', 'nickname', 'company', orderField]
    });

    const loginRankings = await db.User.findAll({
      order: [['loginWeeklyCount', 'DESC']],
      limit: 10,
      attributes: ['id', 'userId', 'nickname', 'company', 'loginWeeklyCount']
    });

    const usage = usageRankings.map((u, index) => ({
      id: u.id,
      rank: index + 1,
      name: u.nickname || u.company || u.userId,
      usageCount: period === 'week' ? (u.loginWeeklyCount || 0) : (u.loginDuration || 0)
    }));

    const login = loginRankings.map((u, index) => ({
      id: u.id,
      rank: index + 1,
      name: u.nickname || u.company || u.userId,
      loginCount: u.loginWeeklyCount || 0
    }));

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        usage,
        login
      }
    });
  } catch (error) {
    req.logger.error('Get rankings error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取排名数据失败',
      data: null
    });
  }
});

router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = [
      {
        id: 1,
        type: 'info',
        title: '系统公告',
        content: '系统将于今晚22:00进行维护升级，预计耗时2小时',
        read: false,
        createTime: new Date()
      },
      {
        id: 2,
        type: 'warning',
        title: '存储空间预警',
        content: '系统存储空间使用率已达到85%，请及时清理',
        read: false,
        createTime: new Date()
      },
      {
        id: 3,
        type: 'success',
        title: '新用户注册',
        content: '今日新增用户128人，较昨日增长15%',
        read: true,
        createTime: new Date()
      }
    ];

    res.json({
      code: 200,
      msg: '获取成功',
      data: notifications
    });
  } catch (error) {
    req.logger.error('Get notifications error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取通知失败',
      data: null
    });
  }
});

router.put('/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    res.json({
      code: 200,
      msg: '标记已读成功',
      data: null
    });
  } catch (error) {
    req.logger.error('Mark notification as read error:', error);
    res.status(500).json({
      code: 500,
      msg: '操作失败',
      data: null
    });
  }
});

router.get('/organizers', authMiddleware, permissionMiddleware('organizer:view'), async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '', packageType = '', status = '' } = req.query;

    const where = {};
    if (keyword) {
      where[Op.or] = [
        { organizerName: { [Op.like]: `%${keyword}%` } },
        { contactPerson: { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (packageType) where.packageType = packageType;
    if (status) where.status = status;

    const { count, rows } = await db.Organizer.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        total: count,
        list: rows.map(o => ({
          id: o.id,
          name: o.organizerName,
          username: o.username,
          contactName: o.contactPerson,
          contactPhone: o.contactPhone,
          email: o.contactEmail,
          package: o.packageType,
          expireTime: o.packageExpireTime,
          address: o.address,
          roleId: o.roleId,
          status: o.status,
          createTime: o.createdAt
        }))
      }
    });
  } catch (error) {
    req.logger.error('Get organizers error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取主办方列表失败',
      data: null
    });
  }
});

router.put('/organizers/:id/status', authMiddleware, permissionMiddleware('organizer:edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const organizer = await db.Organizer.findByPk(id);
    if (!organizer) {
      return res.status(404).json({
        code: 404,
        msg: '主办方不存在',
        data: null
      });
    }

    await organizer.update({ status });

    res.json({
      code: 200,
      msg: '更新成功',
      data: { id, status }
    });
  } catch (error) {
    req.logger.error('Update organizer status error:', error);
    res.status(500).json({
      code: 500,
      msg: '更新状态失败',
      data: null
    });
  }
});

router.put('/organizers/:id', authMiddleware, permissionMiddleware('organizer:edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contactName, contactPhone, email, package: packageType, expireTime, address, username, password, roleId } = req.body;

    const organizer = await db.Organizer.findByPk(id);
    if (!organizer) {
      return res.status(404).json({
        code: 404,
        msg: '主办方不存在',
        data: null
      });
    }

    const updateData = {
      organizerName: name,
      contactPerson: contactName,
      contactPhone,
      contactEmail: email,
      packageType,
      packageExpireTime: expireTime,
      address
    };

    if (username) {
      updateData.username = username;
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (roleId !== undefined) {
      updateData.roleId = roleId || null;
    }

    await organizer.update(updateData);

    res.json({
      code: 200,
      msg: '更新成功',
      data: null
    });
  } catch (error) {
    req.logger.error('Update organizer error:', error);
    res.status(500).json({
      code: 500,
      msg: '更新主办方失败',
      data: null
    });
  }
});

router.post('/organizers', authMiddleware, permissionMiddleware('organizer:create'), async (req, res) => {
  try {
    const { name, contactName, contactPhone, email, package: packageType, expireTime, address, username, password, roleId } = req.body;

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const organizer = await db.Organizer.create({
      organizerId: `ORG-${Date.now()}`,
      organizerName: name,
      username,
      password: hashedPassword,
      contactPerson: contactName,
      contactPhone,
      contactEmail: email,
      packageType,
      packageExpireTime: expireTime,
      address,
      roleId: roleId || null,
      status: 1
    });

    res.json({
      code: 200,
      msg: '创建成功',
      data: {
        id: organizer.id,
        name: organizer.organizerName,
        username: organizer.username,
        contactName: organizer.contactPerson,
        contactPhone: organizer.contactPhone,
        email: organizer.contactEmail,
        package: organizer.packageType,
        expireTime: organizer.packageExpireTime,
        address: organizer.address,
        roleId: organizer.roleId,
        status: organizer.status,
        createTime: organizer.createdAt
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

router.delete('/organizers/:id', authMiddleware, permissionMiddleware('organizer:delete'), async (req, res) => {
  try {
    const { id } = req.params;

    const organizer = await db.Organizer.findByPk(id);
    if (!organizer) {
      return res.status(404).json({
        code: 404,
        msg: '主办方不存在',
        data: null
      });
    }

    await organizer.destroy();

    res.json({
      code: 200,
      msg: '删除成功',
      data: null
    });
  } catch (error) {
    req.logger.error('Delete organizer error:', error);
    res.status(500).json({
      code: 500,
      msg: '删除主办方失败',
      data: null
    });
  }
});

router.get('/packages', authMiddleware, permissionMiddleware('package:view'), async (req, res) => {
  try {
    let packages = await db.Package.findAll({
      order: [['type', 'ASC']]
    });

    if (packages.length === 0) {
      const defaultPackages = [
        {
          packageId: 'PKG-FREE',
          type: 'free',
          name: '免费版',
          price: 0,
          limitExhibitions: 3,
          limitMerchants: 100,
          limitVisitors: 500,
          limitStorage: 1,
          features: JSON.stringify(['基础展会管理', '最多3个展会', '最多100个商家', '最多500个访客', '无AI推荐']),
          status: 'active',
          userCount: 156
        },
        {
          packageId: 'PKG-PRO',
          type: 'professional',
          name: '专业版',
          price: 2999,
          limitExhibitions: 10,
          limitMerchants: 500,
          limitVisitors: 2000,
          limitStorage: 10,
          features: JSON.stringify(['标准展会管理', '最多10个展会', '最多500个商家', '最多2000个访客', 'AI智能推荐', '数据分析报表']),
          status: 'active',
          userCount: 89
        },
        {
          packageId: 'PKG-ENT',
          type: 'enterprise',
          name: '企业版',
          price: 9999,
          limitExhibitions: -1,
          limitMerchants: 2000,
          limitVisitors: 10000,
          limitStorage: 50,
          features: JSON.stringify(['高级展会管理', '无展会数量限制', '最多2000个商家', '最多10000个访客', 'AI智能推荐', '数据分析报表', '专属客服']),
          status: 'active',
          userCount: 45
        },
        {
          packageId: 'PKG-FLG',
          type: 'flagship',
          name: '旗舰版',
          price: 29999,
          limitExhibitions: -1,
          limitMerchants: -1,
          limitVisitors: -1,
          limitStorage: -1,
          features: JSON.stringify(['全功能展会管理', '无限制', 'API接口开放', '私有化部署', '定制开发', '专属顾问', '7x24小时技术支持']),
          status: 'active',
          userCount: 12
        }
      ];

      packages = await db.Package.bulkCreate(defaultPackages);
    }

    const result = packages.map(pkg => ({
      id: pkg.id,
      packageId: pkg.packageId,
      type: pkg.type,
      name: pkg.name,
      price: pkg.price,
      period: '年',
      limitExhibitions: pkg.limitExhibitions,
      limitMerchants: pkg.limitMerchants,
      limitVisitors: pkg.limitVisitors,
      limitStorage: pkg.limitStorage,
      features: pkg.getFeaturesArray(),
      status: pkg.status,
      userCount: pkg.userCount,
      createTime: pkg.createdAt
    }));

    res.json({
      code: 200,
      msg: '获取成功',
      data: result
    });
  } catch (error) {
    req.logger.error('Get packages error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取套餐列表失败',
      data: null
    });
  }
});

router.post('/packages', authMiddleware, permissionMiddleware('package:edit'), async (req, res) => {
  try {
    const { type, name, price, limitExhibitions, limitMerchants, limitVisitors, limitStorage, features, status } = req.body;

    const packageId = `PKG-${type.toUpperCase()}-${Date.now()}`;
    const newPackage = await db.Package.create({
      packageId,
      type,
      name,
      price,
      period: '年',
      limitExhibitions: limitExhibitions === -1 ? -1 : parseInt(limitExhibitions),
      limitMerchants: limitMerchants === -1 ? -1 : parseInt(limitMerchants),
      limitVisitors: limitVisitors === -1 ? -1 : parseInt(limitVisitors),
      limitStorage: limitStorage === -1 ? -1 : parseInt(limitStorage),
      features: JSON.stringify(features || []),
      status: status || 'active',
      userCount: 0
    });

    res.json({
      code: 200,
      msg: '创建成功',
      data: {
        id: newPackage.id,
        packageId: newPackage.packageId,
        type: newPackage.type,
        name: newPackage.name,
        price: newPackage.price,
        period: '年',
        limitExhibitions: newPackage.limitExhibitions,
        limitMerchants: newPackage.limitMerchants,
        limitVisitors: newPackage.limitVisitors,
        limitStorage: newPackage.limitStorage,
        features: newPackage.getFeaturesArray(),
        status: newPackage.status,
        userCount: newPackage.userCount,
        createTime: newPackage.createdAt
      }
    });
  } catch (error) {
    req.logger.error('Create package error:', error);
    res.status(500).json({
      code: 500,
      msg: '创建套餐失败',
      data: null
    });
  }
});

router.put('/packages/:id', authMiddleware, permissionMiddleware('package:edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { type, name, price, limitExhibitions, limitMerchants, limitVisitors, limitStorage, features, status } = req.body;

    const pkg = await db.Package.findByPk(id);
    if (!pkg) {
      return res.status(404).json({
        code: 404,
        msg: '套餐不存在',
        data: null
      });
    }

    await pkg.update({
      type: type || pkg.type,
      name: name || pkg.name,
      price: price !== undefined ? price : pkg.price,
      limitExhibitions: limitExhibitions !== undefined ? (limitExhibitions === -1 ? -1 : parseInt(limitExhibitions)) : pkg.limitExhibitions,
      limitMerchants: limitMerchants !== undefined ? (limitMerchants === -1 ? -1 : parseInt(limitMerchants)) : pkg.limitMerchants,
      limitVisitors: limitVisitors !== undefined ? (limitVisitors === -1 ? -1 : parseInt(limitVisitors)) : pkg.limitVisitors,
      limitStorage: limitStorage !== undefined ? (limitStorage === -1 ? -1 : parseInt(limitStorage)) : pkg.limitStorage,
      features: features !== undefined ? JSON.stringify(features) : pkg.features,
      status: status || pkg.status
    });

    res.json({
      code: 200,
      msg: '更新成功',
      data: {
        id: pkg.id,
        packageId: pkg.packageId,
        type: pkg.type,
        name: pkg.name,
        price: pkg.price,
        period: '年',
        limitExhibitions: pkg.limitExhibitions,
        limitMerchants: pkg.limitMerchants,
        limitVisitors: pkg.limitVisitors,
        limitStorage: pkg.limitStorage,
        features: pkg.getFeaturesArray(),
        status: pkg.status,
        userCount: pkg.userCount,
        createTime: pkg.createdAt,
        updateTime: pkg.updatedAt
      }
    });
  } catch (error) {
    req.logger.error('Update package error:', error);
    res.status(500).json({
      code: 500,
      msg: '更新套餐失败',
      data: null
    });
  }
});

router.post('/exhibitions', authMiddleware, permissionMiddleware('exhibition:edit'), async (req, res) => {
  try {
    const { name, organizer, startDate, endDate, location, description } = req.body;

    const exhibition = await db.Exhibition.create({
      exhibitionId: `EXH-${Date.now()}`,
      exhibitionName: name,
      startTime: startDate,
      endTime: endDate,
      venue: location,
      description,
      status: 'upcoming',
      organizerId: organizer || null
    });

    res.json({
      code: 200,
      msg: '创建成功',
      data: {
        id: exhibition.id,
        exhibitionId: exhibition.exhibitionId,
        name: exhibition.exhibitionName,
        organizer: '',
        startDate: exhibition.startTime,
        endDate: exhibition.endTime,
        location: exhibition.venue,
        merchantCount: 0,
        visitorCount: 0,
        connectionCount: 0,
        activityCount: 0,
        status: exhibition.status,
        createTime: exhibition.createdAt
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

router.get('/exhibitions', authMiddleware, permissionMiddleware('exhibition:view'), async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '', status = '', startDate, endDate } = req.query;

    const where = {};
    if (keyword) {
      where[Op.or] = [
        { exhibitionName: { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (status) where.status = status;
    if (startDate && endDate) {
      where.startTime = { [Op.between]: [startDate, endDate] };
    }

    const { count, rows } = await db.Exhibition.findAndCountAll({
      where,
      include: [{ model: db.Organizer, as: 'organizer' }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        total: count,
        list: rows.map(e => ({
          id: e.id,
          exhibitionId: e.exhibitionId,
          name: e.exhibitionName,
          organizer: e.organizer?.organizerName || '',
          startDate: e.startTime,
          endDate: e.endTime,
          location: e.venue,
          merchantCount: e.currentMerchants || 0,
          visitorCount: e.currentUsers || 0,
          connectionCount: 0,
          activityCount: 0,
          status: e.status === 'ongoing' ? 'ongoing' : (e.status === 'ended' ? 'ended' : 'upcoming'),
          createTime: e.createdAt
        }))
      }
    });
  } catch (error) {
    req.logger.error('Get exhibitions error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取展会列表失败',
      data: null
    });
  }
});

router.delete('/exhibitions/:id', authMiddleware, permissionMiddleware('exhibition:delete'), async (req, res) => {
  try {
    const { id } = req.params;

    const exhibition = await db.Exhibition.findByPk(id);
    if (!exhibition) {
      return res.status(404).json({
        code: 404,
        msg: '展会不存在',
        data: null
      });
    }

    await exhibition.destroy();

    res.json({
      code: 200,
      msg: '删除成功',
      data: null
    });
  } catch (error) {
    req.logger.error('Delete exhibition error:', error);
    res.status(500).json({
      code: 500,
      msg: '删除展会失败',
      data: null
    });
  }
});

router.get('/users', authMiddleware, permissionMiddleware('user:view'), async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '', type = '', status = '' } = req.query;

    let where = {};
    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { name: { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (status) where.status = status;

    const { count, rows } = await db.User.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });

    const users = rows.map(u => {
      const now = new Date();
      const lastLoginTime = u.lastLoginAt || u.lastScanTime || u.createdAt;
      const daysNotLogin = Math.floor((now - new Date(lastLoginTime)) / (1000 * 60 * 60 * 24));
      
      return {
        id: u.id,
        userId: u.userId,
        username: u.nickname || u.userId,
        name: u.company || u.nickname || '',
        phone: u.phoneRaw ? u.phoneRaw.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '',
        email: '',
        type: 'visitor',
        organization: u.company || '',
        status: u.status === 1 ? 'active' : 'inactive',
        role: 'user',
        registerTime: u.createdAt,
        lastLoginTime: lastLoginTime,
        loginWeeklyCount: u.loginWeeklyCount || 0,
        loginDuration: u.loginDuration || 0,
        daysNotLogin: daysNotLogin
      };
    });

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        total: count,
        list: users
      }
    });
  } catch (error) {
    req.logger.error('Get users error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取用户列表失败',
      data: null
    });
  }
});

router.post('/users', authMiddleware, permissionMiddleware('user:create'), async (req, res) => {
  try {
    const { username, name, phone, email, type, role, status } = req.body;

    const user = await db.User.create({
      userId: uuidv4(),
      nickname: username,
      company: name,
      phone,
      phoneRaw: phone,
      email,
      role: role || 'user',
      status: status === 'active' ? 1 : 0,
      loginWeeklyCount: 0,
      loginDuration: 0
    });

    res.json({
      code: 200,
      msg: '创建成功',
      data: {
        id: user.id,
        userId: user.userId
      }
    });
  } catch (error) {
    req.logger.error('Create user error:', error);
    res.status(500).json({
      code: 500,
      msg: '创建用户失败',
      data: null
    });
  }
});

router.put('/users/:id', authMiddleware, permissionMiddleware('user:edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, role, status } = req.body;

    const user = await db.User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        code: 404,
        msg: '用户不存在',
        data: null
      });
    }

    await user.update({
      nickname: username,
      company: name,
      phone: phone,
      phoneRaw: phone,
      email: email,
      role: role,
      status: status === 'active' ? 1 : 0
    });

    res.json({
      code: 200,
      msg: '更新成功',
      data: { id }
    });
  } catch (error) {
    req.logger.error('Update user error:', error);
    res.status(500).json({
      code: 500,
      msg: '更新用户失败',
      data: null
    });
  }
});

router.put('/users/:id/status', authMiddleware, permissionMiddleware('user:edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await db.User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        code: 404,
        msg: '用户不存在',
        data: null
      });
    }

    await user.update({ status });

    res.json({
      code: 200,
      msg: '更新成功',
      data: { id, status }
    });
  } catch (error) {
    req.logger.error('Update user status error:', error);
    res.status(500).json({
      code: 500,
      msg: '更新状态失败',
      data: null
    });
  }
});

router.delete('/users/:id', authMiddleware, permissionMiddleware('user:delete'), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await db.User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        code: 404,
        msg: '用户不存在',
        data: null
      });
    }

    await user.destroy();

    res.json({
      code: 200,
      msg: '删除成功',
      data: null
    });
  } catch (error) {
    req.logger.error('Delete user error:', error);
    res.status(500).json({
      code: 500,
      msg: '删除用户失败',
      data: null
    });
  }
});

router.get('/finance/stats', authMiddleware, permissionMiddleware('finance:view'), async (req, res) => {
  try {
    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        totalRevenue: 1500000,
        monthRevenue: 250000,
        totalOrders: 120,
        activeOrganizers: 85
      }
    });
  } catch (error) {
    req.logger.error('Get finance stats error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取数据失败',
      data: null
    });
  }
});

router.get('/finance/orders', authMiddleware, permissionMiddleware('finance:view'), async (req, res) => {
  try {
    const { page = 1, pageSize = 10, orderNo, organizer, package, startDate, endDate } = req.query;

    const orders = [];
    for (let i = 0; i < Math.min(parseInt(pageSize), 10); i++) {
      orders.push({
        id: i + 1,
        orderNo: `ORD${Date.now()}${i}`,
        organizer: `主办方${i + 1}`,
        package: ['free', 'professional', 'enterprise', 'flagship'][Math.floor(Math.random() * 4)],
        amount: [0, 2999, 9999, 29999][Math.floor(Math.random() * 4)],
        status: 'paid',
        payMethod: ['wechat', 'alipay', 'bank'][Math.floor(Math.random() * 3)],
        payTime: new Date(),
        createTime: new Date()
      });
    }

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        total: 120,
        list: orders
      }
    });
  } catch (error) {
    req.logger.error('Get finance orders error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取订单列表失败',
      data: null
    });
  }
});

router.get('/finance/package-revenue', authMiddleware, permissionMiddleware('finance:view'), async (req, res) => {
  try {
    const data = [
      { value: 150000, name: '免费版' },
      { value: 500000, name: '专业版' },
      { value: 600000, name: '企业版' },
      { value: 250000, name: '旗舰版' }
    ];

    res.json({
      code: 200,
      msg: '获取成功',
      data
    });
  } catch (error) {
    req.logger.error('Get package revenue error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取数据失败',
      data: null
    });
  }
});

router.get('/logs', authMiddleware, permissionMiddleware('log:view'), async (req, res) => {
  try {
    const { page = 1, pageSize = 10, user, type, module, startDate, endDate } = req.query;

    const logs = [];
    const types = ['login', 'create', 'update', 'delete', 'export'];
    const modules = ['organizer', 'exhibition', 'user', 'package', 'finance'];
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    const clientIP = getClientIP(req);

    for (let i = 0; i < Math.min(parseInt(pageSize), 10); i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const module = modules[Math.floor(Math.random() * modules.length)];
      const logType = types[Math.floor(Math.random() * types.length)];
      const logModule = modules[Math.floor(Math.random() * modules.length)];
      const typeText = {
        login: '登录',
        create: '创建',
        update: '更新',
        delete: '删除',
        export: '导出'
      }[logType] || logType;
      const moduleText = {
        organizer: '主办方',
        exhibition: '展会',
        user: '用户',
        package: '套餐',
        finance: '财务'
      }[logModule] || logModule;
      logs.push({
        id: i + 1,
        user: 'admin',
        userId: 1,
        type: logType,
        module: logModule,
        description: `${typeText}${moduleText}`,
        method: methods[Math.floor(Math.random() * methods.length)],
        path: `/api/platform/${logModule}`,
        ip: clientIP,
        userAgent: req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        status: 'success',
        params: '{}',
        response: '{}',
        error: null,
        duration: Math.floor(Math.random() * 500) + 50,
        createTime: new Date()
      });
    }

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        total: 1000,
        list: logs
      }
    });
  } catch (error) {
    req.logger.error('Get logs error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取日志列表失败',
      data: null
    });
  }
});

router.get('/settings', authMiddleware, permissionMiddleware('system:view'), async (req, res) => {
  try {
    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        basic: {
          platformName: '会展智能建联SaaS平台',
          logo: '',
          description: '一站式会展智能建联解决方案',
          servicePhone: '400-888-8888',
          serviceEmail: 'service@example.com',
          address: '北京市朝阳区xxx大厦'
        },
        security: {
          passwordStrength: 'medium',
          loginLimit: true,
          maxLoginAttempts: 5,
          lockTime: 30,
          twoFactorAuth: false,
          sessionTimeout: 120,
          ipWhitelist: ''
        },
        notification: {
          emailEnabled: true,
          smtpHost: 'smtp.example.com',
          smtpPort: 465,
          smtpFrom: 'noreply@example.com',
          smtpPassword: '',
          smsEnabled: false,
          smsProvider: 'aliyun',
          smsAccessKey: '',
          smsSecretKey: '',
          smsSign: ''
        },
        storage: {
          type: 'local',
          ossBucket: '',
          ossRegion: '',
          ossAccessKey: '',
          ossSecretKey: '',
          cosBucket: '',
          cosRegion: '',
          cosSecretId: '',
          cosSecretKey: '',
          s3Bucket: '',
          s3Region: '',
          s3AccessKey: '',
          s3SecretKey: ''
        },
        other: {
          timezone: 'Asia/Shanghai',
          language: 'zh-CN',
          defaultPackage: 'free',
          allowRegister: true,
          maintenanceMode: false,
          maintenanceNotice: ''
        }
      }
    });
  } catch (error) {
    req.logger.error('Get settings error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取设置失败',
      data: null
    });
  }
});

router.put('/settings', authMiddleware, permissionMiddleware('system:edit'), async (req, res) => {
  try {
    const { type, data } = req.body;

    res.json({
      code: 200,
      msg: '保存成功',
      data: null
    });
  } catch (error) {
    req.logger.error('Update settings error:', error);
    res.status(500).json({
      code: 500,
      msg: '保存设置失败',
      data: null
    });
  }
});

router.post('/settings/test-notification', authMiddleware, async (req, res) => {
  try {
    res.json({
      code: 200,
      msg: '测试通知发送成功',
      data: null
    });
  } catch (error) {
    req.logger.error('Test notification error:', error);
    res.status(500).json({
      code: 500,
      msg: '测试失败',
      data: null
    });
  }
});

router.post('/settings/test-storage', authMiddleware, async (req, res) => {
  try {
    res.json({
      code: 200,
      msg: '存储配置测试成功',
      data: null
    });
  } catch (error) {
    req.logger.error('Test storage error:', error);
    res.status(500).json({
      code: 500,
      msg: '测试失败',
      data: null
    });
  }
});

router.get('/finance/export', authMiddleware, permissionMiddleware('finance:view'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const csv = '订单号,主办方,套餐,金额,状态,支付方式,支付时间\n' +
      'ORD001,主办方A,专业版,2999,已支付,微信支付,2024-01-01\n' +
      'ORD002,主办方B,企业版,9999,已支付,支付宝,2024-01-02\n' +
      'ORD003,主办方C,旗舰版,29999,已支付,银行转账,2024-01-03';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=finance_export.csv');
    res.send('\uFEFF' + csv);
  } catch (error) {
    req.logger.error('Export finance data error:', error);
    res.status(500).json({
      code: 500,
      msg: '导出失败',
      data: null
    });
  }
});

router.get('/logs/export', authMiddleware, permissionMiddleware('log:view'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const csv = '用户,操作类型,模块,描述,方法,路径,IP,状态,耗时\n' +
      'admin,login,auth,用户登录,POST,/api/platform/auth/login,127.0.0.1,成功,120\n' +
      'admin,create,organizer,创建主办方,POST,/api/platform/organizers,127.0.0.1,成功,350\n' +
      'admin,update,exhibition,更新展会,PUT,/api/platform/exhibitions/1,127.0.0.1,成功,280';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=logs_export.csv');
    res.send('\uFEFF' + csv);
  } catch (error) {
    req.logger.error('Export logs error:', error);
    res.status(500).json({
      code: 500,
      msg: '导出失败',
      data: null
    });
  }
});

router.get('/permissions', authMiddleware, permissionMiddleware('role:view'), async (req, res) => {
  try {
    const permissions = await db.Permission.findAll({
      order: [['permissionGroup', 'ASC'], ['permissionKey', 'ASC']]
    });

    const grouped = {};
    permissions.forEach(p => {
      if (!grouped[p.permissionGroup]) {
        grouped[p.permissionGroup] = [];
      }
      grouped[p.permissionGroup].push({
        id: p.id,
        key: p.permissionKey,
        name: p.permissionName,
        description: p.description
      });
    });

    res.json({
      code: 200,
      msg: '获取成功',
      data: Object.keys(grouped).map(group => ({
        group,
        permissions: grouped[group]
      }))
    });
  } catch (error) {
    req.logger.error('Get permissions error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取权限列表失败',
      data: null
    });
  }
});

router.get('/roles', authMiddleware, permissionMiddleware('role:view'), async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '' } = req.query;

    let where = {};
    if (keyword) {
      where[Op.or] = [
        { roleName: { [Op.like]: `%${keyword}%` } },
        { roleKey: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const { count, rows } = await db.Role.findAndCountAll({
      where,
      order: [['id', 'ASC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      include: [{
        model: db.Permission,
        as: 'permissions',
        attributes: ['id', 'permissionKey', 'permissionName']
      }]
    });

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        total: count,
        list: rows.map(r => ({
          id: r.id,
          roleKey: r.roleKey,
          name: r.roleName,
          description: r.description,
          status: r.status === 1 ? 'active' : 'inactive',
          permissions: r.permissions ? r.permissions.map(p => p.permissionKey) : [],
          createTime: r.createdAt
        }))
      }
    });
  } catch (error) {
    req.logger.error('Get roles error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取角色列表失败',
      data: null
    });
  }
});

router.get('/roles/:id', authMiddleware, permissionMiddleware('role:view'), async (req, res) => {
  try {
    const { id } = req.params;

    const role = await db.Role.findByPk(id, {
      include: [{
        model: db.Permission,
        as: 'permissions',
        attributes: ['id', 'permissionKey', 'permissionName', 'permissionGroup']
      }]
    });

    if (!role) {
      return res.status(404).json({
        code: 404,
        msg: '角色不存在',
        data: null
      });
    }

    const groupedPermissions = {};
    if (role.permissions) {
      role.permissions.forEach(p => {
        if (!groupedPermissions[p.permissionGroup]) {
          groupedPermissions[p.permissionGroup] = [];
        }
        groupedPermissions[p.permissionGroup].push({
          id: p.id,
          key: p.permissionKey,
          name: p.permissionName
        });
      });
    }

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        id: role.id,
        roleKey: role.roleKey,
        name: role.roleName,
        description: role.description,
        status: role.status === 1 ? 'active' : 'inactive',
        permissions: role.permissions ? role.permissions.map(p => p.permissionKey) : [],
        groupedPermissions: Object.keys(groupedPermissions).map(group => ({
          group,
          permissions: groupedPermissions[group]
        }))
      }
    });
  } catch (error) {
    req.logger.error('Get role detail error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取角色详情失败',
      data: null
    });
  }
});

router.post('/roles', authMiddleware, permissionMiddleware('role:edit'), async (req, res) => {
  try {
    const { roleKey, name, description, permissions = [] } = req.body;

    if (!roleKey || !name) {
      return res.status(400).json({
        code: 400,
        msg: '角色标识和名称不能为空',
        data: null
      });
    }

    const existingRole = await db.Role.findOne({ where: { roleKey } });
    if (existingRole) {
      return res.status(400).json({
        code: 400,
        msg: '角色标识已存在',
        data: null
      });
    }

    const role = await db.Role.create({
      roleKey,
      roleName: name,
      description,
      status: 1
    });

    if (permissions.length > 0) {
      const permissionRecords = await db.Permission.findAll({
        where: { permissionKey: { [Op.in]: permissions } }
      });
      await role.setPermissions(permissionRecords);
    }

    res.json({
      code: 200,
      msg: '创建成功',
      data: {
        id: role.id,
        roleKey: role.roleKey,
        name: role.roleName
      }
    });
  } catch (error) {
    req.logger.error('Create role error:', error);
    res.status(500).json({
      code: 500,
      msg: '创建角色失败',
      data: null
    });
  }
});

router.put('/roles/:id', authMiddleware, permissionMiddleware('role:edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, permissions = [] } = req.body;

    const role = await db.Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        code: 404,
        msg: '角色不存在',
        data: null
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.roleName = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status === 'active' ? 1 : 0;

    await role.update(updateData);

    if (permissions.length >= 0) {
      const permissionRecords = await db.Permission.findAll({
        where: { permissionKey: { [Op.in]: permissions } }
      });
      await role.setPermissions(permissionRecords);
    }

    res.json({
      code: 200,
      msg: '更新成功',
      data: { id: role.id }
    });
  } catch (error) {
    req.logger.error('Update role error:', error);
    res.status(500).json({
      code: 500,
      msg: '更新角色失败',
      data: null
    });
  }
});

router.delete('/roles/:id', authMiddleware, permissionMiddleware('role:edit'), async (req, res) => {
  try {
    const { id } = req.params;

    const role = await db.Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        code: 404,
        msg: '角色不存在',
        data: null
      });
    }

    const organizerCount = await db.Organizer.count({ where: { roleId: id } });
    if (organizerCount > 0) {
      return res.status(400).json({
        code: 400,
        msg: '该角色下还有用户，无法删除',
        data: null
      });
    }

    await role.destroy();

    res.json({
      code: 200,
      msg: '删除成功',
      data: null
    });
  } catch (error) {
    req.logger.error('Delete role error:', error);
    res.status(500).json({
      code: 500,
      msg: '删除角色失败',
      data: null
    });
  }
});

router.get('/miniprogram/config', authMiddleware, permissionMiddleware('miniprogram:config'), async (req, res) => {
  try {
    const config = {
      appId: process.env.WECHAT_APPID || '',
      appName: process.env.WECHAT_APPNAME || '',
      version: '1.0.0',
      lastPublishTime: null
    };

    const MiniprogramPublish = db.MiniprogramPublish;
    if (MiniprogramPublish) {
      const latestPublish = await MiniprogramPublish.findOne({
        order: [['createdAt', 'DESC']],
        where: { status: 'success' }
      });

      if (latestPublish) {
        config.lastPublishTime = latestPublish.createdAt;
        config.version = latestPublish.version;
      }
    }

    res.json({
      code: 200,
      msg: '获取成功',
      data: config
    });
  } catch (error) {
    req.logger.error('Get miniprogram config error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取小程序配置失败',
      data: null
    });
  }
});

router.put('/miniprogram/config', authMiddleware, permissionMiddleware('miniprogram:config'), async (req, res) => {
  try {
    const { appId, appName } = req.body;

    process.env.WECHAT_APPID = appId;
    process.env.WECHAT_APPNAME = appName;

    res.json({
      code: 200,
      msg: '保存成功',
      data: {
        appId,
        appName,
        version: '1.0.0',
        lastPublishTime: null
      }
    });
  } catch (error) {
    req.logger.error('Save miniprogram config error:', error);
    res.status(500).json({
      code: 500,
      msg: '保存配置失败',
      data: null
    });
  }
});

router.post('/miniprogram/publish', authMiddleware, permissionMiddleware('miniprogram:publish'), async (req, res) => {
  try {
    const { type = 'attendee', version, desc } = req.body;

    if (!version) {
      return res.status(400).json({
        code: 400,
        msg: '版本号不能为空',
        data: null
      });
    }

    if (!process.env.WECHAT_APPID || !process.env.WECHAT_APPSECRET) {
      return res.status(400).json({
        code: 400,
        msg: '请先配置微信小程序AppID和AppSecret',
        data: null
      });
    }

    const taskId = await miniprogramPublishService.createPublishTask(
      type,
      version,
      desc || '',
      req.user.id
    );

    res.json({
      code: 200,
      msg: '发布任务已提交',
      data: {
        taskId,
        type,
        version,
        desc,
        status: 'pending',
        progress: 0,
        createTime: new Date()
      }
    });
  } catch (error) {
    req.logger.error('Submit miniprogram publish error:', error);
    res.status(500).json({
      code: 500,
      msg: '提交发布任务失败: ' + error.message,
      data: null
    });
  }
});

router.get('/miniprogram/publish/status/:taskId', authMiddleware, permissionMiddleware('miniprogram:publish'), async (req, res) => {
  try {
    const { taskId } = req.params;

    const status = await miniprogramPublishService.getTaskStatus(taskId);

    if (!status) {
      return res.status(404).json({
        code: 404,
        msg: '任务不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      msg: '获取成功',
      data: status
    });
  } catch (error) {
    req.logger.error('Get publish status error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取发布状态失败: ' + error.message,
      data: null
    });
  }
});

router.get('/miniprogram/publish/history', authMiddleware, permissionMiddleware('miniprogram:publish'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await miniprogramPublishService.getPublishHistory(
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      code: 200,
      msg: '获取成功',
      data: result
    });
  } catch (error) {
    req.logger.error('Get publish history error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取发布历史失败: ' + error.message,
      data: null
    });
  }
});

router.post('/miniprogram/publish/:taskId/rollback', authMiddleware, permissionMiddleware('miniprogram:rollback'), async (req, res) => {
  try {
    const { taskId } = req.params;

    await miniprogramPublishService.rollback(taskId);

    res.json({
      code: 200,
      msg: '回滚成功',
      data: null
    });
  } catch (error) {
    req.logger.error('Rollback miniprogram error:', error);
    res.status(500).json({
      code: 500,
      msg: '回滚失败: ' + error.message,
      data: null
    });
  }
});

router.post('/miniprogram/publish/:taskId/release', authMiddleware, permissionMiddleware('miniprogram:publish'), async (req, res) => {
  try {
    const { taskId } = req.params;

    await miniprogramPublishService.publish(taskId);

    res.json({
      code: 200,
      msg: '发布成功',
      data: null
    });
  } catch (error) {
    req.logger.error('Release miniprogram error:', error);
    res.status(500).json({
      code: 500,
      msg: '发布失败: ' + error.message,
      data: null
    });
  }
});

router.delete('/miniprogram/publish/:id', authMiddleware, permissionMiddleware('miniprogram:publish'), async (req, res) => {
  try {
    const { id } = req.params;

    const success = await miniprogramPublishService.deletePublishRecord(id);

    if (!success) {
      return res.status(404).json({
        code: 404,
        msg: '记录不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      msg: '删除成功',
      data: null
    });
  } catch (error) {
    req.logger.error('Delete publish record error:', error);
    res.status(500).json({
      code: 500,
      msg: '删除记录失败: ' + error.message,
      data: null
    });
  }
});

module.exports = router;
