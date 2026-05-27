const http = require('http');

console.log('Checking port 5000...');
const req = http.get('http://localhost:5000/api/v1/docs-json', (res) => {
  console.log('Response status:', res.statusCode);
  process.exit(0);
});

req.on('error', (err) => {
  console.error('Error connecting to port 5000:', err.message);
  process.exit(1);
});

req.end();
