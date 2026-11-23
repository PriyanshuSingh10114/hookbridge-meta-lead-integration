const http = require('http');

const name = process.argv[2] || 'Bruce Wayne';
const email = process.argv[3] || 'bruce@wayne-enterprises.com';
const phone = process.argv[4] || '+1-555-BATMAN';

const payload = JSON.stringify({ name, email, phone });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/leads/test',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => (data += chunk));
  res.on('end', () => {
    if (res.statusCode === 201) {
      console.log(`Lead created: "${name}" (${email})`);
    } else {
      console.error(`Server error (${res.statusCode}): ${data}`);
    }
  });
});

req.on('error', err => {
  console.error('Could not reach backend on http://localhost:5000:', err.message);
});

req.write(payload);
req.end();
