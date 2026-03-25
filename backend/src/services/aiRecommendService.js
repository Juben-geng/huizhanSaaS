const { Merchant, User, UserPreference, AIRecommendation, Connection } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class AIRecommendService {
  constructor() {
    this.industryWeights = {
      exact_match: 1.0,
      related_industry: 0.7,
      broad_industry: 0.4
    };
    
    this.behaviorWeights = {
      scan_history: 0.3,
      material_view: 0.25,
      search_history: 0.2,
      intention_level: 0.25
    };
  }

  async generateRecommendations(userId, exhibitionId, limit = 10) {
    try {
      const user = await User.findOne({ where: { userId } });
      if (!user) {
        throw new Error('User not found');
      }

      const preference = await UserPreference.findOne({ 
        where: { userId: user.id } 
      });

      const connectedMerchantIds = await Connection.findAll({
        where: { userId: user.id },
        attributes: ['merchantId']
      }).then(conns => conns.map(c => c.merchantId));

      const merchants = await Merchant.findAll({
        where: {
          exhibitionId,
          id: { [Op.notIn]: connectedMerchantIds }
        }
      });

      const scoredMerchants = merchants.map(merchant => {
        const score = this.calculateMatchScore(user, preference, merchant);
        return {
          merchant,
          score,
          reason: this.generateMatchReason(user, preference, merchant)
        };
      });

      scoredMerchants.sort((a, b) => b.score - a.score);

      const topMerchants = scoredMerchants.slice(0, limit);

      for (const item of topMerchants) {
        await AIRecommendation.create({
          recommendationId: require('uuid').v4(),
          userId: user.id,
          merchantId: item.merchant.id,
          exhibitionId,
          matchScore: item.score,
          matchReason: item.reason,
          recommendationType: 'ai_based',
          isViewed: false,
          isConnected: false
        });
      }

      logger.info(`Generated ${topMerchants.length} recommendations for user ${userId}`);
      
      return {
        success: true,
        recommendations: topMerchants.map(item => ({
          merchantId: item.merchant.merchantId,
          merchantName: item.merchant.merchantName,
          industry: item.merchant.industry,
          logo: item.merchant.logo,
          boothNumber: item.merchant.boothNumber,
          matchScore: item.score,
          matchReason: item.reason
        }))
      };
    } catch (error) {
      logger.error('Error generating recommendations:', error);
      return { success: false, message: '生成推荐失败' };
    }
  }

  calculateMatchScore(user, preference, merchant) {
    let totalScore = 0;

    if (preference) {
      if (preference.preferredIndustries) {
        const preferredIndustries = JSON.parse(preference.preferredIndustries || '[]');
        if (preferredIndustries.includes(merchant.industry)) {
          totalScore += 40;
        }
      }

      if (preference.scanHistory) {
        const scanHistory = JSON.parse(preference.scanHistory || '[]');
        const scannedIndustries = scanHistory.map(s => s.industry);
        if (scannedIndustries.includes(merchant.industry)) {
          totalScore += 25;
        }
      }

      if (preference.materialViewHistory) {
        const materialViewHistory = JSON.parse(preference.materialViewHistory || '[]');
        const viewedIndustries = materialViewHistory.map(v => v.industry);
        if (viewedIndustries.includes(merchant.industry)) {
          totalScore += 20;
        }
      }

      if (preference.intentionLevel) {
        const intentionScores = { high: 15, medium: 10, low: 5 };
        totalScore += intentionScores[preference.intentionLevel] || 0;
      }

      if (preference.activityLevel) {
        const activityScores = { high: 10, medium: 7, low: 3 };
        totalScore += activityScores[preference.activityLevel] || 0;
      }
    }

    if (merchant.hasVirtualRoom) {
      totalScore += 15;
    }

    if (merchant.onlineStatus) {
      totalScore += 10;
    }

    totalScore += Math.min(merchant.connectionCount * 0.5, 20);

    return Math.min(Math.round(totalScore), 100);
  }

  generateMatchReason(user, preference, merchant) {
    const reasons = [];

    if (preference && preference.preferredIndustries) {
      const preferredIndustries = JSON.parse(preference.preferredIndustries || '[]');
      if (preferredIndustries.includes(merchant.industry)) {
        reasons.push(`符合您关注的${merchant.industry}行业`);
      }
    }

    if (merchant.hasVirtualRoom) {
      reasons.push('支持线上虚拟展厅');
    }

    if (merchant.connectionCount > 50) {
      reasons.push('热门展商，建联活跃');
    }

    if (merchant.boothZone) {
      reasons.push(`位于${merchant.boothZone}展区`);
    }

    return reasons.length > 0 ? reasons.join('，') : '基于您的浏览行为推荐';
  }

  async updatePreference(userId, action, data) {
    try {
      const user = await User.findOne({ where: { userId } });
      if (!user) {
        throw new Error('User not found');
      }

      let preference = await UserPreference.findOne({ 
        where: { userId: user.id } 
      });

      if (!preference) {
        preference = await UserPreference.create({
          userId: user.id,
          preferredIndustries: '[]',
          scanHistory: '[]',
          materialViewHistory: '[]',
          searchHistory: '[]',
          behaviorTags: '[]',
          intentionLevel: 'medium',
          activityLevel: 'low'
        });
      }

      switch (action) {
        case 'scan':
          const scanHistory = JSON.parse(preference.scanHistory || '[]');
          scanHistory.unshift({
            merchantId: data.merchantId,
            industry: data.industry,
            timestamp: new Date().toISOString()
          });
          preference.scanHistory = JSON.stringify(scanHistory.slice(0, 100));
          break;

        case 'view_material':
          const materialViewHistory = JSON.parse(preference.materialViewHistory || '[]');
          materialViewHistory.unshift({
            materialId: data.materialId,
            industry: data.industry,
            timestamp: new Date().toISOString()
          });
          preference.materialViewHistory = JSON.stringify(materialViewHistory.slice(0, 100));
          break;

        case 'search':
          const searchHistory = JSON.parse(preference.searchHistory || '[]');
          searchHistory.unshift({
            keyword: data.keyword,
            timestamp: new Date().toISOString()
          });
          preference.searchHistory = JSON.stringify(searchHistory.slice(0, 50));
          break;

        case 'update_industry':
          const preferredIndustries = JSON.parse(preference.preferredIndustries || '[]');
          if (!preferredIndustries.includes(data.industry)) {
            preferredIndustries.push(data.industry);
            preference.preferredIndustries = JSON.stringify(preferredIndustries);
          }
          break;
      }

      const scanCount = JSON.parse(preference.scanHistory || '[]').length;
      const materialViewCount = JSON.parse(preference.materialViewHistory || '[]').length;
      
      const totalActivity = scanCount + materialViewCount;
      if (totalActivity > 50) {
        preference.activityLevel = 'high';
      } else if (totalActivity > 20) {
        preference.activityLevel = 'medium';
      } else {
        preference.activityLevel = 'low';
      }

      await preference.save();

      logger.info(`Updated preference for user ${userId}, action: ${action}`);
      
      return { success: true };
    } catch (error) {
      logger.error('Error updating preference:', error);
      return { success: false, message: '更新偏好失败' };
    }
  }

  async getRecommendations(userId, exhibitionId, pageNum = 1, pageSize = 10) {
    try {
      const user = await User.findOne({ where: { userId } });
      if (!user) {
        throw new Error('User not found');
      }

      const { count, rows } = await AIRecommendation.findAndCountAll({
        where: {
          userId: user.id,
          exhibitionId
        },
        include: [{
          model: Merchant,
          attributes: ['merchantId', 'merchantName', 'industry', 'logo', 'boothNumber', 'hasVirtualRoom']
        }],
        order: [['matchScore', 'DESC'], [['createdAt', 'DESC']]],
        limit: parseInt(pageSize),
        offset: (parseInt(pageNum) - 1) * parseInt(pageSize)
      });

      return {
        success: true,
        total: count,
        list: rows.map(rec => ({
          recommendationId: rec.recommendationId,
          merchant: rec.Merchant,
          matchScore: rec.matchScore,
          matchReason: rec.matchReason,
          isViewed: rec.isViewed,
          isConnected: rec.isConnected,
          createdAt: rec.createdAt
        }))
      };
    } catch (error) {
      logger.error('Error getting recommendations:', error);
      return { success: false, message: '获取推荐列表失败' };
    }
  }

  async markAsViewed(recommendationId) {
    try {
      await AIRecommendation.update(
        { isViewed: true, viewedAt: new Date() },
        { where: { recommendationId } }
      );
      return { success: true };
    } catch (error) {
      logger.error('Error marking recommendation as viewed:', error);
      return { success: false, message: '标记失败' };
    }
  }
}

module.exports = new AIRecommendService();
