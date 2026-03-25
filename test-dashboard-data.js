const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testDashboardData() {
  console.log('🧪 开始测试 Dashboard 数据获取...\n');

  try {
    console.log('📤 步骤 1: 登录获取 Token...');
    const loginResponse = await axios.post(`${BASE_URL}/api/platform/auth/login`, {
      username: 'teacher',
      password: 'teacher123456'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功\n');

    console.log('📤 步骤 2: 获取 Dashboard 数据...');
    const dashboardResponse = await axios.get(
      `${BASE_URL}/api/platform/dashboard/recent-data`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('✅ 数据获取成功！');
    console.log('\n📦 Dashboard 数据:');
    console.log(JSON.stringify(dashboardResponse.data, null, 2));

    if (dashboardResponse.data.code === 200) {
      const { organizers, exhibitions } = dashboardResponse.data.data;
      console.log(`\n✨ 测试通过！`);
      console.log(`   - 最近主办方: ${organizers.length} 条`);
      console.log(`   - 最近展会: ${exhibitions.length} 条`);
      return true;
    } else {
      console.log('\n❌ 返回码不是 200');
      return false;
    }

  } catch (error) {
    console.log('\n❌ 测试失败！');
    if (error.response) {
      console.log('   状态码:', error.response.status);
      console.log('   错误信息:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('   错误: 无法连接到服务器');
    } else {
      console.log('   错误:', error.message);
    }
    return false;
  }
}

testDashboardData()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('测试出错:', err);
    process.exit(1);
  });