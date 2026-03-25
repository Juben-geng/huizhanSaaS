const http = require('http');

function testLogin(username, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ username, password });

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

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ statusCode: res.statusCode, body: result });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('测试 Teacher 登录...\n');
  
  try {
    const result = await testLogin('teacher', 'teacher123456');
    console.log('状态码:', result.statusCode);
    console.log('响应:', JSON.stringify(result.body, null, 2));
  } catch (error) {
    console.error('错误:', error.message);
  }

  process.exit(0);
}

main();
