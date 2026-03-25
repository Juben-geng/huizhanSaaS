const { Quota, Organizer, Exhibition } = require('../models');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class QuotaManager {
  constructor() {
    this.quotaLimits = {
      free: {
        api_calls: { daily: 1000, monthly: 30000 },
        storage: { total: 1073741824 },
        concurrent_users: { instant: 50 },
        bandwidth: { monthly: 107374182400 },
        virtual_rooms: { total: 0 },
        ai_recommendations: { daily: 100 }
      },
      professional: {
        api_calls: { daily: 10000, monthly: 300000 },
        storage: { total: 10737418240 },
        concurrent_users: { instant: 500 },
        bandwidth: { monthly: 1073741824000 },
        virtual_rooms: { total: 100 },
        ai_recommendations: { daily: 1000 }
      },
      enterprise: {
        api_calls: { daily: 100000, monthly: 3000000 },
        storage: { total: 107374182400 },
        concurrent_users: { instant: 5000 },
        bandwidth: { monthly: 10737418240000 },
        virtual_rooms: { total: 999999 },
        ai_recommendations: { daily: 10000 }
      }
    };
  }

  async checkQuota(organizerId, quotaType, exhibitionId = null, amount = 1) {
    try {
      const where = { organizerId, quotaType };
      if (exhibitionId) {
        where.exhibitionId = exhibitionId;
      }

      const quota = await Quota.findOne({ where });

      if (!quota) {
        logger.warn(`Quota not found for organizer ${organizerId}, type ${quotaType}`);
        return { allowed: false, message: '额度不存在' };
      }

      await this.checkAndResetQuota(quota);

      if (quota.remainQuota < amount) {
        await this.handleOveruse(quota, amount);
        logger.warn(`Quota exceeded for organizer ${organizerId}, type ${quotaType}`);
        return { 
          allowed: false, 
          message: '额度不足',
          remainQuota: quota.remainQuota,
          totalQuota: quota.totalQuota
        };
      }

      await this.checkAlertThreshold(quota);

      return { 
        allowed: true, 
        message: '额度充足',
        remainQuota: quota.remainQuota,
        totalQuota: quota.totalQuota
      };
    } catch (error) {
      logger.error('Error checking quota:', error);
      return { allowed: false, message: '额度检查失败' };
    }
  }

  async useQuota(organizerId, quotaType, exhibitionId = null, amount = 1) {
    try {
      const checkResult = await this.checkQuota(organizerId, quotaType, exhibitionId, amount);

      if (!checkResult.allowed) {
        return checkResult;
      }

      const where = { organizerId, quotaType };
      if (exhibitionId) {
        where.exhibitionId = exhibitionId;
      }

      const quota = await Quota.findOne({ where });

      await quota.update({
        usedQuota: quota.usedQuota + amount,
        remainQuota: quota.remainQuota - amount
      });

      logger.info(`Quota used: organizer ${organizerId}, type ${quotaType}, amount ${amount}`);

      return { 
        allowed: true, 
        message: '额度使用成功',
        remainQuota: quota.remainQuota,
        totalQuota: quota.totalQuota
      };
    } catch (error) {
      logger.error('Error using quota:', error);
      return { allowed: false, message: '额度使用失败' };
    }
  }

  async refundQuota(organizerId, quotaType, exhibitionId = null, amount = 1) {
    try {
      const where = { organizerId, quotaType };
      if (exhibitionId) {
        where.exhibitionId = exhibitionId;
      }

      const quota = await Quota.findOne({ where });

      if (!quota) {
        return { success: false, message: '额度不存在' };
      }

      const refundAmount = Math.min(amount, quota.usedQuota);

      await quota.update({
        usedQuota: quota.usedQuota - refundAmount,
        remainQuota: quota.remainQuota + refundAmount
      });

      logger.info(`Quota refunded: organizer ${organizerId}, type ${quotaType}, amount ${refundAmount}`);

      return { success: true, message: '额度退回成功' };
    } catch (error) {
      logger.error('Error refunding quota:', error);
      return { success: false, message: '额度退回失败' };
    }
  }

  async initializeQuota(organizerId, packageType, exhibitionId = null) {
    try {
      const limits = this.quotaLimits[packageType] || this.quotaLimits.free;

      const quotaPromises = Object.keys(limits).map(async (quotaType) => {
        const typeLimits = limits[quotaType];

        for (const period of Object.keys(typeLimits)) {
          const quotaId = uuidv4();

          let totalQuota = typeLimits[period];
          let unit = this.getQuotaUnit(quotaType);

          await Quota.create({
            quotaId,
            organizerId,
            exhibitionId,
            quotaType,
            totalQuota,
            usedQuota: 0,
            remainQuota: totalQuota,
            unit,
            resetPeriod: period === 'total' ? 'none' : period,
            lastResetTime: new Date(),
            nextResetTime: this.calculateNextResetTime(period),
            status: 1
          });
        }
      });

      await Promise.all(quotaPromises);

      logger.info(`Quota initialized for organizer ${organizerId}, package ${packageType}`);
      return { success: true, message: '额度初始化成功' };
    } catch (error) {
      logger.error('Error initializing quota:', error);
      return { success: false, message: '额度初始化失败' };
    }
  }

  async getQuotaUsage(organizerId, exhibitionId = null) {
    try {
      const where = { organizerId };
      if (exhibitionId) {
        where.exhibitionId = exhibitionId;
      }

      const quotas = await Quota.findAll({ where });

      const usage = {};
      quotas.forEach(quota => {
        const key = quota.exhibitionId 
          ? `${quota.quotaType}_${quota.exhibitionId}` 
          : quota.quotaType;

        if (!usage[quota.quotaType]) {
          usage[quota.quotaType] = [];
        }

        usage[quota.quotaType].push({
          exhibitionId: quota.exhibitionId,
          totalQuota: quota.totalQuota,
          usedQuota: quota.usedQuota,
          remainQuota: quota.remainQuota,
          unit: quota.unit,
          usagePercent: quota.totalQuota > 0 
            ? Math.round((quota.usedQuota / quota.totalQuota) * 100) 
            : 0,
          resetPeriod: quota.resetPeriod,
          nextResetTime: quota.nextResetTime
        });
      });

      return { success: true, data: usage };
    } catch (error) {
      logger.error('Error getting quota usage:', error);
      return { success: false, message: '获取额度使用情况失败' };
    }
  }

  async checkAndResetQuota(quota) {
    if (quota.resetPeriod === 'none') {
      return;
    }

    const now = new Date();
    if (quota.nextResetTime && now >= quota.nextResetTime) {
      await quota.update({
        usedQuota: 0,
        remainQuota: quota.totalQuota,
        lastResetTime: now,
        nextResetTime: this.calculateNextResetTime(quota.resetPeriod),
        isAlerted: false
      });

      logger.info(`Quota reset: ${quota.quotaId}, period ${quota.resetPeriod}`);
    }
  }

  async checkAlertThreshold(quota) {
    if (quota.alertThreshold <= 0) {
      return;
    }

    const usagePercent = quota.totalQuota > 0 
      ? (quota.usedQuota / quota.totalQuota) * 100 
      : 0;

    if (usagePercent >= quota.alertThreshold && !quota.isAlerted) {
      await quota.update({ isAlerted: true });
      
      logger.warn(`Quota alert: organizer ${quota.organizerId}, type ${quota.quotaType}, usage ${usagePercent.toFixed(2)}%`);
      
      this.sendQuotaAlert(quota, usagePercent);
    }
  }

  async handleOveruse(quota, requestedAmount) {
    switch (quota.overuseAction) {
      case 'limit':
        break;
      case 'throttle':
        logger.warn(`Quota throttled for organizer ${quota.organizerId}`);
        break;
      case 'charge':
        logger.warn(`Overuse charge triggered for organizer ${quota.organizerId}`);
        break;
      case 'allow':
        logger.warn(`Overuse allowed for organizer ${quota.organizerId}`);
        break;
    }
  }

  sendQuotaAlert(quota, usagePercent) {
    logger.info(`Sending quota alert notification to organizer ${quota.organizerId}`);
  }

  calculateNextResetTime(resetPeriod) {
    const now = new Date();
    
    switch (resetPeriod) {
      case 'daily':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow;
      case 'weekly':
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(0, 0, 0, 0);
        return nextWeek;
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        nextMonth.setHours(0, 0, 0, 0);
        return nextMonth;
      case 'yearly':
        const nextYear = new Date(now);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        nextYear.setMonth(0);
        nextYear.setDate(1);
        nextYear.setHours(0, 0, 0, 0);
        return nextYear;
      default:
        return null;
    }
  }

  getQuotaUnit(quotaType) {
    const units = {
      api_calls: '次',
      storage: '字节',
      concurrent_users: '人',
      bandwidth: '字节',
      virtual_rooms: '个',
      ai_recommendations: '次'
    };
    return units[quotaType] || '';
  }

  async upgradePackage(organizerId, oldPackage, newPackage, exhibitionId = null) {
    try {
      const oldQuotas = await Quota.findAll({ 
        where: { organizerId, exhibitionId } 
      });

      for (const quota of oldQuotas) {
        await quota.update({ status: 0 });
      }

      await this.initializeQuota(organizerId, newPackage, exhibitionId);

      logger.info(`Package upgraded: organizer ${organizerId}, ${oldPackage} -> ${newPackage}`);
      return { success: true, message: '套餐升级成功' };
    } catch (error) {
      logger.error('Error upgrading package:', error);
      return { success: false, message: '套餐升级失败' };
    }
  }
}

module.exports = new QuotaManager();
