const http = require('http');
const data = JSON.stringify({ username: 'teacher', password: 'teacher123456' });
const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/platform/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
}, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', body);
  });
});
req.on('error', (e) => { console.error('Error:', e.message); });
req.write(data);
req.end();
setTimeout(() => process.exit(0), 5000);
