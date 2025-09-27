const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/subscription/plans',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response data:', data);
    console.log('Response length:', data.length);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();