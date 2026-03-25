const express = require('express');
const router = express.Router();
const aiRecommendService = require('../services/aiRecommendService');

router.post('/generate', async (req, res) => {
  try {
    const { userId, exhibitionId, limit = 10 } = req.body;

    const result = await aiRecommendService.generateRecommendations(userId, exhibitionId, limit);

    if (result.success) {
      res.json({
        code: 200,
        msg: '生成成功',
        data: result.recommendations
      });
    } else {
      res.status(500).json({
        code: 500,
        msg: result.message,
        data: null
      });
    }
  } catch (error) {
    req.logger.error('Generate recommendations error:', error);
    res.status(500).json({
      code: 500,
      msg: '生成推荐失败',
      data: null
    });
  }
});

router.get('/list', async (req, res) => {
  try {
    const { userId, exhibitionId, pageNum = 1, pageSize = 10 } = req.query;

    const result = await aiRecommendService.getRecommendations(userId, exhibitionId, pageNum, pageSize);

    if (result.success) {
      res.json({
        code: 200,
        msg: '获取成功',
        data: {
          total: result.total,
          list: result.list
        }
      });
    } else {
      res.status(500).json({
        code: 500,
        msg: result.message,
        data: null
      });
    }
  } catch (error) {
    req.logger.error('Get recommendations error:', error);
    res.status(500).json({
      code: 500,
      msg: '获取推荐列表失败',
      data: null
    });
  }
});

router.put('/view', async (req, res) => {
  try {
    const { recommendationId } = req.body;

    const result = await aiRecommendService.markAsViewed(recommendationId);

    if (result.success) {
      res.json({
        code: 200,
        msg: '标记成功',
        data: null
      });
    } else {
      res.status(500).json({
        code: 500,
        msg: result.message,
        data: null
      });
    }
  } catch (error) {
    req.logger.error('Mark recommendation as viewed error:', error);
    res.status(500).json({
      code: 500,
      msg: '标记失败',
      data: null
    });
  }
});

router.post('/preference/scan', async (req, res) => {
  try {
    const { userId, merchantId, industry } = req.body;

    const result = await aiRecommendService.updatePreference(userId, 'scan', {
      merchantId,
      industry
    });

    if (result.success) {
      res.json({
        code: 200,
        msg: '记录成功',
        data: null
      });
    } else {
      res.status(500).json({
        code: 500,
        msg: result.message,
        data: null
      });
    }
  } catch (error) {
    req.logger.error('Record scan preference error:', error);
    res.status(500).json({
      code: 500,
      msg: '记录失败',
      data: null
    });
  }
});

router.post('/preference/view-material', async (req, res) => {
  try {
    const { userId, materialId, industry } = req.body;

    const result = await aiRecommendService.updatePreference(userId, 'view_material', {
      materialId,
      industry
    });

    if (result.success) {
      res.json({
        code: 200,
        msg: '记录成功',
        data: null
      });
    } else {
      res.status(500).json({
        code: 500,
        msg: result.message,
        data: null
      });
    }
  } catch (error) {
    req.logger.error('Record material view preference error:', error);
    res.status(500).json({
      code: 500,
      msg: '记录失败',
      data: null
    });
  }
});

router.post('/preference/search', async (req, res) => {
  try {
    const { userId, keyword } = req.body;

    const result = await aiRecommendService.updatePreference(userId, 'search', {
      keyword
    });

    if (result.success) {
      res.json({
        code: 200,
        msg: '记录成功',
        data: null
      });
    } else {
      res.status(500).json({
        code: 500,
        msg: result.message,
        data: null
      });
    }
  } catch (error) {
    req.logger.error('Record search preference error:', error);
    res.status(500).json({
      code: 500,
      msg: '记录失败',
      data: null
    });
  }
});

router.post('/preference/industry', async (req, res) => {
  try {
    const { userId, industry } = req.body;

    const result = await aiRecommendService.updatePreference(userId, 'update_industry', {
      industry
    });

    if (result.success) {
      res.json({
        code: 200,
        msg: '更新成功',
        data: null
      });
    } else {
      res.status(500).json({
        code: 500,
        msg: result.message,
        data: null
      });
    }
  } catch (error) {
    req.logger.error('Update industry preference error:', error);
    res.status(500).json({
      code: 500,
      msg: '更新失败',
      data: null
    });
  }
});

module.exports = router;
