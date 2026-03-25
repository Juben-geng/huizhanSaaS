const http = require('http');

console.log('正在测试教师登录...\n');

const data = JSON.stringify({
  username: 'teacher',
  password: 'teacher123456'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/platform/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('发送请求到:', `http://localhost:3001/api/platform/auth/login`);
console.log('用户名: teacher');
console.log('密码: teacher123456');
console.log('\n等待响应...\n');

const req = http.request(options, (res) => {
  let body = '';
  
  console.log('✓ 连接成功');
  console.log(`状态码: ${res.statusCode}`);
  console.log(`响应头: ${JSON.stringify(res.headers, null, 2)}\n`);
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('响应内容:');
    console.log('─'.repeat(60));
    console.log(body);
    console.log('─'.repeat(60));
    
    try {
      const response = JSON.parse(body);
      if (response.code === 200) {
        console.log('\n✅ 登录成功!');
        console.log(`Token: ${response.data.token.substring(0, 50)}...`);
        console.log('\n用户信息:');
        console.log(JSON.stringify(response.data.user, null, 2));
        process.exit(0);
      } else {
        console.log('\n❌ 登录失败:', response.msg);
        process.exit(1);
      }
    } catch (e) {
      console.log('\n❌ 解析响应失败:', e.message);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ 请求失败!');
  console.error('错误信息:', error.message);
  console.error('\n可能的原因:');
  console.error('1. 后端服务器未启动');
  console.error('2. 端口3001被占用');
  console.error('3. 网络连接问题');
  process.exit(1);
});

req.setTimeout(10000, () => {
  console.error('\n❌ 请求超时!');
  console.error('服务器在10秒内没有响应');
  req.abort();
  process.exit(1);
});

req.write(data);
req.end();
