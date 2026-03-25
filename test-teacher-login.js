const http = require('http');

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

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    console.log('Response Headers:', res.headers);
    console.log('Response Body:', body);
    
    try {
      const response = JSON.parse(body);
      if (response.code === 200) {
        console.log('\n✅ Teacher Login SUCCESS!');
        console.log('Token:', response.data.token);
        console.log('User:', JSON.stringify(response.data.user, null, 2));
      } else {
        console.log('\n❌ Teacher Login FAILED:', response.msg);
      }
    } catch (e) {
      console.log('\n❌ Failed to parse response:', e.message);
    }
  });
});

req.on('error', (error) => {
  console.error('Request Error:', error);
});

req.write(data);
req.end();
