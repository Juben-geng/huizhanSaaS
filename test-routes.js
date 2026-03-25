const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    console.log('Response Body:', body);
  });
});

req.on('error', (error) => {
  console.error('Request Error:', error);
});

req.end();
