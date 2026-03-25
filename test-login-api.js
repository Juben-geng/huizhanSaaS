const axios = require('axios');

async function testLogin() {
  console.log('🧪 开始测试登录功能...\n');

  const loginData = {
    username: 'teacher',
    password: 'teacher123456'
  };

  try {
    console.log('📤 发送登录请求...');
    console.log(`   URL: http://localhost:3001/api/platform/auth/login`);
    console.log(`   用户名: ${loginData.username}`);
    console.log(`   密码: ${loginData.password}\n`);

    const response = await axios.post(
      'http://localhost:3001/api/platform/auth/login',
      loginData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ 登录成功！');
    console.log('📦 响应数据:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.code === 200) {
      console.log('\n✨ 登录测试通过！');
      console.log(`   Token: ${response.data.data.token.substring(0, 20)}...`);
      console.log(`   用户名: ${response.data.data.username}`);
      console.log(`   角色: ${response.data.data.role}`);
      return true;
    } else {
      console.log('\n❌ 登录失败：返回码不是 200');
      return false;
    }

  } catch (error) {
    console.log('\n❌ 登录测试失败！');
    if (error.response) {
      console.log('   状态码:', error.response.status);
      console.log('   错误信息:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('   错误: 无法连接到服务器');
      console.log('   请确保后端服务器正在运行在 http://localhost:3001');
    } else {
      console.log('   错误:', error.message);
    }
    return false;
  }
}

testLogin()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('测试出错:', err);
    process.exit(1);
  });