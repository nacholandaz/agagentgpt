// Quick test to see if simulator route is working
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/simulator',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse length:', data.length);
    if (data.length > 0) {
      console.log('First 200 chars:', data.substring(0, 200));
      if (data.includes('<!DOCTYPE html>')) {
        console.log('\n✅ HTML is being returned!');
      } else {
        console.log('\n❌ No HTML found');
      }
    } else {
      console.log('\n❌ Empty response');
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
  console.log('\n❌ Server is not running or not accessible');
});

req.end();

