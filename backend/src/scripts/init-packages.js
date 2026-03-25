const db = require('../models');

const packages = [
  {
    packageId: 'pkg-free',
    name: '基础版',
    type: 'free',
    price: 0,
    period: '年',
    limitExhibitions: 1,
    limitMerchants: 10,
    limitVisitors: 100,
    limitStorage: 1,
    features: JSON.stringify(['基础展会管理', '10个展位', '100位访客', '1GB存储空间', '基础数据统计']),
    status: 'active',
    userCount: 0
  },
  {
    packageId: 'pkg-professional',
    name: '专业版',
    type: 'professional',
    price: 9999,
    period: '年',
    limitExhibitions: 5,
    limitMerchants: 50,
    limitVisitors: 1000,
    limitStorage: 10,
    features: JSON.stringify(['高级展会管理', '50个展位', '1000位访客', '10GB存储空间', '高级数据统计', 'AI推荐', '虚拟展厅基础版']),
    status: 'active',
    userCount: 0
  },
  {
    packageId: 'pkg-enterprise',
    name: '企业版',
    type: 'enterprise',
    price: 29999,
    period: '年',
    limitExhibitions: 20,
    limitMerchants: 200,
    limitVisitors: 5000,
    limitStorage: 50,
    features: JSON.stringify(['企业级展会管理', '200个展位', '5000位访客', '50GB存储空间', '企业数据统计', 'AI智能推荐', '虚拟展厅高级版', '专属客服', 'API接口']),
    status: 'active',
    userCount: 0
  },
  {
    packageId: 'pkg-flagship',
    name: '旗舰版',
    type: 'flagship',
    price: 99999,
    period: '年',
    limitExhibitions: -1,
    limitMerchants: -1,
    limitVisitors: -1,
    limitStorage: 200,
    features: JSON.stringify(['无限制展会管理', '无限展位', '无限访客', '200GB存储空间', '旗舰数据统计', 'AI高级推荐', '虚拟展厅旗舰版', '专属客服团队', '完整API接口', '定制开发', '专属服务器']),
    status: 'active',
    userCount: 0
  }
];

async function initPackages() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established successfully.');

    await db.Package.sync({ force: false });
    console.log('Packages table synced.');

    for (const pkg of packages) {
      const [package, created] = await db.Package.findOrCreate({
        where: { packageId: pkg.packageId },
        defaults: pkg
      });

      if (created) {
        console.log(`Created package: ${pkg.name}`);
      } else {
        console.log(`Package already exists: ${pkg.name}`);
      }
    }

    console.log('Package initialization completed.');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing packages:', error);
    process.exit(1);
  }
}

initPackages();
